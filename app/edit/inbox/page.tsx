import { Suspense } from 'react'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { unstable_noStore } from 'next/cache'
import { getAuth } from '@/lib/auth'
import { adminHomePath, isAdminOnly } from '@/lib/site-config'
import { AdminWorkspaceShell } from '@/components/admin/admin-workspace-shell.client'
import { InboxWorkspace } from '@/components/edit/inbox-workspace'
import { LoadingCard } from '@/components/ui/loading-card'
import { isEditorSmokeRequest } from '@/lib/security/editor-smoke'

export const metadata: Metadata = {
  title: 'Inbox'
}

export default function EditInboxPage() {
  return (
    <Suspense
      fallback={
        <AdminWorkspaceShell>
          <main className="mx-auto w-full max-w-[1280px] py-10">
            <LoadingCard
              title="Loading inbox"
              description="Preparing your inbox workspace."
            />
          </main>
        </AdminWorkspaceShell>
      }
    >
      <EditInboxContent />
    </Suspense>
  )
}

async function EditInboxContent() {
  unstable_noStore()
  if (isAdminOnly()) {
    redirect(adminHomePath)
  }

  const auth = getAuth()
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })
  const isSmoke = isEditorSmokeRequest(requestHeaders)
  if (!session && !isSmoke) {
    redirect('/sign-in?next=/edit/inbox')
  }

  return (
    <AdminWorkspaceShell>
      <InboxWorkspace />
    </AdminWorkspaceShell>
  )
}
