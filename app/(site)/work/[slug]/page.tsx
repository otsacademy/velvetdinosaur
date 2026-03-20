import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { WorkArticlePageClient } from '@/components/work/work-article-page.client'
import { getPublishedWorkArticleBySlug, listPublishedWorkArticles } from '@/lib/work-articles.server'

type WorkArticlePageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: WorkArticlePageProps): Promise<Metadata> {
  const resolved = await params
  const article = await getPublishedWorkArticleBySlug(resolved.slug)

  if (!article) {
    return { title: 'Work' }
  }

  return {
    title: article.seoTitle || article.title,
    description: article.seoDescription || article.desc,
    openGraph: {
      title: article.openGraphTitle || article.seoTitle || article.title,
      description: article.openGraphDescription || article.seoDescription || article.desc,
      images: article.openGraphImage ? [article.openGraphImage] : article.img ? [article.img] : [],
    },
  }
}

export default async function WorkArticlePage({ params }: WorkArticlePageProps) {
  const resolved = await params
  const article = await getPublishedWorkArticleBySlug(resolved.slug)

  if (!article) {
    notFound()
  }

  const related = (await listPublishedWorkArticles())
    .filter((candidate) => candidate.slug !== article.slug && candidate.tag === article.tag)
    .slice(0, 3)

  return <WorkArticlePageClient article={article} related={related} />
}
