import type { Article } from '@/lib/articles';
export type NewsArticleEditorProps = {
  returnPath?: string
  initialArticle?: Article | null
  activeAuthor?: {
    name: string
    image: string
    userId?: string | null
    primaryChapterSlug?: string
    chapterSlugs?: string[]
  } | null
}
