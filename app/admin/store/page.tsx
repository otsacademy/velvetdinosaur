import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAuth } from '@/lib/auth';
import { ComponentStoreClient } from '@/components/admin/component-store-client';
import { PagesManager } from '@/components/admin/pages/pages-manager';

function resolveStoreSiteUrl() {
  const raw =
    process.env.VD_STORE_SITE_URL ||
    process.env.VD_STORE_API_URL ||
    process.env.VD_COMPONENT_STORE_API_URL ||
    process.env.COMPONENT_STORE_API_URL ||
    '';

  return raw
    .trim()
    .replace(/\/$/, '')
    .replace(/\/api\/store$/, '');
}

export default async function StorePage() {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect('/sign-in?next=/admin/store');
  }

  const storeSiteUrl = resolveStoreSiteUrl();

  return (
    <main className="min-h-screen bg-[var(--vd-bg)]">
      <section className="container space-y-6 pb-16 pt-8" id="component-store">
        <div>
          <h2 className="text-2xl font-semibold">Component Store</h2>
          <p className="mt-2 text-sm text-[var(--vd-muted-fg)]">
            Install Puck-ready blocks from the central component/block store service.
          </p>
          {storeSiteUrl ? (
            <p className="mt-2 text-sm text-[var(--vd-muted-fg)]">
              Browse and preview all blocks at{' '}
              <a
                href={storeSiteUrl}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4"
              >
                {storeSiteUrl}
              </a>
              .
            </p>
          ) : (
            <p className="mt-2 text-sm text-[var(--vd-muted-fg)]">
              Set <code>VD_STORE_SITE_URL</code> (or <code>VD_STORE_API_URL</code>) to enable central previews.
            </p>
          )}
        </div>
        <ComponentStoreClient />
      </section>

      <section className="container space-y-6 pb-16" id="pages">
        <div>
          <h2 className="text-2xl font-semibold">Pages</h2>
          <p className="mt-2 text-sm text-[var(--vd-muted-fg)]">
            Create pages, preview drafts, and open the editor by slug.
          </p>
        </div>
        <PagesManager />
      </section>
    </main>
  );
}
