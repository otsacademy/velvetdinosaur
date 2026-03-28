import { DemoNewsPreview } from '@/components/demo/news/demo-news-preview.client';
import { resolveDemoSiteUrl, resolvePrimarySiteUrl } from '@/lib/demo-site';

type DemoNewsPreviewPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function DemoNewsPreviewPage({ params }: DemoNewsPreviewPageProps) {
  const resolved = await params;
  return (
    <DemoNewsPreview
      slug={resolved.slug}
      mode="draft"
      editorHref={resolveDemoSiteUrl('/news')}
      homeHref={resolvePrimarySiteUrl('/')}
    />
  );
}
