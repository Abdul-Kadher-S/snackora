import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  hashCustomerPin,
  verifyCustomerPin,
  signCustomerToken,
  getCustomerSession,
  CUSTOMER_COOKIE_NAME,
} from '@/lib/customer-auth';
import { ensureDbColumns } from '@/lib/db-init';

// GET: Check customer status by phone, or fetch current logged-in customer profile
export async function GET(request: NextRequest) {
  await ensureDbColumns();
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    // 1. If phone is specified, check if account exists and whether PIN is set
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        return NextResponse.json({ error: 'Valid 10-digit phone required' }, { status: 400 });
      }

      const customer = await prisma.customer.findUnique({
        where: { phone: cleanPhone },
        select: {
          id: true,
          phone: true,
          name: true,
          block: true,
          roomNumber: true,
          pinHash: true,
          availableSnackpoints: true,
        },
      });

      if (!customer) {
        return NextResponse.json({
          exists: false,
          hasPin: false,
        });
      }

      return NextResponse.json({
        exists: true,
        hasPin: Boolean(customer.pinHash),
        name: customer.name,
        block: customer.block,
        roomNumber: customer.roomNumber,
        availableSnackpoints: customer.availableSnackpoints,
      });
    }

    // 2. Otherwise check session cookie
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ authenticated: false });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: session.customerId },
      select: {
        id: true,
        phone: true,
        name: true,
        block: true,
        roomNumber: true,
        availableSnackpoints: true,
        pinHash: true,
      },
    });

    if (!customer) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({
      authenticated: true,
      customer: {
        id: customer.id,
        phone: customer.phone,
        name: customer.name,
        block: customer.block,
        roomNumber: customer.roomNumber,
        availableSnackpoints: customer.availableSnackpoints,
        hasPin: Boolean(customer.pinHash),
      },
    });
  } catch (error: any) {
    console.error('Customer auth check error:', error);
    return NextResponse.json({ error: 'Failed to verify customer status' }, { status: 500 });
  }
}

// POST: Login, Setup PIN, or Logout
export async function POST(request: NextRequest) {
  await ensureDbColumns();
  try {
    const body = await request.json();
    const { action, phone, pin, confirmPin, name, block, roomNumber } = body;

    // === LOGOUT ===
    if (action === 'logout') {
      const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
      response.cookies.set(CUSTOMER_COOKIE_NAME, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });
      return response;
    }

    // Common phone validation
    const cleanPhone = (phone || '').replace(/\D/g, '');
    if (cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit Indian mobile number.' },
        { status: 400 }
      );
    }

    // === LOGIN ===
    if (action === 'login') {
      if (!pin || typeof pin !== 'string' || !/^\d{4}$/.test(pin.trim())) {
        return NextResponse.json(
          { error: 'Please enter your 4-digit PIN (numbers only).' },
          { status: 400 }
        );
      }

      const customer = await prisma.customer.findUnique({
        where: { phone: cleanPhone },
      });

      if (!customer) {
        return NextResponse.json(
          {
            error: 'No account found for this mobile number. Place your first order to create an account.',
          },
          { status: 404 }
        );
      }

      // Existing customer who does not have a PIN yet
      if (!customer.pinHash) {
        return NextResponse.json(
          {
            needPinSetup: true,
            message: 'Welcome back! Please create your 4-digit PIN for your existing account.',
            customer: {
              name: customer.name,
              phone: customer.phone,
              block: customer.block,
              roomNumber: customer.roomNumber,
            },
          },
          { status: 200 }
        );
      }

      // Verify PIN
      const isPinValid = await verifyCustomerPin(pin, customer.pinHash);
      if (!isPinValid) {
        return NextResponse.json(
          { error: 'Incorrect 4-digit PIN. Please try again.' },
          { status: 401 }
        );
      }

      // Issue JWT session token
      const token = await signCustomerToken({ customerId: customer.id, phone: customer.phone });
      const response = NextResponse.json({
        success: true,
        message: 'Login successful',
        customer: {
          id: customer.id,
          phone: customer.phone,
          name: customer.name,
          block: customer.block,
          roomNumber: customer.roomNumber,
          availableSnackpoints: customer.availableSnackpoints,
        },
      });

      response.cookies.set(CUSTOMER_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });

      return response;
    }

    // === SETUP PIN ===
    if (action === 'setup_pin') {
      if (!pin || typeof pin !== 'string' || !/^\d{4}$/.test(pin.trim())) {
        return NextResponse.json(
          { error: 'PIN must be exactly 4 digits (numbers only).' },
          { status: 400 }
        );
      }

      if (pin.trim() !== (confirmPin || '').trim()) {
        return NextResponse.json(
          { error: 'PIN confirmation does not match. Please re-enter.' },
          { status: 400 }
        );
      }

      const hashedPin = await hashCustomerPin(pin);

      let customer = await prisma.customer.findUnique({
        where: { phone: cleanPhone },
      });

      if (customer) {
        customer = await prisma.customer.update({
          where: { phone: cleanPhone },
          data: {
            pinHash: hashedPin,
            ...(name && { name: name.trim() }),
            ...(block && { block: block.trim() }),
            ...(roomNumber && { roomNumber: roomNumber.trim().toUpperCase() }),
          },
        });
      } else {
        customer = await prisma.customer.create({
          data: {
            phone: cleanPhone,
            name: (name || 'Customer').trim(),
            block: block ? block.trim() : null,
            roomNumber: roomNumber ? roomNumber.trim().toUpperCase() : null,
            pinHash: hashedPin,
          },
        });
      }

      const token = await signCustomerToken({ customerId: customer.id, phone: customer.phone });
      const response = NextResponse.json({
        success: true,
        message: 'PIN successfully set',
        customer: {
          id: customer.id,
          phone: customer.phone,
          name: customer.name,
          block: customer.block,
          roomNumber: customer.roomNumber,
          availableSnackpoints: customer.availableSnackpoints,
        },
      });

      response.cookies.set(CUSTOMER_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
      });

      return response;
    }

    return NextResponse.json({ error: 'Invalid action requested' }, { status: 400 });
  } catch (error: any) {
    console.error('Customer auth error:', error);
    return NextResponse.json({ error: error.message || 'Authentication error' }, { status: 500 });
  }
}
