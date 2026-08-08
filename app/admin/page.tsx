import type { Metadata } from 'next';
import { OperationsHub } from '@/components/admin/operations-hub';
import { requireOperationsAdmin } from '@/lib/admin-route';

export const metadata: Metadata = {
  title: 'Administration | Velvet Dinosaur',
  description: 'Protected operational tools for Velvet Dinosaur administrators.',
  robots: { index: false, follow: false }
};

export default async function AdminIndexPage() {
  await requireOperationsAdmin('/admin');
  return <OperationsHub />;
}
