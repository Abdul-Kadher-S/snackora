import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkOfferTiming } from '@/lib/offer-timing';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, subtotal, phone } = body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return NextResponse.json({ error: 'Please enter a coupon code.' }, { status: 400 });
    }

    const normalizedCode = code.trim().toUpperCase();
    const numSubtotal = parseFloat(subtotal) || 0;
    let cleanPhone = (phone || '').replace(/\D/g, '');
    if (cleanPhone.length > 10 && cleanPhone.startsWith('91')) {
      cleanPhone = cleanPhone.slice(-10);
    }

    // 1. Look up admin-created coupon in Offer table
    const offer = await prisma.offer.findUnique({
      where: { code: normalizedCode },
    });

    if (!offer) {
      return NextResponse.json(
        { error: `Coupon code "${normalizedCode}" does not exist. Please check the code and try again.` },
        { status: 404 }
      );
    }

    // 2. Check timing (start date, expiry date, daily recurring window)
    const timing = checkOfferTiming(offer);
    if (!timing.valid) {
      return NextResponse.json(
        { error: timing.reason },
        { status: 400 }
      );
    }

    // 3. Check if active
    if (!offer.active) {
      return NextResponse.json(
        { error: `Coupon code "${offer.code}" is currently deactivated or no longer available.` },
        { status: 400 }
      );
    }

    // 4. Minimum order value check with exact deficit
    if (offer.minOrderValue > 0 && numSubtotal < offer.minOrderValue) {
      const deficit = Math.ceil(offer.minOrderValue - numSubtotal);
      return NextResponse.json(
        {
          error: `Minimum order value of ₹${offer.minOrderValue} required for coupon ${offer.code}. Add snacks worth ₹${deficit} more to redeem.`,
        },
        { status: 400 }
      );
    }

    // 5. One-time per customer check (only if oncePerCustomer is enabled for this offer)
    if (offer.oncePerCustomer !== false && cleanPhone.length === 10) {
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
            error: `You have already used coupon code ${offer.code} on previous order #${pastUsedOrder.orderNumber}. This coupon is strictly limited to 1 use per customer.`,
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
