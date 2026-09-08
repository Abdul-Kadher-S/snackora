import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { OffersClient } from './OffersClient';

export const dynamic = 'force-dynamic';

export default async function AdminOffersPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  return <OffersClient />;
}
