import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { SettingsClient } from './SettingsClient';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  return <SettingsClient />;
}
