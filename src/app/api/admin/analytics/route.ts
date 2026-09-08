import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Today's date boundary
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      allOrders,
      todayOrders,
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      recentOrders,
      allOrderItems,
      categories,
    ] = await Promise.all([
      prisma.order.findMany({ select: { total: true, status: true, createdAt: true } }),
      prisma.order.findMany({
        where: { createdAt: { gte: todayStart } },
        select: { total: true, status: true },
      }),
      prisma.product.count({ where: { available: true } }),
      prisma.product.count({ where: { stock: { gt: 0, lte: 10 } } }),
      prisma.product.count({ where: { stock: 0 } }),
      prisma.order.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
        },
      }),
      prisma.orderItem.findMany({
        select: {
          productId: true,
          productName: true,
          quantity: true,
          subtotal: true,
        },
      }),
      prisma.category.findMany({
        include: {
          products: {
            select: { id: true },
          },
        },
      }),
    ]);

    // Calculate metrics
    const totalRevenue = allOrders.reduce((sum, o) => sum + (o.status !== 'CANCELLED' ? o.total : 0), 0);
    const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.status !== 'CANCELLED' ? o.total : 0), 0);

    const pendingOrdersCount = allOrders.filter((o) =>
      ['ORDER_RECEIVED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY'].includes(o.status)
    ).length;

    const deliveredOrdersCount = allOrders.filter((o) => o.status === 'DELIVERED').length;
    const cancelledOrdersCount = allOrders.filter((o) => o.status === 'CANCELLED').length;

    // Top selling products
    const productSalesMap = new Map<string, { name: string; count: number; revenue: number }>();
    allOrderItems.forEach((item) => {
      const existing = productSalesMap.get(item.productId) || { name: item.productName, count: 0, revenue: 0 };
      existing.count += item.quantity;
      existing.revenue += item.subtotal;
      productSalesMap.set(item.productId, existing);
    });

    const topSellingProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Sales over last 7 days
    const last7Days: { date: string; orders: number; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      const dayOrders = allOrders.filter((o) => {
        const od = new Date(o.createdAt);
        return od >= dayStart && od <= dayEnd && o.status !== 'CANCELLED';
      });

      last7Days.push({
        date: dateStr,
        orders: dayOrders.length,
        revenue: dayOrders.reduce((acc, curr) => acc + curr.total, 0),
      });
    }

    return NextResponse.json({
      totalRevenue,
      todayRevenue,
      totalOrdersCount: allOrders.length,
      todayOrdersCount: todayOrders.length,
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      pendingOrdersCount,
      deliveredOrdersCount,
      cancelledOrdersCount,
      recentOrders,
      topSellingProducts,
      last7Days,
      categoriesCount: categories.length,
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to compute analytics' }, { status: 500 });
  }
}
