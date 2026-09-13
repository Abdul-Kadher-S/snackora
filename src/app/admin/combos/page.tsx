import { Metadata } from 'next';
import { CombosClient } from './CombosClient';

export const metadata: Metadata = {
  title: 'Combo Offers | Snackora Admin',
  description: 'Create and manage 2, 3, or 4 product combo offers with attractive bundled images.',
};

export default function AdminCombosPage() {
  return <CombosClient />;
}
