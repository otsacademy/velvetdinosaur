import { Suspense } from 'react'
import { headers } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { unstable_noStore } from 'next/cache'

import { WorkArticleEditorPotion } from '@/components/edit/work-article-editor.client'
import { getAuth } from '@/lib/auth'
import { getWorkArticleBySlug } from '@/lib/work-articles.server'
import { adminHomePath, isAdminOnly } from '@/lib/site-config'

type EditWorkArticlePageProps = {
  params: Promise<{ slug: string }>
}

async function EditWorkArticleContent({ params }: EditWorkArticlePageProps) {
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
    const resolved = await params
    redirect(`/sign-in?next=/edit/work/${encodeURIComponent(resolved.slug)}`)
  }

  const resolved = await params
  const article = await getWorkArticleBySlug(resolved.slug)
  if (!article) {
    notFound()
  }

  const sessionUser = (session as { user?: { id?: string; name?: string | null; image?: string | null } } | null)?.user

  return (
    <WorkArticleEditorPotion
      initialArticle={article}
      activeAuthor={{
        name: sessionUser?.name || article.author.name,
        image: sessionUser?.image || article.author.img,
        userId: sessionUser?.id || null,
      }}
    />
  )
}

export default function EditWorkArticlePage(props: EditWorkArticlePageProps) {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[var(--vd-muted-fg)]">Loading work article…</div>}>
      <EditWorkArticleContent {...props} />
    </Suspense>
  )
}
