import { NextRequest, NextResponse, after } from 'next/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';
import { broadcastOrderEvent, broadcastProductEvent } from '@/lib/supabase';
import { sendTelegramOrderNotification } from '@/lib/telegram';
import { hashCustomerPin, verifyCustomerPin, signCustomerToken, CUSTOMER_COOKIE_NAME } from '@/lib/customer-auth';
import { ensureDbColumns } from '@/lib/db-init';

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

// Generate unique 7-digit order number DDMMNNN (e.g., 1009001) reset daily in IST
async function generateUniqueOrderNumber(): Promise<string> {
  // Compute current date in Indian Standard Time (UTC + 5:30)
  const now = new Date();
  const istDate = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const dd = String(istDate.getUTCDate()).padStart(2, '0');
  const mm = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const prefix = `${dd}${mm}`; // e.g. "1009"

  try {
    // Find highest order number for today
    const latestOrderToday = await prisma.order.findFirst({
      where: {
        orderNumber: {
          startsWith: prefix,
        },
      },
      select: {
        orderNumber: true,
      },
      orderBy: {
        orderNumber: 'desc',
      },
    });

    let maxSequence = 0;
    if (latestOrderToday?.orderNumber && latestOrderToday.orderNumber.length === 7 && latestOrderToday.orderNumber.startsWith(prefix)) {
      const seqPart = parseInt(latestOrderToday.orderNumber.slice(4), 10);
      if (!isNaN(seqPart) && seqPart > 0) {
        maxSequence = seqPart;
      }
    }

    const nextSeq = maxSequence + 1;
    const candidate = `${prefix}${String(nextSeq).padStart(3, '0')}`;

    // Verify non-collision
    const exists = await prisma.order.findUnique({
      where: { orderNumber: candidate },
      select: { id: true },
    });

    if (!exists) {
      return candidate;
    }

    // If candidate exists due to concurrency, find the next available sequence
    for (let offset = 1; offset <= 200; offset++) {
      const altNum = `${prefix}${String(nextSeq + offset).padStart(3, '0')}`;
      const altExists = await prisma.order.findUnique({
        where: { orderNumber: altNum },
        select: { id: true },
      });
      if (!altExists) return altNum;
    }
  } catch (err) {
    console.error('Error calculating daily order sequence:', err);
  }

  // Fallback 7-digit ID: prefix + 3 random digits
  const fallbackSeq = Math.floor(100 + Math.random() * 900);
  return `${prefix}${fallbackSeq}`;
}

export async function POST(request: NextRequest) {
  await ensureDbColumns();
  try {
    const body = await request.json();
    const { customerName, phone, hostel, roomNumber, deliveryNote, items, couponId, couponCode, pin, confirmPin } = body;

    // === NAME VALIDATION ===
    if (!customerName || typeof customerName !== 'string' || customerName.trim().length < 2) {
      return NextResponse.json({ error: 'Please provide your full name.' }, { status: 400 });
    }
    // Name must contain only letters and spaces
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(customerName.trim())) {
      return NextResponse.json({ error: 'Please enter your name using letters only. Numbers and special characters are not allowed.' }, { status: 400 });
    }

    // === PHONE VALIDATION ===
    const cleanPhone = (phone || '').replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit mobile number using numbers only.' }, { status: 400 });
    }
    // Must start with 6-9 (Indian mobile)
    if (!/^[6-9]/.test(cleanPhone)) {
      return NextResponse.json({ error: 'Please enter a valid Indian mobile number.' }, { status: 400 });
    }

    // === HOSTEL VALIDATION ===
    if (!hostel || !hostel.trim()) {
      return NextResponse.json({ error: 'Please select your hostel block.' }, { status: 400 });
    }

    // === HOSTEL DELIVERY AVAILABILITY KEY ===
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

    // === BATCH FETCH PRODUCTS & SETTINGS IN PARALLEL ===
    const productIds = items.map((i: any) => i.productId);
    const neededSettings = [settingKey, 'delivery_charge', 'free_delivery_threshold'];

    const [dbProducts, settingsList] = await Promise.all([
      prisma.product.findMany({
        where: { id: { in: productIds } },
      }),
      prisma.storeSetting.findMany({
        where: { key: { in: neededSettings } },
      }),
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

      // Track SnackPoints-eligible spend
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

    // Free delivery based on subtotal BEFORE coupon
    const freeDeliveryApplied = calculatedSubtotal >= freeThreshold;
    const deliveryFee = freeDeliveryApplied ? 0 : deliveryChargeAmount;

    // === COUPON & PROMO VALIDATION ===
    let userCouponDiscount = 0;
    let validatedCouponId: string | null = null;
    let promoDiscount = 0;
    let validatedCouponCode: string | null = null;

    // 1. User-specific SnackPoints Coupon
    if (couponId) {
      const coupon = await prisma.coupon.findUnique({
        where: { id: couponId },
      });

      if (!coupon) {
        return NextResponse.json({ error: 'Invalid coupon.' }, { status: 400 });
      }

      // Check ownership by phone
      const couponCustomer = await prisma.customer.findUnique({
        where: { id: coupon.customerId },
      });
      if (!couponCustomer || couponCustomer.phone !== cleanPhone) {
        return NextResponse.json({ error: 'This coupon does not belong to your account.' }, { status: 400 });
      }

      if (coupon.status !== 'AVAILABLE') {
        return NextResponse.json({ error: 'This coupon has already been used or has expired.' }, { status: 400 });
      }

      if (new Date(coupon.expiresAt) < new Date()) {
        // Mark as expired
        await prisma.coupon.update({ where: { id: coupon.id }, data: { status: 'EXPIRED' } });
        return NextResponse.json({ error: 'This coupon has expired.' }, { status: 400 });
      }

      if (coupon.value > 20) {
        return NextResponse.json({ error: 'Maximum coupon discount is ₹20 per order.' }, { status: 400 });
      }

      userCouponDiscount = Math.min(coupon.value, calculatedSubtotal);
      validatedCouponId = coupon.id;
    }

    // 2. Admin-Created Promo Code (Offer table) - STRICT ONE-TIME PER CUSTOMER
    if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
      const normalizedCode = couponCode.trim().toUpperCase();
      const offer = await prisma.offer.findUnique({
        where: { code: normalizedCode },
      });

      if (!offer) {
        return NextResponse.json({ error: `Coupon code "${normalizedCode}" is invalid.` }, { status: 400 });
      }

      if (!offer.active) {
        return NextResponse.json({ error: `Coupon code "${offer.code}" is no longer active.` }, { status: 400 });
      }

      if (offer.minOrderValue > 0 && calculatedSubtotal < offer.minOrderValue) {
        return NextResponse.json(
          { error: `Minimum order value of ₹${offer.minOrderValue} required for coupon ${offer.code}.` },
          { status: 400 }
        );
      }

      // Enforce one-time per customer: check past non-cancelled orders by this phone
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
            error: `Coupon code ${offer.code} has already been used on your account (${pastUsedOrder.orderNumber}). Admin promo codes can only be used once per customer.`,
          },
          { status: 400 }
        );
      }

      // Recalculate discount strictly on server
      if (offer.discountType === 'PERCENTAGE') {
        promoDiscount = Math.round((calculatedSubtotal * offer.discountValue) / 100);
      } else {
        promoDiscount = offer.discountValue;
      }
      promoDiscount = Math.min(promoDiscount, calculatedSubtotal);
      validatedCouponCode = offer.code;
    }

    const totalCouponDiscount = Math.min(calculatedSubtotal, userCouponDiscount + promoDiscount);
    const calculatedTotal = Math.max(0, calculatedSubtotal + deliveryFee - totalCouponDiscount);
    const snackpointsEligibleAmountAfterPromo = Math.max(0, snackpointsEligibleAmount - totalCouponDiscount);
    const snackpointsEarned = Math.floor(snackpointsEligibleAmountAfterPromo);

    // === GENERATE UNIQUE ORDER NUMBER ===
    const orderNumber = await generateUniqueOrderNumber();

    // === EXECUTE ORDER (ATOMIC TRANSACTION) ===
    const createdOrder = await prisma.$transaction(async (tx) => {
      // 1. Decrement stock atomically
      for (const item of validatedItems) {
        const updated = await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
        // Final stock check after decrement
        if (updated.stock < 0) {
          throw new Error(`Sorry, "${item.productName}" just went out of stock. Please update your cart.`);
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

      // 3. Mark coupon as used
      if (validatedCouponId) {
        await tx.coupon.update({
          where: { id: validatedCouponId },
          data: {
            status: 'USED',
            usedAt: new Date(),
            usedOrderId: newOrder.id,
          },
        });
      }

      // 4. Customer Authentication & Creation / Update
      let customer = await tx.customer.findUnique({ where: { phone: cleanPhone } });
      let assignedPinHash: string | undefined;

      if (!customer) {
        // First-time customer: must create 4-digit PIN
        if (!pin || typeof pin !== 'string' || !/^\d{4}$/.test(pin.trim())) {
          throw new Error('Please create a 4-digit PIN for your account.');
        }
        if (pin.trim() !== (confirmPin || '').trim()) {
          throw new Error('PIN confirmation does not match. Please re-enter.');
        }
        assignedPinHash = await hashCustomerPin(pin);
        customer = await tx.customer.create({
          data: {
            phone: cleanPhone,
            name: customerName.trim(),
            block: hostelName,
            roomNumber: roomNumber.trim().toUpperCase(),
            pinHash: assignedPinHash,
          },
        });
      } else {
        // Returning customer
        if (customer.pinHash) {
          if (!pin || typeof pin !== 'string' || !/^\d{4}$/.test(pin.trim())) {
            throw new Error('Please enter your 4-digit PIN to confirm your order.');
          }
          const isPinValid = await verifyCustomerPin(pin, customer.pinHash);
          if (!isPinValid) {
            throw new Error('Incorrect 4-digit PIN. Please enter your correct PIN.');
          }
        } else {
          // Existing customer without PIN yet: set up PIN
          if (!pin || typeof pin !== 'string' || !/^\d{4}$/.test(pin.trim())) {
            throw new Error('Please create a 4-digit PIN for your account.');
          }
          if (pin.trim() !== (confirmPin || '').trim()) {
            throw new Error('PIN confirmation does not match. Please re-enter.');
          }
          assignedPinHash = await hashCustomerPin(pin);
        }

        customer = await tx.customer.update({
          where: { phone: cleanPhone },
          data: {
            name: customerName.trim(),
            block: hostelName,
            roomNumber: roomNumber.trim().toUpperCase(),
            ...(assignedPinHash && { pinHash: assignedPinHash }),
          },
        });
      }

      // 5. Create pending SnackPoints transaction (credited on delivery)
      if (snackpointsEarned > 0) {
        await tx.snackpointTransaction.create({
          data: {
            customerId: customer.id,
            orderId: newOrder.id,
            points: snackpointsEarned,
            type: 'PENDING_EARN',
            status: 'PENDING',
            description: `Pending points for order #${orderNumber}`,
          },
        });

        // Update pending balance
        await tx.customer.update({
          where: { id: customer.id },
          data: {
            pendingSnackpoints: { increment: snackpointsEarned },
          },
        });
      }

      // 6. Create order notification
      await tx.notification.create({
        data: {
          customerId: customer.id,
          title: '🎉 Order Placed!',
          message: `Your order #${orderNumber} has been placed successfully. Total: ₹${calculatedTotal}. Payment: Cash on Delivery.`,
          type: 'ORDER',
        },
      });

      return newOrder;
    });

    // Realtime broadcast and Telegram Bot Notification dispatched via Next.js after()
    // This allows the student's checkout to complete instantaneously (< 500ms)
    // while external network notifications proceed safely in the background.
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
          items: createdOrder.items.map((i) => ({
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
    try {
      const customer = await prisma.customer.findUnique({ where: { phone: cleanPhone } });
      if (customer) {
        const token = await signCustomerToken({ customerId: customer.id, phone: cleanPhone });
        response.cookies.set(CUSTOMER_COOKIE_NAME, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 30 * 24 * 60 * 60,
        });
      }
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
