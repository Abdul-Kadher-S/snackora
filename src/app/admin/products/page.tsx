import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { ProductsClient } from './ProductsClient';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  return <ProductsClient />;
}
