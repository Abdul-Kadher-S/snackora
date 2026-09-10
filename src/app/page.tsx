import prisma from '@/lib/prisma';
import { HomeClient } from '@/components/home/HomeClient';
import { Product, Category } from '@/types';

// Incremental Static Regeneration: 60-second cache with instant revalidation on admin actions
export const revalidate = 60;

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
