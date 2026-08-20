import { Suspense } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { unstable_noStore } from 'next/cache'

import { AdminWorkspaceShell } from '@/components/admin/admin-workspace-shell.client'
import { EventEditor } from '@/components/edit/event-editor.client'
import { getAuth } from '@/lib/auth'
import { getEventBySlugForEdit } from '@/lib/events.server'
import { adminHomePath, isAdminOnly } from '@/lib/site-config'
import { isEditorSmokeRequest } from '@/lib/security/editor-smoke'
import { ensureUserProfileForSessionUser, readSessionUser } from '@/lib/user-profile'

type AddEventPageProps = {
  searchParams?: Promise<{ slug?: string; duplicate?: string }>
}

async function AddEventContent({ searchParams }: AddEventPageProps) {
  unstable_noStore()
  if (isAdminOnly()) {
    redirect(adminHomePath)
  }

  const auth = getAuth()
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })
  const isSmoke = isEditorSmokeRequest(requestHeaders)

  if (!session && !isSmoke) {
    redirect('/sign-in?next=/edit/events/new')
  }

  const sessionUser = readSessionUser(session)
  const profile = await ensureUserProfileForSessionUser(sessionUser)

  const resolvedSearchParams = (await searchParams) || {}
  const editSlug = typeof resolvedSearchParams.slug === 'string' ? resolvedSearchParams.slug.trim() : ''
  const duplicateMode = resolvedSearchParams.duplicate === '1'
  const sourceEvent = editSlug ? await getEventBySlugForEdit(editSlug) : null
  const initialEvent =
    duplicateMode && sourceEvent
      ? {
          ...sourceEvent,
          title: `${sourceEvent.title} (Copy)`,
          slug: '',
          status: 'draft' as const,
          publishedAt: null,
        }
      : sourceEvent

  return (
    <AdminWorkspaceShell>
      <EventEditor
        key={duplicateMode ? `${editSlug || 'new'}:duplicate` : editSlug || 'new'}
        initialEvent={initialEvent}
        isDuplicate={duplicateMode}
        activeProfile={
          profile
            ? {
                primaryChapterSlug: profile.primaryChapterSlug,
                chapterSlugs: profile.chapterSlugs,
              }
            : null
        }
      />
    </AdminWorkspaceShell>
  )
}

export default function AddEventPage(props: AddEventPageProps) {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[var(--vd-muted-fg)]">Loading event editor…</div>}>
      <AddEventContent {...props} />
    </Suspense>
  )
}
