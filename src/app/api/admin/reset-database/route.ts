import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin login required to reset store data.' },
        { status: 401 }
      );
    }

    // Execute atomic cleanup of all dummy data
    await prisma.$transaction(async (tx) => {
      // 1. Delete order items and orders
      await tx.orderItem.deleteMany({});
      await tx.order.deleteMany({});

      // 2. Delete loyalty transactions, coupons, and notifications
      await tx.snackpointTransaction.deleteMany({});
      await tx.coupon.deleteMany({});
      await tx.notification.deleteMany({});

      // 3. Delete all products and categories
      await tx.product.deleteMany({});
      await tx.category.deleteMany({});
    });

    return NextResponse.json({
      success: true,
      message: 'All dummy categories, products, orders, and customer activity have been completely cleared.',
    });
  } catch (error: any) {
    console.error('Error resetting store data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reset store data.' },
      { status: 500 }
    );
  }
}
