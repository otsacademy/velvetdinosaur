"use client"

import { useState, type FormEvent } from "react"

import { trackAnalyticsEvent } from "@/lib/analytics/client"
import { HOME_BTN_PRIMARY } from "./home-shared"

const FORM_ID = "velvet_contact_page"

const FIELD_CLASSES =
  "w-full rounded-md border-[1.5px] border-input bg-background px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15"

const LABEL_CLASSES = "text-[12.5px] font-semibold text-muted-foreground"

type Status = { type: "idle" | "loading" | "sent" | "error"; message?: string }

export function EnquiryForm() {
  const [name, setName] = useState("")
  const [org, setOrg] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<Status>({ type: "idle" })

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email.trim() || !message.trim()) {
      setStatus({ type: "error", message: "Please add your email and message." })
      return
    }
    setStatus({ type: "loading" })
    void trackAnalyticsEvent({
      eventType: "engagement",
      eventName: "form_submit",
      eventCategory: "form",
      formId: FORM_ID,
    })
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          topic: org.trim() || undefined,
          email: email.trim(),
          formId: FORM_ID,
          message: message.trim(),
        }),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        throw new Error(payload?.error || "Unable to send your enquiry right now.")
      }
      setStatus({ type: "sent" })
      void trackAnalyticsEvent({
        eventType: "conversion",
        eventName: "form_submit_success",
        eventCategory: "form",
        formId: FORM_ID,
        conversionName: "contact_submit_success",
      })
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to send your enquiry right now.",
      })
    }
  }

  if (status.type === "sent") {
    return (
      <div className="rounded-lg border border-[color-mix(in_srgb,var(--vd-score-perfect)_45%,var(--vd-border))] bg-[color-mix(in_srgb,var(--vd-score-perfect)_12%,var(--vd-bg))] p-5 text-sm font-semibold text-foreground">
        Thanks — your enquiry is on its way. Ian will reply within one business day.
      </div>
    )
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} data-analytics-form={FORM_ID}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="enquiry-name" className={LABEL_CLASSES}>
            Your name
          </label>
          <input
            id="enquiry-name"
            className={FIELD_CLASSES}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex Morgan"
            autoComplete="name"
            disabled={status.type === "loading"}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="enquiry-org" className={LABEL_CLASSES}>
            Organisation
          </label>
          <input
            id="enquiry-org"
            className={FIELD_CLASSES}
            value={org}
            onChange={(e) => setOrg(e.target.value)}
            placeholder="Optional"
            autoComplete="organization"
            disabled={status.type === "loading"}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="enquiry-email" className={LABEL_CLASSES}>
          Email address
        </label>
        <input
          id="enquiry-email"
          className={FIELD_CLASSES}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.org"
          type="email"
          required
          autoComplete="email"
          disabled={status.type === "loading"}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="enquiry-message" className={LABEL_CLASSES}>
          Your message
        </label>
        <textarea
          id="enquiry-message"
          className={`${FIELD_CLASSES} resize-y`}
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell me about your goals, audience, and what needs fixing."
          required
          disabled={status.type === "loading"}
        />
      </div>
      <button
        type="submit"
        className={`${HOME_BTN_PRIMARY} w-fit cursor-pointer border-none px-7 py-3.5 text-sm disabled:opacity-60`}
        disabled={status.type === "loading"}
      >
        {status.type === "loading" ? "Sending…" : "Send project enquiry"}
      </button>
      {status.type === "error" ? (
        <p className="m-0 text-[13px] font-semibold text-destructive">{status.message}</p>
      ) : null}
    </form>
  )
}
