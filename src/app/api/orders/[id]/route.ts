import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';
import { broadcastOrderEvent, broadcastProductEvent } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Search by either UUID or orderNumber (6-digit or legacy HB-XXXX)
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        items: {
          include: {
            product: {
              select: { imageUrl: true, foodType: true, brand: true, earnSnackpoints: true },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Admin login required.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const validStatuses = [
      'ORDER_RECEIVED',
      'CONFIRMED',
      'PREPARING',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED',
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid order status value' }, { status: 400 });
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Find customer
    const customer = await prisma.customer.findUnique({
      where: { phone: existingOrder.phone },
    });

    await prisma.$transaction(async (tx) => {
      // === CANCELLED: Restore stock + cancel pending points ===
      if (status === 'CANCELLED' && existingOrder.status !== 'CANCELLED') {
        // Restore stock
        for (const item of existingOrder.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }

        // Cancel pending SnackPoints
        if (customer) {
          const pendingTxns = await tx.snackpointTransaction.findMany({
            where: {
              orderId: existingOrder.id,
              type: 'PENDING_EARN',
              status: 'PENDING',
            },
          });

          for (const txn of pendingTxns) {
            await tx.snackpointTransaction.update({
              where: { id: txn.id },
              data: { status: 'CANCELLED' },
            });
            await tx.customer.update({
              where: { id: customer.id },
              data: { pendingSnackpoints: { decrement: txn.points } },
            });
          }

          // Restore coupon if used
          if (existingOrder.couponId) {
            await tx.coupon.update({
              where: { id: existingOrder.couponId },
              data: { status: 'AVAILABLE', usedAt: null, usedOrderId: null },
            });
          }

          // Send cancellation notification
          await tx.notification.create({
            data: {
              customerId: customer.id,
              title: '❌ Order Cancelled',
              message: `Your order #${existingOrder.orderNumber} has been cancelled.`,
              type: 'ORDER',
            },
          });
        }
      }

      // === DELIVERED: Credit SnackPoints ===
      if (status === 'DELIVERED' && existingOrder.status !== 'DELIVERED') {
        if (customer && existingOrder.snackpointsEarned > 0) {
          // Move pending → completed
          const pendingTxns = await tx.snackpointTransaction.findMany({
            where: {
              orderId: existingOrder.id,
              type: 'PENDING_EARN',
              status: 'PENDING',
            },
          });

          for (const txn of pendingTxns) {
            await tx.snackpointTransaction.update({
              where: { id: txn.id },
              data: {
                type: 'EARN',
                status: 'COMPLETED',
                description: `Earned ${txn.points} points for order #${existingOrder.orderNumber}`,
              },
            });
          }

          // Update customer balance
          await tx.customer.update({
            where: { id: customer.id },
            data: {
              availableSnackpoints: { increment: existingOrder.snackpointsEarned },
              pendingSnackpoints: { decrement: existingOrder.snackpointsEarned },
              totalEarned: { increment: existingOrder.snackpointsEarned },
            },
          });

          // SnackPoints notification
          await tx.notification.create({
            data: {
              customerId: customer.id,
              title: '⭐ SnackPoints Earned!',
              message: `You earned ${existingOrder.snackpointsEarned} SnackPoints from order #${existingOrder.orderNumber}. Redeem them for Snackora coupons!`,
              type: 'SNACKPOINTS',
            },
          });
        }

        if (customer) {
          await tx.notification.create({
            data: {
              customerId: customer.id,
              title: '✅ Order Delivered!',
              message: `Your order #${existingOrder.orderNumber} has been delivered. Enjoy your snacks!`,
              type: 'ORDER',
            },
          });
        }
      }

      // === Status-specific notifications ===
      if (customer) {
        if (status === 'CONFIRMED' && existingOrder.status !== 'CONFIRMED') {
          await tx.notification.create({
            data: {
              customerId: customer.id,
              title: '✅ Order Confirmed',
              message: `Your order #${existingOrder.orderNumber} has been confirmed and accepted!`,
              type: 'ORDER',
            },
          });
        }
        if (status === 'PREPARING' && existingOrder.status !== 'PREPARING') {
          await tx.notification.create({
            data: {
              customerId: customer.id,
              title: '🍳 Preparing Your Order',
              message: `Your order #${existingOrder.orderNumber} is being prepared.`,
              type: 'ORDER',
            },
          });
        }
        if (status === 'OUT_FOR_DELIVERY' && existingOrder.status !== 'OUT_FOR_DELIVERY') {
          await tx.notification.create({
            data: {
              customerId: customer.id,
              title: '🚴 Out for Delivery!',
              message: `Your order #${existingOrder.orderNumber} is on its way to ${existingOrder.hostel}, Room ${existingOrder.roomNumber}!`,
              type: 'ORDER',
            },
          });
        }
      }

      // Update order status
      await tx.order.update({
        where: { id },
        data: { status },
      });
    });

    const updated = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (updated) {
      broadcastOrderEvent('ORDER_UPDATED', updated);
      if (status === 'CANCELLED') {
        try {
          revalidatePath('/', 'layout');
          revalidatePath('/');
          revalidatePath('/search');
        } catch {}
        for (const item of existingOrder.items) {
          try {
            broadcastProductEvent('STOCK_UPDATED', { id: item.productId });
          } catch {}
        }
      }
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: error.message || 'Failed to update order' }, { status: 500 });
  }
}
