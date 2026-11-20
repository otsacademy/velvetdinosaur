"use client"

/* eslint-disable @next/next/no-html-link-for-pages -- Leave the private token page with a full navigation and fresh analytics state. */

import { ArrowRight, Check, CircleAlert, LoaderCircle } from "lucide-react"

import type { UnsubscribePageState } from "@/lib/newsletter/unsubscribe-state"
import { EMAIL_LINK_BUTTON, EMAIL_LINK_TEXT, ResultMark } from "./email-link-page"
import { useUnsubscribeConfirmation, type UnsubscribeView } from "./email-link-actions"

const CONTACT_HREF = "/contact"

const TITLES: Record<Exclude<UnsubscribeView, "subscribed">, string> = {
  unsubscribed: "You’re unsubscribed.",
  kept: "You’re still subscribed.",
  already: "You’re already unsubscribed.",
  inactive: "You’re not currently subscribed.",
  invalid: "This link isn’t valid.",
  expired: "This link has expired.",
  unavailable: "Please try again shortly.",
}

const EMAIL = "font-semibold text-foreground [overflow-wrap:anywhere]"

export function UnsubscribeForm({ token, initialState }: { token: string; initialState: UnsubscribePageState }) {
  const { view, busy, failed, email, heading, error, unsubscribe, keep } = useUnsubscribeConfirmation(token, initialState)
  const help = (
    <p className={EMAIL_LINK_TEXT.help}>
      Need help?{" "}
      <a href={CONTACT_HREF} className={EMAIL_LINK_TEXT.link}>
        Contact us
      </a>
      .
    </p>
  )

  if (view === "subscribed") {
    return (
      <>
        <h1 ref={heading} tabIndex={-1} className={EMAIL_LINK_TEXT.heading}>
          Unsubscribe from the newsletter?
        </h1>
        <p className={EMAIL_LINK_TEXT.lead}>Please confirm that you’d like to stop receiving our newsletter.</p>
        <dl className="m-0 mb-6 mt-9 max-w-[640px] border-y border-border py-5">
          <dt className="text-[15px] text-muted-foreground">Email address</dt>
          <dd className={`m-0 mt-1.5 text-[21px] ${EMAIL}`}>{email}</dd>
        </dl>
        {failed ? (
          <div
            ref={error}
            role="alert"
            tabIndex={-1}
            className="mb-6 max-w-[640px] rounded-lg border border-border bg-card p-5 text-base text-muted-foreground outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
          >
            <strong className="block font-semibold text-destructive">We couldn’t confirm your request.</strong>
            Please try again. If it still doesn’t work,{" "}
            <a href={CONTACT_HREF} className={EMAIL_LINK_TEXT.link}>
              contact us
            </a>
            .
          </div>
        ) : (
          <p className="m-0 mb-6 max-w-[640px] text-[17px] text-muted-foreground">
            <strong className="font-semibold text-foreground">You’re still subscribed.</strong> Your subscription will
            only change after you confirm below.
          </p>
        )}
        <form onSubmit={unsubscribe} aria-busy={busy}>
          <div className="flex flex-col gap-3.5 sm:flex-row sm:flex-wrap">
            <button type="submit" disabled={busy} className={EMAIL_LINK_BUTTON.primary}>
              {busy ? <LoaderCircle aria-hidden width={20} height={20} className="animate-spin motion-reduce:animate-none" /> : null}
              {busy ? "Unsubscribing…" : "Yes, unsubscribe"}
            </button>
            <button type="button" disabled={busy} onClick={keep} className={EMAIL_LINK_BUTTON.outline}>
              Keep me subscribed
            </button>
          </div>
        </form>
        <noscript>
          <p className={EMAIL_LINK_TEXT.help}>
            Please enable JavaScript to confirm here, or{" "}
            <a href={CONTACT_HREF} className={EMAIL_LINK_TEXT.link}>
              contact us
            </a>{" "}
            to unsubscribe.
          </p>
        </noscript>
        {help}
      </>
    )
  }

  const unavailable = view === "unavailable"
  const invalid = view === "invalid" || view === "expired"
  const title = view === "kept" && failed ? "Please check your subscription." : TITLES[view]
  return (
    <>
      <ResultMark icon={invalid || unavailable ? CircleAlert : Check} tone={invalid || unavailable ? "problem" : "done"} />
      <h1 ref={heading} tabIndex={-1} className={EMAIL_LINK_TEXT.heading}>
        {title}
      </h1>
      <div className={`${EMAIL_LINK_TEXT.lead} flex flex-col gap-4`}>
        {view === "unsubscribed" ? (
          <>
            <p className="m-0">
              <span className={EMAIL}>{email}</span> will no longer receive our newsletter.
            </p>
            <p className="m-0">Thank you for being part of our community.</p>
          </>
        ) : null}
        {view === "kept" ? (
          failed ? (
            <p className="m-0">
              Your earlier request may have completed. Open your newsletter link again to check the current subscription
              status.
            </p>
          ) : (
            <p className="m-0">
              You haven’t requested any changes to the newsletter subscription for <span className={EMAIL}>{email}</span>.
            </p>
          )
        ) : null}
        {view === "already" ? (
          <p className="m-0">
            <span className={EMAIL}>{email}</span> is already unsubscribed from our newsletter. There’s nothing else you
            need to do.
          </p>
        ) : null}
        {view === "inactive" ? (
          <p className="m-0">
            There isn’t an active newsletter subscription for <span className={EMAIL}>{email}</span>. We haven’t changed
            your preferences.
          </p>
        ) : null}
        {invalid ? (
          <>
            <p className="m-0">We haven’t changed your subscription.</p>
            <p className="m-0">Use the link in your most recent newsletter, or contact us and we’ll help you unsubscribe.</p>
          </>
        ) : null}
        {unavailable ? (
          <>
            <p className="m-0">We couldn’t load your newsletter preferences. We haven’t changed your subscription.</p>
            <p className="m-0">Please reload this page, or contact us for help.</p>
          </>
        ) : null}
      </div>
      <div className="mt-9 flex flex-col gap-3.5 sm:flex-row">
        <a href={invalid || unavailable ? CONTACT_HREF : "/"} className={EMAIL_LINK_BUTTON.primary}>
          {invalid || unavailable ? "Contact us" : "Return to the home page"}
          <ArrowRight aria-hidden width={20} height={20} />
        </a>
      </div>
      {help}
    </>
  )
}
