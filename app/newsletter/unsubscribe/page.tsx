import { Suspense } from "react"
import type { Metadata } from "next"
import { connection } from "next/server"

import { EMAIL_LINK_TEXT, EmailLinkPage } from "@/components/newsletter/email-link-page"
import { UnsubscribeForm } from "@/components/newsletter/unsubscribe-form"
import { readUnsubscribePreferences } from "@/lib/newsletter/unsubscribe-preferences"

export const metadata: Metadata = {
  title: "Newsletter preferences",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
}

type Props = { searchParams?: Promise<{ token?: string | string[] }> }

// Opening the newsletter's unsubscribe link (GET or HEAD, including mail
// scanners) only reads the current preference. Nothing changes until the
// person confirms on this page.
export default function NewsletterUnsubscribePage(props: Props) {
  return (
    <EmailLinkPage context="Newsletter preferences">
      <Suspense fallback={<p role="status" className={EMAIL_LINK_TEXT.lead}>Loading your newsletter preferences…</p>}>
        <Preferences {...props} />
      </Suspense>
    </EmailLinkPage>
  )
}

async function Preferences({ searchParams }: Props) {
  await connection()
  const params = await searchParams
  const token = typeof params?.token === "string" ? params.token.trim() : ""
  const state = await readUnsubscribePreferences(token)
  return <UnsubscribeForm token={state.status === "subscribed" ? token : ""} initialState={state} />
}
