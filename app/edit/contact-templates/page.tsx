import { Suspense } from 'react';
import { AccessNotice } from '@/components/admin/access-notice';
import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { unstable_noStore } from 'next/cache';
import { Button } from '@/components/ui/button';
import { EmailPreviewWorkbench } from '@/components/email/email-preview-workbench';
import { AdminWorkspaceShell } from '@/components/admin/admin-workspace-shell.client';
import { getAuth } from '@/lib/auth';
import { requireAdmin } from '@/lib/roles';
import { adminHomePath, isAdminOnly } from '@/lib/site-config';
import { getSystemEmailTemplateEditorState } from '@/lib/system-email-templates';

async function ContactTemplatesContent() {
  unstable_noStore();
  if (isAdminOnly()) {
    redirect(adminHomePath);
  }
  const auth = getAuth();
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) {
    redirect('/sign-in?next=/edit/contact-templates');
  }
  const user = (session as { user?: { id?: string; email?: string } } | null)?.user;
  if (!(await requireAdmin(user?.id || null, user?.email || null))) {
    return <AccessNotice workspace="Email Templates" />;
  }

  const templates = await getSystemEmailTemplateEditorState();

  return (
    <AdminWorkspaceShell>
      <main className="mx-auto w-full max-w-[1280px] space-y-8 py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight text-[var(--vd-fg)]">Email Templates</h1>
            <p className="text-sm text-[var(--vd-muted-fg)]">
              Edit and preview all system email templates with token-aware validation.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/edit">Back to dashboard</Link>
          </Button>
        </div>

        <EmailPreviewWorkbench templates={templates} />
      </main>
    </AdminWorkspaceShell>
  );
}

export default function ContactTemplatesPage() {
  return (
    <Suspense
      fallback={
        <AdminWorkspaceShell>
          <div className="p-6 text-sm text-[var(--vd-muted-fg)]">Loading email templates…</div>
        </AdminWorkspaceShell>
      }
    >
      <ContactTemplatesContent />
    </Suspense>
  );
}
