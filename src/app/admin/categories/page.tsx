import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { CategoriesClient } from './CategoriesClient';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  return <CategoriesClient />;
}
