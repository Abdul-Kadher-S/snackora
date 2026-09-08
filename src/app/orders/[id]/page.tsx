import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { OrderTrackingClient } from './OrderTrackingClient';
import { Order } from '@/types';

export const dynamic = 'force-dynamic';

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: {
      OR: [{ id }, { orderNumber: id }],
    },
    include: {
      items: {
        include: {
          product: {
            select: { imageUrl: true, foodType: true, brand: true },
          },
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  return <OrderTrackingClient initialOrder={JSON.parse(JSON.stringify(order)) as Order} />;
}
