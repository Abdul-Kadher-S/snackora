import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';

export async function GET() {
  try {
    const settings = await prisma.storeSetting.findMany();
    const settingsObj: Record<string, string> = {};
    for (const s of settings) {
      let val = s.value;
      if (/HostelBites|Hostel Bites|hostelbites/i.test(val)) {
        val = val.replace(/HostelBites|Hostel Bites|hostelbites|hostel bites/gi, 'Snackora');
        // Persist update in background
        prisma.storeSetting.update({ where: { id: s.id }, data: { value: val } }).catch(() => {});
      }
      settingsObj[s.key] = val;
    }

    if (!settingsObj.announcement || /HostelBites|Hostel Bites/i.test(settingsObj.announcement)) {
      settingsObj.announcement = '⚡ Snackora is LIVE! Order snacks delivered straight to your room with ₹0 Delivery fee!';
    }

    return NextResponse.json(settingsObj, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch store settings' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Admin login required.' }, { status: 401 });
    }

    const body = await request.json(); // e.g. { isOpen: "true", operatingHours: "..." }

    for (const [key, value] of Object.entries(body)) {
      if (typeof value === 'string') {
        await prisma.storeSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        });
      }
    }

    const updated = await prisma.storeSetting.findMany();
    const settingsObj: Record<string, string> = {};
    updated.forEach((s) => {
      settingsObj[s.key] = s.value;
    });

    return NextResponse.json(settingsObj);
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: error.message || 'Failed to update store settings' }, { status: 500 });
  }
}
