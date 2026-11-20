import { Suspense } from "react"
import type { Metadata } from "next"
import { connection } from "next/server"

import { ConfirmForm } from "@/components/newsletter/confirm-form"
import { EMAIL_LINK_TEXT, EmailLinkPage } from "@/components/newsletter/email-link-page"
import { validateEventRegistrationConfirmToken } from "@/lib/event-registration/confirm-token"

export const metadata: Metadata = {
  title: "Confirm your registration",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
}

type Props = { searchParams?: Promise<{ token?: string | string[] }> }

// Opening the emailed link (GET or HEAD, including mail scanners) only shows
// this page. The registration changes when the person presses the button.
export default function EventRegistrationConfirmPage(props: Props) {
  return (
    <EmailLinkPage context="Event registration">
      <Suspense fallback={<p role="status" className={EMAIL_LINK_TEXT.lead}>Loading confirmation…</p>}>
        <Content {...props} />
      </Suspense>
    </EmailLinkPage>
  )
}

async function Content({ searchParams }: Props) {
  await connection()
  const params = await searchParams
  const token = typeof params?.token === "string" && params.token.length <= 4096 ? params.token.trim() : ""
  const valid = validateEventRegistrationConfirmToken(token).ok
  return <ConfirmForm token={valid ? token : ""} kind="event" valid={valid} />
}
