import type { Metadata } from 'next'

import { WorkList } from '@/components/sections/work-list'
import { siteName } from '@/lib/site-metadata'
import { deriveWorkTags, listPublishedWorkArticles } from '@/lib/work-articles.server'

const workDescription =
  'Selected Velvet Dinosaur case studies covering bespoke websites, publishing systems, CMS tools, and long-term digital platforms.'

export const metadata: Metadata = {
  title: 'Selected Work',
  description: workDescription,
  alternates: {
    canonical: '/work',
  },
  openGraph: {
    type: 'website',
    url: '/work',
    siteName,
    title: `Selected Work | ${siteName}`,
    description: workDescription,
  },
}

export default async function WorkIndexPage() {
  const articles = await listPublishedWorkArticles()
  const tags = deriveWorkTags(articles)

  return <WorkList articles={articles} tags={tags} />
}
