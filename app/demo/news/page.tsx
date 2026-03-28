import type { Metadata } from 'next';
import { DemoNewsEditorClient } from '@/components/demo/news/demo-news-editor.client';
import { resolvePrimarySiteUrl } from '@/lib/demo-site';

export const metadata: Metadata = {
  title: 'Article Editor Demo | Velvet Dinosaur',
  description: 'A sandboxed article editor demonstration using fictional editorial content, disposable media, and demo-only save and publish actions.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DemoNewsPage() {
  return <DemoNewsEditorClient closeHref="/" mainSiteHref={resolvePrimarySiteUrl('/')} />;
}
