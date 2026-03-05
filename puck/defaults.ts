import type { Data } from '@measured/puck';
import { SITE_FOOTER_SLUG, SITE_HEADER_SLUG } from '@/lib/site-chrome-slugs';

function makeId(slug: string, suffix: string) {
  return `vd_${slug}_${suffix}`;
}

export function defaultData(slug = 'home'): Data {
  if (slug === SITE_HEADER_SLUG) {
    return {
      root: { props: { title: 'Global header' } },
      content: [] as unknown as Data['content']
    } as Data;
  }

  if (slug === SITE_FOOTER_SLUG) {
    return {
      root: { props: { title: 'Global footer' } },
      content: [] as unknown as Data['content']
    } as Data;
  }

  const content = [
    {
      type: 'Hero',
      props: { id: makeId(slug, 'hero') }
    },
    {
      type: 'FeatureGrid',
      props: { id: makeId(slug, 'feature') }
    },
    {
      type: 'Text',
      props: { id: makeId(slug, 'text') }
    },
    {
      type: 'Image',
      props: { id: makeId(slug, 'image') }
    },
    {
      type: 'CTA',
      props: { id: makeId(slug, 'cta') }
    }
  ] as unknown as Data['content'];

  return {
    root: {
      props: {
        title: slug === 'home' ? 'Home' : slug
      }
    },
    content
  } as Data;
}
