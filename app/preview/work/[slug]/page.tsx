import { headers } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { Render } from '@measured/puck/rsc'

import { config } from '@/puck/registry'
import { getAuth } from '@/lib/auth'
import { getDraftSiteChrome } from '@/lib/site-chrome'
import { getWorkArticleBySlug, listPublishedWorkArticles } from '@/lib/work-articles.server'
import { WorkArticlePageClient } from '@/components/work/work-article-page.client'

type WorkPreviewPageProps = {
  params: Promise<{ slug: string }>
}

export default async function WorkPreviewPage({ params }: WorkPreviewPageProps) {
  const auth = getAuth()
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })
  if (!session) {
    const resolved = await params
    redirect(`/sign-in?next=/preview/work/${encodeURIComponent(resolved.slug)}`)
  }

  const resolved = await params
  const article = await getWorkArticleBySlug(resolved.slug)
  if (!article) {
    notFound()
  }

  const related = (await listPublishedWorkArticles())
    .filter((candidate) => candidate.slug !== article.slug && candidate.tag === article.tag)
    .slice(0, 3)
  const chrome = await getDraftSiteChrome()

  return (
    <>
      <Render config={config} data={chrome.header} />
      <WorkArticlePageClient article={article} related={related} />
      <Render config={config} data={chrome.footer} />
    </>
  )
}
