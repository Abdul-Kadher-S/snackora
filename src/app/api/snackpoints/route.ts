import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json({ error: 'Phone number required.' }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { phone },
      include: {
        snackpointTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!customer) {
      return NextResponse.json({
        availableSnackpoints: 0,
        pendingSnackpoints: 0,
        totalEarned: 0,
        totalRedeemed: 0,
        transactions: [],
      });
    }

    return NextResponse.json({
      availableSnackpoints: customer.availableSnackpoints,
      pendingSnackpoints: customer.pendingSnackpoints,
      totalEarned: customer.totalEarned,
      totalRedeemed: customer.totalRedeemed,
      transactions: customer.snackpointTransactions,
    });
  } catch (error: any) {
    console.error('Error fetching SnackPoints:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}

// Redeem SnackPoints for coupon
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, points } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Phone number required.' }, { status: 400 });
    }

    // Validate redemption tier
    const tiers: Record<number, number> = {
      100: 5,
      200: 10,
      300: 15,
      400: 20,
    };

    const couponValue = tiers[points];
    if (!couponValue) {
      return NextResponse.json({ error: 'Invalid redemption amount. Choose 100, 200, 300, or 400 points.' }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({ where: { phone } });
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
    }

    if (customer.availableSnackpoints < points) {
      return NextResponse.json({ error: `Insufficient SnackPoints. You have ${customer.availableSnackpoints} available.` }, { status: 400 });
    }

    // Create coupon with 7-day validity
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const result = await prisma.$transaction(async (tx) => {
      // Deduct points
      await tx.customer.update({
        where: { id: customer.id },
        data: {
          availableSnackpoints: { decrement: points },
          totalRedeemed: { increment: points },
        },
      });

      // Create redemption transaction
      await tx.snackpointTransaction.create({
        data: {
          customerId: customer.id,
          points: -points,
          type: 'REDEEM',
          status: 'COMPLETED',
          description: `Redeemed ${points} points for ₹${couponValue} coupon`,
        },
      });

      // Create coupon
      const coupon = await tx.coupon.create({
        data: {
          customerId: customer.id,
          pointsSpent: points,
          value: couponValue,
          status: 'AVAILABLE',
          expiresAt,
        },
      });

      // Notification
      await tx.notification.create({
        data: {
          customerId: customer.id,
          title: '🎟️ New Coupon Created!',
          message: `You redeemed ${points} SnackPoints for a ₹${couponValue} Snackora coupon. Valid for 7 days until ${expiresAt.toLocaleDateString('en-IN')}.`,
          type: 'COUPON',
        },
      });

      return coupon;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error redeeming SnackPoints:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
