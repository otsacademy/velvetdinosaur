"use client"

import { useEffect, useState, type FormEvent } from "react"

import { trackAnalyticsEvent } from "@/lib/analytics/client"
import {
  CONTACT_METHODS,
  PROJECT_FEATURES,
  WEBSITE_STATUSES,
  methodNeedsPhone,
  statusHasExistingSite,
  type EnquiryType,
} from "@/lib/enquiry-options"
import { HOME_BTN_PRIMARY, HOME_FIELD, HOME_FIELD_LABEL } from "./home-shared"

const FORM_ID = "velvet_contact_page"

const FIELD = HOME_FIELD
const LABEL = HOME_FIELD_LABEL

type Status = { type: "idle" | "loading" | "sent" | "error"; message?: string }

const EMPTY = {
  name: "",
  email: "",
  contactMethod: "email",
  phone: "",
  business: "",
  businessType: "",
  websiteStatus: "new",
  websiteUrl: "",
  message: "",
}

const MODES: Array<{ id: EnquiryType; title: string; blurb: string }> = [
  {
    id: "project",
    title: "Start my free preview",
    blurb: "I'd like a website built — show me before I pay.",
  },
  {
    id: "question",
    title: "Just a question",
    blurb: "I want to ask something before going further.",
  },
]

export function EnquiryForm() {
  const [mode, setMode] = useState<EnquiryType>("project")
  const [form, setForm] = useState(EMPTY)
  const [features, setFeatures] = useState<string[]>([])
  const [status, setStatus] = useState<Status>({ type: "idle" })

  // Deep links can open the general form: /contact?enquiry=question. Read from
  // location rather than useSearchParams so the page stays statically rendered.
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("enquiry")
    if (param === "question" || param === "general") setMode("question")
  }, [])

  const isProject = mode === "project"
  const busy = status.type === "loading"
  const set = (key: keyof typeof EMPTY) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }))

  const toggleFeature = (id: string) =>
    setFeatures((current) =>
      current.includes(id) ? current.filter((f) => f !== id) : [...current, id],
    )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const email = form.email.trim()
    const message = form.message.trim()

    if (!email) {
      setStatus({ type: "error", message: "Please add your email address." })
      return
    }
    if (isProject && !form.business.trim()) {
      setStatus({ type: "error", message: "Please add your business or organisation name." })
      return
    }
    if (methodNeedsPhone(form.contactMethod) && !form.phone.trim()) {
      setStatus({ type: "error", message: "Please add a phone number so I can reach you." })
      return
    }
    if (!isProject && !message) {
      setStatus({ type: "error", message: "Please add your question." })
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
          formId: FORM_ID,
          enquiryType: mode,
          name: form.name.trim() || undefined,
          email,
          contactMethod: form.contactMethod,
          phone: form.phone.trim() || undefined,
          message: message || "(no additional notes)",
          project: isProject
            ? {
                business: form.business.trim(),
                businessType: form.businessType.trim() || undefined,
                websiteStatus: form.websiteStatus,
                websiteUrl: statusHasExistingSite(form.websiteStatus)
                  ? form.websiteUrl.trim() || undefined
                  : undefined,
                features,
              }
            : undefined,
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
        {isProject
          ? "Thanks — I’ve got everything I need to start. Ian will reply within one business day to confirm your free preview."
          : "Thanks — your message is on its way. Ian will reply within one business day."}
      </div>
    )
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit} data-analytics-form={FORM_ID}>
      <fieldset className="m-0 border-0 p-0">
        <legend className={`${LABEL} mb-2 p-0`}>What can I help with?</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {MODES.map((option) => {
            const selected = mode === option.id
            return (
              <label
                key={option.id}
                className={`flex cursor-pointer flex-col gap-1 rounded-md border-[1.5px] px-4 py-3.5 transition-colors duration-200 ${
                  selected
                    ? "border-primary bg-primary/10"
                    : "border-input hover:border-primary/60"
                }`}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="enquiry-mode"
                    className="accent-[var(--vd-primary)]"
                    checked={selected}
                    onChange={() => setMode(option.id)}
                    disabled={busy}
                  />
                  <span className="text-[13.5px] font-bold">{option.title}</span>
                </span>
                <span className="text-[12.5px] leading-relaxed text-muted-foreground">
                  {option.blurb}
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="enquiry-name" label="Your name">
          <input
            id="enquiry-name"
            className={FIELD}
            value={form.name}
            onChange={(e) => set("name")(e.target.value)}
            placeholder="e.g. Alex Morgan"
            autoComplete="name"
            disabled={busy}
          />
        </Field>
        <Field id="enquiry-email" label="Email address">
          <input
            id="enquiry-email"
            className={FIELD}
            value={form.email}
            onChange={(e) => set("email")(e.target.value)}
            placeholder="you@example.org"
            type="email"
            required
            autoComplete="email"
            disabled={busy}
          />
        </Field>
      </div>

      {isProject ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="enquiry-business" label="Business or organisation">
              <input
                id="enquiry-business"
                className={FIELD}
                value={form.business}
                onChange={(e) => set("business")(e.target.value)}
                placeholder="e.g. Minster Lovell Dental"
                autoComplete="organization"
                required
                disabled={busy}
              />
            </Field>
            <Field id="enquiry-business-type" label="Type of business">
              <input
                id="enquiry-business-type"
                className={FIELD}
                value={form.businessType}
                onChange={(e) => set("businessType")(e.target.value)}
                placeholder="e.g. café, charity, parish council"
                disabled={busy}
              />
            </Field>
          </div>

          <fieldset className="m-0 border-0 p-0">
            <legend className={`${LABEL} mb-2 p-0`}>Your website today</legend>
            <div className="flex flex-col gap-2">
              {WEBSITE_STATUSES.map((option) => (
                <label
                  key={option.id}
                  className="flex cursor-pointer items-center gap-2.5 text-[13.5px] text-foreground"
                >
                  <input
                    type="radio"
                    name="website-status"
                    className="accent-[var(--vd-primary)]"
                    checked={form.websiteStatus === option.id}
                    onChange={() => set("websiteStatus")(option.id)}
                    disabled={busy}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          {statusHasExistingSite(form.websiteStatus) ? (
            <Field id="enquiry-website" label="Your website address">
              <input
                id="enquiry-website"
                className={FIELD}
                value={form.websiteUrl}
                onChange={(e) => set("websiteUrl")(e.target.value)}
                placeholder="www.yourbusiness.co.uk"
                inputMode="url"
                disabled={busy}
              />
            </Field>
          ) : null}

          <fieldset className="m-0 border-0 p-0">
            <legend className={`${LABEL} mb-1 p-0`}>What should your website do?</legend>
            <p className="m-0 mb-2.5 text-[12.5px] text-muted-foreground">
              Everything below is included in the £99 a month — tick anything that sounds useful.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {PROJECT_FEATURES.map((feature) => (
                <label
                  key={feature.id}
                  className="flex cursor-pointer items-start gap-2.5 text-[13.5px] leading-relaxed text-foreground"
                >
                  <input
                    type="checkbox"
                    className="mt-1 accent-[var(--vd-primary)]"
                    checked={features.includes(feature.id)}
                    onChange={() => toggleFeature(feature.id)}
                    disabled={busy}
                  />
                  {feature.label}
                </label>
              ))}
            </div>
          </fieldset>

        </>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="enquiry-method" label="How should I get in touch?">
          <select
            id="enquiry-method"
            className={FIELD}
            value={form.contactMethod}
            onChange={(e) => set("contactMethod")(e.target.value)}
            disabled={busy}
          >
            {CONTACT_METHODS.map((method) => (
              <option key={method.id} value={method.id}>
                {method.label}
              </option>
            ))}
          </select>
        </Field>
        {methodNeedsPhone(form.contactMethod) ? (
          <Field id="enquiry-phone" label="Phone number">
            <input
              id="enquiry-phone"
              className={FIELD}
              value={form.phone}
              onChange={(e) => set("phone")(e.target.value)}
              placeholder="07000 000000"
              type="tel"
              autoComplete="tel"
              required
              disabled={busy}
            />
          </Field>
        ) : null}
      </div>

      <Field
        id="enquiry-message"
        label={isProject ? "Anything else I should know? (optional)" : "Your question"}
      >
        <textarea
          id="enquiry-message"
          className={`${FIELD} resize-y`}
          rows={isProject ? 4 : 5}
          value={form.message}
          onChange={(e) => set("message")(e.target.value)}
          placeholder={
            isProject
              ? "Anything you love or hate about your current site, deadlines, questions…"
              : "Ask me anything about how Velvet Dinosaur works."
          }
          required={!isProject}
          disabled={busy}
        />
      </Field>

      <button
        type="submit"
        className={`${HOME_BTN_PRIMARY} w-fit cursor-pointer border-none px-7 py-3.5 text-sm disabled:opacity-60`}
        disabled={busy}
      >
        {busy ? "Sending…" : isProject ? "Start my free preview" : "Send your question"}
      </button>
      {isProject ? (
        <p className="m-0 text-[12.5px] text-muted-foreground">
          No payment details needed. You see the finished website before you decide.
        </p>
      ) : null}
      {status.type === "error" ? (
        <p className="m-0 text-[13px] font-semibold text-destructive">{status.message}</p>
      ) : null}
    </form>
  )
}

function Field({
  id,
  label,
  children,
}: {
  id: string
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      {children}
    </div>
  )
}
