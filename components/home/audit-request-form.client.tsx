"use client"

import { useState, type FormEvent } from "react"

import { trackAnalyticsEvent } from "@/lib/analytics/client"
import { HOME_BTN_PRIMARY, HOME_FIELD, HOME_FIELD_LABEL } from "./home-shared"

const FORM_ID = "velvet_audit_page"

type Status = { type: "idle" | "loading" | "sent" | "error"; message?: string }

function normalizeWebsite(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ""
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

export function AuditRequestForm() {
  const [name, setName] = useState("")
  const [website, setWebsite] = useState("")
  const [email, setEmail] = useState("")
  const [note, setNote] = useState("")
  const [status, setStatus] = useState<Status>({ type: "idle" })

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const site = normalizeWebsite(website)
    if (!email.trim() || !site) {
      setStatus({ type: "error", message: "Please add your website address and email." })
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
          topic: site.slice(0, 120),
          email: email.trim(),
          formId: FORM_ID,
          message: note.trim() || `Free audit request for ${site}`,
        }),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        throw new Error(payload?.error || "Unable to send your request right now.")
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
        message: error instanceof Error ? error.message : "Unable to send your request right now.",
      })
    }
  }

  if (status.type === "sent") {
    return (
      <div className="rounded-lg border border-[color-mix(in_srgb,var(--vd-score-perfect)_45%,var(--vd-border))] bg-[color-mix(in_srgb,var(--vd-score-perfect)_12%,var(--vd-bg))] p-5 text-sm font-semibold text-foreground">
        Thanks — your audit request is in. Ian will email your video within two business days.
      </div>
    )
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} data-analytics-form={FORM_ID}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="audit-name" className={HOME_FIELD_LABEL}>
            Your name
          </label>
          <input
            id="audit-name"
            className={HOME_FIELD}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex Morgan"
            autoComplete="name"
            disabled={status.type === "loading"}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="audit-email" className={HOME_FIELD_LABEL}>
            Email address
          </label>
          <input
            id="audit-email"
            className={HOME_FIELD}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.org"
            type="email"
            required
            autoComplete="email"
            disabled={status.type === "loading"}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="audit-website" className={HOME_FIELD_LABEL}>
          Your website address
        </label>
        <input
          id="audit-website"
          className={HOME_FIELD}
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="yourbusiness.co.uk"
          required
          inputMode="url"
          autoComplete="url"
          disabled={status.type === "loading"}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="audit-note" className={HOME_FIELD_LABEL}>
          Anything you already suspect is wrong? (optional)
        </label>
        <textarea
          id="audit-note"
          className={`${HOME_FIELD} resize-y`}
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Hardly any enquiries come through the site, and it feels slow on phones."
          disabled={status.type === "loading"}
        />
      </div>
      <button
        type="submit"
        className={`${HOME_BTN_PRIMARY} w-fit cursor-pointer border-none px-7 py-3.5 text-sm disabled:opacity-60`}
        disabled={status.type === "loading"}
      >
        {status.type === "loading" ? "Sending…" : "Request my free audit"}
      </button>
      {status.type === "error" ? (
        <p className="m-0 text-[13px] font-semibold text-destructive">{status.message}</p>
      ) : null}
    </form>
  )
}
