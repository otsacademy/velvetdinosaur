import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { unstable_noStore } from 'next/cache'
import { getAuth } from '@/lib/auth'
import { adminHomePath, isAdminOnly } from '@/lib/site-config'
import { AdminWorkspaceShell } from '@/components/admin/admin-workspace-shell.client'
import { CalendarWorkspace } from '@/components/edit/calendar-workspace'
import { isEditorSmokeRequest } from '@/lib/security/editor-smoke'

export const metadata: Metadata = {
  title: 'Calendar'
}

export default async function EditCalendarPage() {
  return <EditCalendarContent />
}

async function EditCalendarContent() {
  unstable_noStore()
  if (isAdminOnly()) {
    redirect(adminHomePath)
  }

  const auth = getAuth()
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })
  const isSmoke = isEditorSmokeRequest(requestHeaders)
  if (!session && !isSmoke) {
    redirect('/sign-in?next=/edit/calendar')
  }

  return (
    <AdminWorkspaceShell>
      <CalendarWorkspace />
    </AdminWorkspaceShell>
  )
}
