import { NextRequest, NextResponse, after } from 'next/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { broadcastOrderEvent, broadcastProductEvent } from '@/lib/supabase';
import { sendTelegramOrderNotification } from '@/lib/telegram';
import { hashCustomerPin, verifyCustomerPin, signCustomerToken, CUSTOMER_COOKIE_NAME } from '@/lib/customer-auth';
import { ensureDbColumns } from '@/lib/db-init';
import { checkOfferTiming } from '@/lib/offer-timing';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const phone = searchParams.get('phone');
    const search = searchParams.get('search');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (phone) {
      where.phone = phone.trim();
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      where.OR = [
        { orderNumber: { contains: q } },
        { customerName: { contains: q } },
        { phone: { contains: q } },
        { roomNumber: { contains: q } },
        { hostel: { contains: q } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        items: {
          include: {
            product: {
              select: { imageUrl: true, foodType: true },
            },
          },
        },
      },
    });

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Run column check non-blocking in background so it never slows down checkout
  ensureDbColumns().catch(() => {});

  try {
    const body = await request.json();
    const { customerName, phone, hostel, roomNumber, deliveryNote, items, couponId, couponCode, pin, confirmPin } = body;

    // === STRICT MUTUAL EXCLUSIVITY ===
    // A customer cannot redeem both a SnackPoints coupon and an admin promo code on the same order
    if (couponId && couponCode) {
      return NextResponse.json(
        { error: 'Only 1 coupon discount can be redeemed per order. Choose either a SnackPoints coupon or a promo code, not both.' },
        { status: 400 }
      );
    }

    // === NAME VALIDATION ===
    if (!customerName || typeof customerName !== 'string' || customerName.trim().length < 2) {
      return NextResponse.json({ error: 'Please provide your full name.' }, { status: 400 });
    }
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(customerName.trim())) {
      return NextResponse.json({ error: 'Please enter your name using letters only. Numbers and special characters are not allowed.' }, { status: 400 });
    }

    // === PHONE VALIDATION ===
    let cleanPhone = (phone || '').replace(/\D/g, '');
    if (cleanPhone.length > 10 && cleanPhone.startsWith('91')) {
      cleanPhone = cleanPhone.slice(-10);
    }
    if (cleanPhone.length !== 10) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit mobile number using numbers only.' }, { status: 400 });
    }
    if (!/^[6-9]/.test(cleanPhone)) {
      return NextResponse.json({ error: 'Please enter a valid Indian mobile number.' }, { status: 400 });
    }

    // === HOSTEL VALIDATION ===
    if (!hostel || !hostel.trim()) {
      return NextResponse.json({ error: 'Please select your hostel block.' }, { status: 400 });
    }

    const hostelName = hostel.split(' — ')[0].trim();
    const deliverySettingKeys: Record<string, string> = {
      'Annex': 'annex_delivery_enabled',
      'Noyyal New Block': 'noyyal_new_delivery_enabled',
      'Noyyal Old Block': 'noyyal_delivery_enabled',
      'Noyyal New': 'noyyal_new_delivery_enabled',
      'Noyyal': 'noyyal_delivery_enabled',
    };
    const settingKey = deliverySettingKeys[hostelName];
    if (!settingKey) {
      return NextResponse.json({ error: 'Invalid hostel block selected.' }, { status: 400 });
    }

    // === ROOM VALIDATION ===
    if (!roomNumber || !roomNumber.trim()) {
      return NextResponse.json({ error: 'Please enter your room number.' }, { status: 400 });
    }

    // === CART VALIDATION ===
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Your cart is empty. Please add snacks to place an order.' }, { status: 400 });
    }

    // Compute Indian Standard Time date prefix for 7-digit order number
    const now = new Date();
    const istDate = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    const dd = String(istDate.getUTCDate()).padStart(2, '0');
    const mm = String(istDate.getUTCMonth() + 1).padStart(2, '0');
    const prefix = `${dd}${mm}`;

    // === BATCH ALL PRE-CHECK QUERIES IN A SINGLE PARALLEL ROUNDTRIP ===
    const productIds = items.map((i: any) => i.productId);
    const neededSettings = [settingKey, 'delivery_charge', 'free_delivery_threshold'];
    const normalizedPromoCode = couponCode && typeof couponCode === 'string' && couponCode.trim()
      ? couponCode.trim().toUpperCase()
      : null;

    const [
      dbProducts,
      settingsList,
      prefetchedCustomer,
      latestOrderToday,
      prefetchedCoupon,
      prefetchedOffer,
      pastUsedPromoOrder,
    ] = await Promise.all([
      prisma.product.findMany({ where: { id: { in: productIds } } }),
      prisma.storeSetting.findMany({ where: { key: { in: neededSettings } } }),
      prisma.customer.findUnique({ where: { phone: cleanPhone } }),
      prisma.order.findFirst({
        where: { orderNumber: { startsWith: prefix } },
        select: { orderNumber: true },
        orderBy: { orderNumber: 'desc' },
      }),
      couponId ? prisma.coupon.findUnique({ where: { id: couponId } }) : Promise.resolve(null),
      normalizedPromoCode ? prisma.offer.findUnique({ where: { code: normalizedPromoCode } }) : Promise.resolve(null),
      normalizedPromoCode
        ? prisma.order.findFirst({
            where: {
              phone: cleanPhone,
              couponCode: normalizedPromoCode,
              status: { not: 'CANCELLED' },
            },
            select: { id: true, orderNumber: true },
          })
        : Promise.resolve(null),
    ]);

    const settingsMap = new Map(settingsList.map((s) => [s.key, s.value]));

    // Check hostel delivery availability
    const hostelSettingVal = settingsMap.get(settingKey);
    if (hostelSettingVal === 'false') {
      return NextResponse.json(
        { error: `🚫 Delivery is currently unavailable for ${hostelName}. Please try again later.` },
        { status: 400 }
      );
    }

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    let calculatedSubtotal = 0;
    let snackpointsEligibleAmount = 0;
    const validatedItems: {
      productId: string;
      productName: string;
      price: number;
      quantity: number;
      subtotal: number;
    }[] = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json({ error: `Product not found in current catalog.` }, { status: 400 });
      }

      if (!product.available) {
        return NextResponse.json(
          { error: `"${product.name}" is currently unavailable. Please remove it from your cart.` },
          { status: 400 }
        );
      }

      const qty = parseInt(item.quantity);
      if (isNaN(qty) || qty < 1) {
        return NextResponse.json({ error: `Invalid quantity for ${product.name}.` }, { status: 400 });
      }

      if (product.stock < qty) {
        return NextResponse.json(
          {
            error: `Only ${product.stock} units of "${product.name}" are currently available. Please update your cart.`,
          },
          { status: 400 }
        );
      }

      const itemSubtotal = product.price * qty;
      calculatedSubtotal += itemSubtotal;

      if (product.earnSnackpoints) {
        snackpointsEligibleAmount += itemSubtotal;
      }

      validatedItems.push({
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: qty,
        subtotal: itemSubtotal,
      });
    }

    // === DELIVERY FEE CALCULATION ===
    const deliveryChargeVal = settingsMap.get('delivery_charge');
    const freeThresholdVal = settingsMap.get('free_delivery_threshold');
    const deliveryChargeAmount = deliveryChargeVal ? parseFloat(deliveryChargeVal) : 20;
    const freeThreshold = freeThresholdVal ? parseFloat(freeThresholdVal) : 200;

    const freeDeliveryApplied = calculatedSubtotal >= freeThreshold;
    const deliveryFee = freeDeliveryApplied ? 0 : deliveryChargeAmount;

    // === COUPON & PROMO VALIDATION ===
    let userCouponDiscount = 0;
    let validatedCouponId: string | null = null;
    let promoDiscount = 0;
    let validatedCouponCode: string | null = null;

    // 1. User-specific SnackPoints Coupon
    if (couponId) {
      if (!prefetchedCoupon) {
        return NextResponse.json({ error: 'Invalid coupon.' }, { status: 400 });
      }

      if (!prefetchedCustomer || prefetchedCoupon.customerId !== prefetchedCustomer.id || prefetchedCustomer.phone !== cleanPhone) {
        return NextResponse.json(
          { error: 'Snackora coupons can only be redeemed on the mobile number they belong to. You cannot use coupons from another phone number.' },
          { status: 403 }
        );
      }

      if (prefetchedCoupon.status !== 'AVAILABLE') {
        return NextResponse.json({ error: 'This coupon has already been used or has expired.' }, { status: 400 });
      }

      if (new Date(prefetchedCoupon.expiresAt) < new Date()) {
        await prisma.coupon.update({ where: { id: prefetchedCoupon.id }, data: { status: 'EXPIRED' } });
        return NextResponse.json({ error: 'This coupon has expired.' }, { status: 400 });
      }

      if (prefetchedCoupon.value > 20) {
        return NextResponse.json({ error: 'Maximum coupon discount is ₹20 per order.' }, { status: 400 });
      }

      userCouponDiscount = Math.min(prefetchedCoupon.value, calculatedSubtotal);
      validatedCouponId = prefetchedCoupon.id;
    }

    // 2. Admin-Created Promo Code (Offer table) - STRICT ONE-TIME PER CUSTOMER & EXPIRY
    if (normalizedPromoCode) {
      if (!prefetchedOffer) {
        return NextResponse.json({ error: `Coupon code "${normalizedPromoCode}" is invalid.` }, { status: 400 });
      }

      const timing = checkOfferTiming(prefetchedOffer);
      if (!timing.valid) {
        return NextResponse.json(
          { error: timing.reason },
          { status: 400 }
        );
      }

      if (!prefetchedOffer.active) {
        return NextResponse.json({ error: `Coupon code "${prefetchedOffer.code}" is currently deactivated.` }, { status: 400 });
      }

      if (prefetchedOffer.minOrderValue > 0 && calculatedSubtotal < prefetchedOffer.minOrderValue) {
        const deficit = Math.ceil(prefetchedOffer.minOrderValue - calculatedSubtotal);
        return NextResponse.json(
          {
            error: `Minimum order value of ₹${prefetchedOffer.minOrderValue} required for coupon ${prefetchedOffer.code}. Add snacks worth ₹${deficit} more to redeem.`,
          },
          { status: 400 }
        );
      }

      // Check one-time per customer (only if oncePerCustomer is true for this offer)
      if (prefetchedOffer.oncePerCustomer !== false && pastUsedPromoOrder) {
        return NextResponse.json(
          {
            error: `Coupon code ${prefetchedOffer.code} has already been used on your account (Order #${pastUsedPromoOrder.orderNumber}). This coupon is limited to 1 use per customer.`,
          },
          { status: 400 }
        );
      }

      if (prefetchedOffer.discountType === 'PERCENTAGE') {
        promoDiscount = Math.round((calculatedSubtotal * prefetchedOffer.discountValue) / 100);
      } else {
        promoDiscount = prefetchedOffer.discountValue;
      }
      promoDiscount = Math.min(promoDiscount, calculatedSubtotal);
      validatedCouponCode = prefetchedOffer.code;
    }

    const totalCouponDiscount = Math.min(calculatedSubtotal, userCouponDiscount + promoDiscount);
    const calculatedTotal = Math.max(0, calculatedSubtotal + deliveryFee - totalCouponDiscount);
    const snackpointsEligibleAmountAfterPromo = Math.max(0, snackpointsEligibleAmount - totalCouponDiscount);
    const snackpointsEarned = Math.floor(snackpointsEligibleAmountAfterPromo);

    // === GENERATE ORDER NUMBER IN-MEMORY FROM PREFETCHED TODAY HIGHEST ===
    let maxSequence = 0;
    if (
      latestOrderToday?.orderNumber &&
      latestOrderToday.orderNumber.length === 7 &&
      latestOrderToday.orderNumber.startsWith(prefix)
    ) {
      const seqPart = parseInt(latestOrderToday.orderNumber.slice(4), 10);
      if (!isNaN(seqPart) && seqPart > 0) {
        maxSequence = seqPart;
      }
    }
    const orderNumber = `${prefix}${String(maxSequence + 1).padStart(3, '0')}`;

    // === PRE-VERIFY / PRE-HASH PIN OUTSIDE TRANSACTION (AVOID DB TRANSACTION DELAY) ===
    let assignedPinHash: string | undefined;
    if (!prefetchedCustomer) {
      // First-time customer: must create 4-digit PIN
      if (!pin || typeof pin !== 'string' || !/^\d{4}$/.test(pin.trim())) {
        return NextResponse.json({ error: 'Please create a 4-digit PIN for your account.' }, { status: 400 });
      }
      if (pin.trim() !== (confirmPin || '').trim()) {
        return NextResponse.json({ error: 'PIN confirmation does not match. Please re-enter.' }, { status: 400 });
      }
      assignedPinHash = await hashCustomerPin(pin);
    } else if (prefetchedCustomer.pinHash) {
      // Returning customer with existing PIN
      if (!pin || typeof pin !== 'string' || !/^\d{4}$/.test(pin.trim())) {
        return NextResponse.json({ error: 'Please enter your 4-digit PIN to confirm your order.' }, { status: 400 });
      }
      const isPinValid = await verifyCustomerPin(pin, prefetchedCustomer.pinHash);
      if (!isPinValid) {
        return NextResponse.json({ error: 'Incorrect 4-digit PIN. Please enter your correct PIN.' }, { status: 400 });
      }
    } else {
      // Legacy customer setting up PIN for first time
      if (!pin || typeof pin !== 'string' || !/^\d{4}$/.test(pin.trim())) {
        return NextResponse.json({ error: 'Please create a 4-digit PIN for your account.' }, { status: 400 });
      }
      if (pin.trim() !== (confirmPin || '').trim()) {
        return NextResponse.json({ error: 'PIN confirmation does not match. Please re-enter.' }, { status: 400 });
      }
      assignedPinHash = await hashCustomerPin(pin);
    }

    // === EXECUTE ORDER (HIGH-SPEED ATOMIC TRANSACTION) ===
    const createdResult = await prisma.$transaction(async (tx) => {
      // 1. Decrement stock concurrently
      const stockUpdates = await Promise.all(
        validatedItems.map((item) =>
          tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          })
        )
      );

      // Verify no item went below 0
      for (let idx = 0; idx < stockUpdates.length; idx++) {
        if (stockUpdates[idx].stock < 0) {
          throw new Error(`Sorry, "${validatedItems[idx].productName}" just went out of stock. Please update your cart.`);
        }
      }

      // 2. Create the Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerName: customerName.trim(),
          phone: cleanPhone,
          hostel: hostel.trim(),
          roomNumber: roomNumber.trim().toUpperCase(),
          deliveryNote: deliveryNote?.trim() || null,
          subtotal: calculatedSubtotal,
          deliveryFee,
          couponDiscount: totalCouponDiscount,
          couponId: validatedCouponId,
          couponCode: validatedCouponCode,
          total: calculatedTotal,
          paymentMethod: 'CASH_ON_DELIVERY',
          status: 'ORDER_RECEIVED',
          freeDeliveryApplied,
          deliveryThresholdAtOrder: freeThreshold,
          snackpointsEarned,
          items: {
            create: validatedItems,
          },
        },
        include: {
          items: true,
        },
      });

      // 3. Upsert Customer Record
      let customerRecord: any;
      if (!prefetchedCustomer) {
        customerRecord = await tx.customer.create({
          data: {
            phone: cleanPhone,
            name: customerName.trim(),
            block: hostelName,
            roomNumber: roomNumber.trim().toUpperCase(),
            pinHash: assignedPinHash,
          },
        });
      } else {
        customerRecord = await tx.customer.update({
          where: { phone: cleanPhone },
          data: {
            name: customerName.trim(),
            block: hostelName,
            roomNumber: roomNumber.trim().toUpperCase(),
            ...(assignedPinHash && { pinHash: assignedPinHash }),
          },
        });
      }

      // 4. Parallelize post-creation DB tasks
      const subTasks: Promise<any>[] = [];

      if (validatedCouponId) {
        subTasks.push(
          tx.coupon.update({
            where: { id: validatedCouponId },
            data: {
              status: 'USED',
              usedAt: new Date(),
              usedOrderId: newOrder.id,
            },
          })
        );
      }

      if (snackpointsEarned > 0) {
        subTasks.push(
          tx.snackpointTransaction.create({
            data: {
              customerId: customerRecord.id,
              orderId: newOrder.id,
              points: snackpointsEarned,
              type: 'PENDING_EARN',
              status: 'PENDING',
              description: `Pending points for order #${orderNumber}`,
            },
          }),
          tx.customer.update({
            where: { id: customerRecord.id },
            data: { pendingSnackpoints: { increment: snackpointsEarned } },
          })
        );
      }

      subTasks.push(
        tx.notification.create({
          data: {
            customerId: customerRecord.id,
            title: '🎉 Order Placed!',
            message: `Your order #${orderNumber} has been placed successfully. Total: ₹${calculatedTotal}. Payment: Cash on Delivery.`,
            type: 'ORDER',
          },
        })
      );

      await Promise.all(subTasks);

      return { order: newOrder, customerId: customerRecord.id };
    });

    const { order: createdOrder, customerId } = createdResult;

    // Dispatched via Next.js after() to keep student response latency minimal (< 300ms)
    after(async () => {
      try {
        await broadcastOrderEvent('ORDER_CREATED', createdOrder);
      } catch (bErr) {
        console.error('Realtime broadcast error:', bErr);
      }

      try {
        revalidatePath('/', 'layout');
        revalidatePath('/');
        revalidatePath('/search');
        revalidatePath('/orders');
      } catch {}

      for (const item of createdOrder.items) {
        try {
          await broadcastProductEvent('STOCK_UPDATED', {
            id: item.productId,
            name: item.productName,
          });
        } catch {}
      }

      try {
        await sendTelegramOrderNotification({
          orderNumber: createdOrder.orderNumber,
          customerName: createdOrder.customerName,
          phone: createdOrder.phone,
          hostel: createdOrder.hostel,
          roomNumber: createdOrder.roomNumber,
          deliveryNote: createdOrder.deliveryNote,
          items: createdOrder.items.map((i: any) => ({
            productName: i.productName,
            quantity: i.quantity,
            price: i.price,
            subtotal: i.subtotal,
          })),
          subtotal: createdOrder.subtotal,
          deliveryFee: createdOrder.deliveryFee,
          couponDiscount: createdOrder.couponDiscount,
          total: createdOrder.total,
          paymentMethod: createdOrder.paymentMethod,
          freeDeliveryApplied: createdOrder.freeDeliveryApplied,
        });
      } catch (tErr) {
        console.error('Telegram notification error:', tErr);
      }
    });

    const response = NextResponse.json(createdOrder, { status: 201 });

    // Issue customer session cookie directly using customerId from transaction
    try {
      const token = await signCustomerToken({ customerId, phone: cleanPhone });
      response.cookies.set(CUSTOMER_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
      });
    } catch (tokenErr) {
      console.error('Error signing customer token:', tokenErr);
    }

    return response;
  } catch (error: any) {
    console.error('Error placing order:', error);
    const msg = error.message || 'Something went wrong. Please try again.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
