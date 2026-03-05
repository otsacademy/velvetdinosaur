import { Render } from '@measured/puck/rsc';
import { getPublishedPageData } from '@/lib/pages';
import { config } from '@/puck/registry';

export async function PublishedDoc({ slug }: { slug: string }) {
  const data = await getPublishedPageData(slug);
  return <Render config={config} data={data} />;
}

export async function renderPublishedPuckDoc(slug: string) {
  const data = await getPublishedPageData(slug);
  return <Render config={config} data={data} />;
}
