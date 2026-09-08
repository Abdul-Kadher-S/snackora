import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { OrdersClient } from './OrdersClient';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  return <OrdersClient />;
}
