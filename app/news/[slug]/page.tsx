import type { Metadata } from 'next';
import { DemoNewsPreview } from '@/components/demo/news/demo-news-preview.client';
import { resolveDemoSiteUrl, resolvePrimarySiteUrl } from '@/lib/demo-site';

type DemoNewsLivePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: DemoNewsLivePageProps): Promise<Metadata> {
  const resolved = await params;
  const canonical = resolveDemoSiteUrl(`/news/${resolved.slug}`);

  return {
    title: 'Demo Article | Velvet Dinosaur',
    description: 'A fictional article rendered from the sandboxed Sauro CMS article editor.',
    alternates: {
      canonical,
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function DemoNewsLivePage({ params }: DemoNewsLivePageProps) {
  const resolved = await params;
  return (
    <DemoNewsPreview
      slug={resolved.slug}
      mode="live"
      editorHref={resolveDemoSiteUrl('/news')}
      homeHref={resolvePrimarySiteUrl('/')}
    />
  );
}
