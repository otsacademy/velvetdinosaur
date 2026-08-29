import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAuth } from '@/lib/auth';
import { StorePreview } from '@/components/admin/store/store-preview';

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
      <StorePreview id={id} />
    </main>
  );
}
