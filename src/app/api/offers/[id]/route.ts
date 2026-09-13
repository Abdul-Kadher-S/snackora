import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const offer = await prisma.offer.findUnique({
      where: { id },
    });

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    return NextResponse.json(offer);
  } catch (error: any) {
    console.error('Error fetching offer:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch offer' }, { status: 500 });
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

    const existing = await prisma.offer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (body.active !== undefined) {
      updateData.active = Boolean(body.active);
    }
    if (body.title !== undefined) {
      updateData.title = String(body.title).trim();
    }
    if (body.description !== undefined) {
      updateData.description = String(body.description).trim();
    }
    if (body.discountType !== undefined) {
      updateData.discountType = body.discountType;
    }
    if (body.discountValue !== undefined) {
      updateData.discountValue = parseFloat(body.discountValue) || 0;
    }
    if (body.minOrderValue !== undefined) {
      updateData.minOrderValue = parseFloat(body.minOrderValue) || 0;
    }
    if (body.validFrom !== undefined) {
      updateData.validFrom = body.validFrom ? new Date(body.validFrom) : null;
    }
    if (body.validUntil !== undefined) {
      updateData.validUntil = body.validUntil ? new Date(body.validUntil) : null;
    }
    if (body.dailyStartTime !== undefined) {
      updateData.dailyStartTime = body.dailyStartTime ? String(body.dailyStartTime).trim() : null;
    }
    if (body.dailyEndTime !== undefined) {
      updateData.dailyEndTime = body.dailyEndTime ? String(body.dailyEndTime).trim() : null;
    }

    const updated = await prisma.offer.update({
      where: { id },
      data: updateData,
    });

    try {
      revalidatePath('/admin/offers');
      revalidatePath('/coupons');
    } catch {}

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating offer:', error);
    return NextResponse.json({ error: error.message || 'Failed to update offer' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Admin login required.' }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.offer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    await prisma.offer.delete({
      where: { id },
    });

    try {
      revalidatePath('/admin/offers');
      revalidatePath('/coupons');
    } catch {}

    return NextResponse.json({ success: true, message: 'Promo code deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting offer:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete offer' }, { status: 500 });
  }
}
