"use client"

/* eslint-disable @next/next/no-html-link-for-pages -- Leave the private token page with a full navigation and fresh analytics state. */

import { useEffect, useRef } from "react"
import { ArrowRight, Check, CircleAlert, LoaderCircle } from "lucide-react"

import { EMAIL_LINK_BUTTON, EMAIL_LINK_TEXT, ResultMark } from "./email-link-page"
import { useConfirmLink, type ConfirmKind } from "./email-link-actions"

export function ConfirmForm({ token, kind, valid }: { token: string; kind: ConfirmKind; valid: boolean }) {
  const { busy, confirmed, error, confirm } = useConfirmLink(kind, token)
  const heading = useRef<HTMLHeadingElement>(null)
  const label = kind === "newsletter" ? "subscription" : "registration"
  const Label = kind === "newsletter" ? "Subscription" : "Registration"

  useEffect(() => {
    if (confirmed) heading.current?.focus()
  }, [confirmed])

  return (
    <>
      {confirmed ? <ResultMark icon={Check} tone="done" /> : valid ? null : <ResultMark icon={CircleAlert} tone="problem" />}
      <h1 ref={heading} tabIndex={-1} className={EMAIL_LINK_TEXT.heading}>
        {confirmed ? `${Label} confirmed` : `Confirm your ${label}`}
      </h1>
      <p role="status" className={EMAIL_LINK_TEXT.lead}>
        {confirmed
          ? `Your ${label} is confirmed.`
          : valid
            ? `Select the button below to confirm your ${label}. Nothing changes until you do.`
            : "This link is invalid or has expired. Please request a new confirmation email."}
      </p>
      {error ? (
        <p role="alert" className="m-0 mt-6 text-base font-semibold text-destructive">
          {error === "expired"
            ? "We couldn’t confirm this link. It may have expired; please request a new confirmation email."
            : "We couldn’t confirm right now. Please try again."}
        </p>
      ) : null}
      <div className="mt-9 flex flex-col gap-3.5 sm:flex-row sm:flex-wrap sm:items-center">
        {valid && !confirmed ? (
          <button type="button" onClick={() => void confirm()} disabled={busy} aria-busy={busy} className={EMAIL_LINK_BUTTON.primary}>
            {busy ? <LoaderCircle aria-hidden width={20} height={20} className="animate-spin motion-reduce:animate-none" /> : null}
            {busy ? "Confirming…" : `Confirm ${label}`}
          </button>
        ) : null}
        <a href="/" className={valid && !confirmed ? EMAIL_LINK_BUTTON.outline : EMAIL_LINK_BUTTON.primary}>
          Return to the home page
          <ArrowRight aria-hidden width={20} height={20} />
        </a>
      </div>
      {valid && !confirmed ? (
        <noscript>
          <p className={EMAIL_LINK_TEXT.help}>Please enable JavaScript to confirm here.</p>
        </noscript>
      ) : null}
    </>
  )
}
