import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { DashboardClient } from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  return <DashboardClient />;
}
