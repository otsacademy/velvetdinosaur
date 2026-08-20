import { Suspense } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { unstable_noStore } from 'next/cache'

import { NewsArticleEditor } from '@/components/edit/news-article-editor.client'
import { AdminWorkspaceShell } from '@/components/admin/admin-workspace-shell.client'
import type { Article } from '@/lib/articles'
import { getAuth } from '@/lib/auth'
import { getNewsArticleBySlug } from '@/lib/news-articles.server'
import { requireAdmin } from '@/lib/roles'
import { adminHomePath, isAdminOnly } from '@/lib/site-config'
import { ensureUserProfileForSessionUser, readSessionUser } from '@/lib/user-profile'
import { isEditorSmokeRequest } from '@/lib/security/editor-smoke'

type AddNewsArticlePageProps = {
  searchParams?: Promise<{ slug?: string; duplicate?: string }>
}

async function AddNewsArticleContent({ searchParams }: AddNewsArticlePageProps) {
  unstable_noStore()
  if (isAdminOnly()) {
    redirect(adminHomePath)
  }

  const auth = getAuth()
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })
  const isSmoke = isEditorSmokeRequest(requestHeaders)

  if (!session && !isSmoke) {
    redirect('/sign-in?next=/edit/news/new')
  }

  const resolvedSearchParams = (await searchParams) || {}
  const editSlug = typeof resolvedSearchParams.slug === 'string' ? resolvedSearchParams.slug.trim() : ''
  const duplicateMode = resolvedSearchParams.duplicate === '1'
  const sourceArticle = editSlug ? await getNewsArticleBySlug(editSlug) : null
  const initialArticle: Article | null =
    duplicateMode && sourceArticle
      ? {
          ...sourceArticle,
          title: `${sourceArticle.title} (Copy)`,
          slug: '',
          status: 'draft',
          publishAt: ''
        }
      : sourceArticle
  const sessionUser = readSessionUser(session)
  const isAdmin = await requireAdmin(sessionUser?.id || null, sessionUser?.email || null)
  const profile = await ensureUserProfileForSessionUser(sessionUser)

  return (
    <AdminWorkspaceShell>
      <NewsArticleEditor
        key={duplicateMode ? `${editSlug || 'new'}:duplicate` : editSlug || 'new'}
        initialArticle={initialArticle}
        isDuplicate={duplicateMode}
        isAdmin={isAdmin}
        activeAuthor={
          profile
            ? {
                name: profile.displayName,
                image: profile.avatarUrl,
                userId: profile.userId,
                primaryChapterSlug: profile.primaryChapterSlug,
                chapterSlugs: profile.chapterSlugs,
              }
            : null
        }
      />
    </AdminWorkspaceShell>
  )
}

export default function AddNewsArticlePage(props: AddNewsArticlePageProps) {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[var(--vd-muted-fg)]">Loading article editor…</div>}>
      <AddNewsArticleContent {...props} />
    </Suspense>
  )
}
