import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAuth } from '@/lib/auth';

type PreviewPageProps = {
  searchParams?: Promise<{ id?: string | string[] }>;
};

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

export default async function StorePreviewPage({ searchParams }: PreviewPageProps) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect('/sign-in?next=/admin/store/preview');
  }

  const resolved = searchParams ? await searchParams : ({} as { id?: string | string[] });
  const rawId = resolved.id;
  const id = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] || '' : '';
  const storeSiteUrl = resolveStoreSiteUrl();

  if (storeSiteUrl) {
    const previewUrl = id
      ? `${storeSiteUrl}/preview/${encodeURIComponent(id)}`
      : storeSiteUrl;
    redirect(previewUrl);
  }

  return (
    <main className="min-h-screen bg-[var(--vd-bg)]">
      <section className="container py-12">
        <p className="text-sm text-[var(--vd-muted-fg)]">
          Central store preview is not configured. Set <code>VD_STORE_SITE_URL</code> (or{' '}
          <code>VD_STORE_API_URL</code>) to enable preview redirects.
        </p>
      </section>
    </main>
  );
}
