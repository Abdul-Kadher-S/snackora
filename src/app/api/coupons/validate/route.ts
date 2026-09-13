import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, subtotal, phone } = body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return NextResponse.json({ error: 'Please enter a coupon code.' }, { status: 400 });
    }

    const normalizedCode = code.trim().toUpperCase();
    const numSubtotal = parseFloat(subtotal) || 0;
    const cleanPhone = (phone || '').replace(/\D/g, '');

    // 1. Look up admin-created coupon in Offer table
    const offer = await prisma.offer.findUnique({
      where: { code: normalizedCode },
    });

    if (!offer) {
      return NextResponse.json({ error: `Coupon code "${normalizedCode}" is invalid.` }, { status: 404 });
    }

    if (!offer.active) {
      return NextResponse.json({ error: `Coupon code "${offer.code}" is no longer active.` }, { status: 400 });
    }

    // 2. Minimum order value check
    if (offer.minOrderValue > 0 && numSubtotal < offer.minOrderValue) {
      return NextResponse.json(
        {
          error: `Minimum order value of ₹${offer.minOrderValue} required for coupon ${offer.code}. (Your subtotal is ₹${numSubtotal.toFixed(0)})`,
        },
        { status: 400 }
      );
    }

    // 3. One-time per customer check
    if (cleanPhone.length === 10) {
      const pastUsedOrder = await prisma.order.findFirst({
        where: {
          phone: cleanPhone,
          couponCode: offer.code,
          status: { not: 'CANCELLED' },
        },
      });

      if (pastUsedOrder) {
        return NextResponse.json(
          {
            error: `You have already used coupon code ${offer.code} on a previous order (${pastUsedOrder.orderNumber}). Coupons can only be used once per customer.`,
          },
          { status: 400 }
        );
      }
    }

    // 4. Calculate discount
    let discountAmount = 0;
    if (offer.discountType === 'PERCENTAGE') {
      discountAmount = Math.round((numSubtotal * offer.discountValue) / 100);
    } else {
      discountAmount = offer.discountValue;
    }
    discountAmount = Math.min(discountAmount, numSubtotal);

    return NextResponse.json({
      valid: true,
      code: offer.code,
      title: offer.title,
      description: offer.description,
      discountType: offer.discountType,
      discountValue: offer.discountValue,
      minOrderValue: offer.minOrderValue,
      discountAmount,
    });
  } catch (error: any) {
    console.error('Error validating coupon code:', error);
    return NextResponse.json({ error: 'Failed to validate coupon code.' }, { status: 500 });
  }
}
