import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    const offers = await prisma.offer.findMany({
      where: activeOnly ? { active: true } : {},
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(offers);
  } catch (error: any) {
    console.error('Error fetching offers:', error);
    return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Admin login required.' }, { status: 401 });
    }

    const body = await request.json();
    const {
      code,
      title,
      description,
      discountType,
      discountValue,
      minOrderValue,
      active,
      validFrom,
      validUntil,
      dailyStartTime,
      dailyEndTime,
    } = body;

    if (!code || !title) {
      return NextResponse.json({ error: 'Coupon code and title are required.' }, { status: 400 });
    }

    const offer = await prisma.offer.create({
      data: {
        code: code.trim().toUpperCase(),
        title: title.trim(),
        description: description?.trim() || '',
        discountType: discountType || 'PERCENTAGE',
        discountValue: parseFloat(discountValue) || 10,
        minOrderValue: parseFloat(minOrderValue) || 0,
        active: active !== undefined ? Boolean(active) : true,
        validFrom: validFrom ? new Date(validFrom) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
        dailyStartTime: dailyStartTime?.trim() || null,
        dailyEndTime: dailyEndTime?.trim() || null,
      },
    });

    return NextResponse.json(offer, { status: 201 });
  } catch (error: any) {
    console.error('Error creating offer:', error);
    return NextResponse.json({ error: error.message || 'Failed to create offer' }, { status: 500 });
  }
}
