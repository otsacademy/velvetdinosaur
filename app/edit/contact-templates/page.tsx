import { Suspense } from 'react';
import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ContactTemplatesEditor } from '@/components/edit/contact-templates-editor';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { defaultContactEmailTemplates } from '@/lib/contact-email-templates';
import { ContactSettings } from '@/models/ContactSettings';

async function ContactTemplatesContent() {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect('/sign-in?next=/edit/contact-templates');
  }

  await connectDB();
  const doc = (await ContactSettings.findOne({}).lean()) as
    | { contactEmailHtml?: string; contactEmailText?: string; updatedAt?: Date }
    | null;
  const defaults = await defaultContactEmailTemplates();

  return (
    <main className="container space-y-8 py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-[var(--vd-fg)]">Contact templates</h1>
          <p className="text-sm text-[var(--vd-muted-fg)]">
            Customize the HTML + plain-text email sent for contact form submissions.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/edit">Back to pages</Link>
        </Button>
      </div>

      <ContactTemplatesEditor
        initialHtml={doc?.contactEmailHtml || defaults.html}
        initialText={doc?.contactEmailText || defaults.text}
        defaultHtml={defaults.html}
        defaultText={defaults.text}
        updatedAt={doc?.updatedAt ? doc.updatedAt.toISOString() : null}
      />
    </main>
  );
}

export default function ContactTemplatesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[var(--vd-muted-fg)]">Loading templates…</div>}>
      <ContactTemplatesContent />
    </Suspense>
  );
}
