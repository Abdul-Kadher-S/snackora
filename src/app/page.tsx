import prisma from '@/lib/prisma';
import { HomeClient } from '@/components/home/HomeClient';
import { Product, Category } from '@/types';

// Force dynamic so admin changes immediately reflect on customer homepage
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  try {
    const [categories, products] = await Promise.all([
      prisma.category.findMany({
        where: { active: true },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.product.findMany({
        where: { available: true },
        orderBy: [{ rating: 'desc' }, { discount: 'desc' }],
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      }),
    ]);

    return (
      <HomeClient
        categories={JSON.parse(JSON.stringify(categories)) as Category[]}
        products={JSON.parse(JSON.stringify(products)) as Product[]}
      />
    );
  } catch (error) {
    console.error('Database query failed in HomePage:', error);
    return (
      <HomeClient
        categories={[]}
        products={[]}
      />
    );
  }
}
