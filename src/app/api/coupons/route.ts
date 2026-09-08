import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json({ error: 'Phone number required.' }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({ where: { phone } });
    if (!customer) {
      return NextResponse.json({ available: [], used: [], expired: [] });
    }

    // Auto-expire coupons that have passed their expiry date
    await prisma.coupon.updateMany({
      where: {
        customerId: customer.id,
        status: 'AVAILABLE',
        expiresAt: { lt: new Date() },
      },
      data: { status: 'EXPIRED' },
    });

    const coupons = await prisma.coupon.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: 'desc' },
    });

    const available = coupons.filter((c) => c.status === 'AVAILABLE');
    const used = coupons.filter((c) => c.status === 'USED');
    const expired = coupons.filter((c) => c.status === 'EXPIRED');

    return NextResponse.json({ available, used, expired });
  } catch (error: any) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
