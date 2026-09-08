import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { InventoryClient } from './InventoryClient';

export const dynamic = 'force-dynamic';

export default async function AdminInventoryPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  return <InventoryClient />;
}
