import { redirect } from 'next/navigation';

export default function AdminIndexPage() {
  // For site admins, /admin should open the editor.
  redirect('/edit');
}
