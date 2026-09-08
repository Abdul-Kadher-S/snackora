import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';

const MESSAGE_TEMPLATES: Record<string, string> = {
  INCORRECT_DETAILS: 'Your credentials/details appear to be incorrect. Please check your name, mobile number, block, and room number and update them before placing the order again.',
  INCORRECT_MOBILE: 'Please enter a valid mobile number using numbers only.',
  INCORRECT_ROOM: 'Please verify your hostel block and room number and try again.',
};

// Admin sends message to customer
export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    const { phone, orderId, messageType, customMessage } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Customer phone required.' }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({ where: { phone } });
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
    }

    const message = messageType === 'CUSTOM' 
      ? (customMessage || 'Please contact Snackora support.')
      : (MESSAGE_TEMPLATES[messageType] || customMessage || 'Please review your order details.');

    const result = await prisma.$transaction(async (tx) => {
      // Create admin message record
      const adminMsg = await tx.adminMessage.create({
        data: {
          customerId: customer.id,
          orderId: orderId || null,
          adminUser: 'admin',
          message,
          messageType: messageType || 'CUSTOM',
        },
      });

      // Create customer notification
      await tx.notification.create({
        data: {
          customerId: customer.id,
          title: '🔔 Message from Snackora Admin',
          message,
          type: 'ADMIN_MESSAGE',
        },
      });

      return adminMsg;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error sending admin message:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}

// Get all admin messages
export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const messages = await prisma.adminMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        customer: { select: { name: true, phone: true, block: true, roomNumber: true } },
        order: { select: { orderNumber: true, status: true } },
      },
    });

    return NextResponse.json(messages);
  } catch (error: any) {
    console.error('Error fetching admin messages:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
