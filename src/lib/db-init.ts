import prisma from '@/lib/prisma';

let initialized = false;

export async function ensureDbColumns() {
  if (initialized) return;
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "pinHash" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "couponCode" TEXT;`);
    initialized = true;
  } catch (err) {
    console.error('Failed to run schema column migration:', err);
  }
}
