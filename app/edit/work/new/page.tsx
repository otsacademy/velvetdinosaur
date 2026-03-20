import { Suspense } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { unstable_noStore } from 'next/cache'

import { WorkArticleEditorPotion } from '@/components/edit/work-article-editor.client'
import { getAuth } from '@/lib/auth'
import { getWorkArticleBySlug } from '@/lib/work-articles.server'
import { requireAdmin } from '@/lib/roles'
import { adminHomePath, isAdminOnly } from '@/lib/site-config'

type AddWorkArticlePageProps = {
  searchParams?: Promise<{ slug?: string; duplicate?: string }>
}

async function AddWorkArticleContent({ searchParams }: AddWorkArticlePageProps) {
  unstable_noStore()
  if (isAdminOnly()) {
    redirect(adminHomePath)
  }

  const auth = getAuth()
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })
  const smokeToken = process.env.VD_EDITOR_SMOKE_TOKEN
  const isSmoke = Boolean(smokeToken && requestHeaders.get('x-vd-editor-smoke') === smokeToken)

  if (!session && !isSmoke) {
    redirect('/sign-in?next=/edit/work/new')
  }

  const resolvedSearchParams = (await searchParams) || {}
  const editSlug = typeof resolvedSearchParams.slug === 'string' ? resolvedSearchParams.slug.trim() : ''
  const duplicateMode = resolvedSearchParams.duplicate === '1'
  const sourceArticle = editSlug ? await getWorkArticleBySlug(editSlug) : null
  const initialArticle =
    duplicateMode && sourceArticle
      ? {
          ...sourceArticle,
          title: `${sourceArticle.title} (Copy)`,
          slug: '',
          status: 'draft' as const,
          publishAt: '',
        }
      : sourceArticle
  const sessionUser = (session as { user?: { id?: string; email?: string | null; name?: string | null; image?: string | null } } | null)?.user
  const isAdmin = await requireAdmin(sessionUser?.id || null, sessionUser?.email || null)

  return (
    <WorkArticleEditorPotion
      key={duplicateMode ? `${editSlug || 'new'}:duplicate` : editSlug || 'new'}
      initialArticle={initialArticle}
      activeAuthor={{
        name: sessionUser?.name || (isAdmin ? 'Velvet Dinosaur' : 'Editor'),
        image: sessionUser?.image || '/dinosaur.webp',
        userId: sessionUser?.id || null,
      }}
    />
  )
}

export default function AddWorkArticlePage(props: AddWorkArticlePageProps) {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[var(--vd-muted-fg)]">Loading work editor…</div>}>
      <AddWorkArticleContent {...props} />
    </Suspense>
  )
}
