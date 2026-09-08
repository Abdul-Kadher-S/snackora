import { Suspense } from 'react';
import prisma from '@/lib/prisma';
import { SearchClient } from './SearchClient';
import { Category } from '@/types';

export const dynamic = 'force-dynamic';

export default async function SearchPage() {
  try {
    const categories = await prisma.category.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return (
      <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">Loading Snacks...</div>}>
        <SearchClient categories={JSON.parse(JSON.stringify(categories)) as Category[]} />
      </Suspense>
    );
  } catch (error) {
    console.error('Database query failed in SearchPage:', error);
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">Loading Snacks...</div>}>
        <SearchClient categories={[]} />
      </Suspense>
    );
  }
}
