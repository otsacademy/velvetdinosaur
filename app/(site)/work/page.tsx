import type { Metadata } from 'next'

import { WorkList } from '@/components/sections/work-list'
import { deriveWorkTags, listPublishedWorkArticles } from '@/lib/work-articles.server'

export const metadata: Metadata = {
  title: 'Selected Work',
}

export default async function WorkIndexPage() {
  const articles = await listPublishedWorkArticles()
  const tags = deriveWorkTags(articles)

  return <WorkList articles={articles} tags={tags} />
}
