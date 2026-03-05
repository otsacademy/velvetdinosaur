import { redirect } from 'next/navigation';

export default async function ComponentsPage() {
  redirect('/admin/store#component-store');
}
