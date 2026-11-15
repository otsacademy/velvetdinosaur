"use client"

import Link from "next/link"
import { useEffect, useState, type ComponentProps, type FormEvent, type ReactNode } from "react"
import { Check, ChevronDown } from "lucide-react"

import { trackAnalyticsEvent } from "@/lib/analytics/client"
import {
  CONTACT_METHODS,
  PROJECT_FEATURES,
  WEBSITE_STATUSES,
  methodNeedsPhone,
  statusHasExistingSite,
  type EnquiryType,
} from "@/lib/enquiry-options"
import { cn } from "@/lib/utils"
import {
  BTN_LG,
  HOME_BTN_PRIMARY,
  HOME_FIELD,
  HOME_FIELD_LABEL,
  LETTER_LINK,
} from "./home-shared"

const FORM_ID = "velvet_contact_page"

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
    title: "Request my free preview",
    blurb: "I’d like a website built. Show me before I pay.",
  },
  {
    id: "question",
    title: "Just a question",
    blurb: "I want to ask something before going further.",
  },
]

// Shared by the option cards and the feature chips: the real control is a
// visually hidden input, so the label has to show the keyboard focus itself.
const CHOICE =
  "cursor-pointer border-[1.5px] transition-[transform,border-color] duration-200 hover:-translate-y-px hover:border-primary has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-[3px] has-[:focus-visible]:outline-ring has-[:focus-visible]:outline-solid motion-reduce:transition-none motion-reduce:hover:translate-y-0"

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
    const firstName = form.name.trim().split(/\s+/)[0]
    return (
      <div role="status" className="flex flex-col items-start gap-4 px-1 py-[18px]">
        <span className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check aria-hidden width={30} height={30} strokeWidth={2.4} />
        </span>
        <h2 className="m-0 text-[32px] leading-[1.1] tracking-[-0.015em] sm:text-[38px]">
          Thank you{firstName ? `, ${firstName}` : ""}. That’s with me now.
        </h2>
        <p className="m-0 text-[19px] text-muted-foreground">
          {isProject
            ? "You’ll hear back from me within one business day to confirm your free preview."
            : "You’ll hear back from me within one business day."}
        </p>
      </div>
    )
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit} data-analytics-form={FORM_ID}>
      <fieldset className="m-0 border-0 p-0">
        <legend className="sr-only">What would you like to do?</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {MODES.map((option) => (
            <label
              key={option.id}
              className={cn(
                CHOICE,
                "block rounded-lg px-[18px] py-4",
                mode === option.id
                  ? "border-primary bg-[color-mix(in_srgb,var(--primary)_9%,var(--card))]"
                  : "border-input bg-card",
              )}
            >
              <input
                type="radio"
                name="enquiry-mode"
                className="sr-only"
                checked={mode === option.id}
                onChange={() => setMode(option.id)}
                disabled={busy}
              />
              <strong className="block text-lg font-semibold">{option.title}</strong>
              <span className="mt-0.5 block text-[15px] text-muted-foreground">
                {option.blurb}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="enquiry-name" label="Your name">
          <input
            id="enquiry-name"
            className={HOME_FIELD}
            value={form.name}
            onChange={(e) => set("name")(e.target.value)}
            autoComplete="name"
            disabled={busy}
          />
        </Field>
        <Field id="enquiry-email" label="Email address">
          <input
            id="enquiry-email"
            className={HOME_FIELD}
            value={form.email}
            onChange={(e) => set("email")(e.target.value)}
            type="email"
            required
            autoComplete="email"
            disabled={busy}
          />
        </Field>
      </div>

      {isProject ? (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="enquiry-business" label="Business or organisation">
              <input
                id="enquiry-business"
                className={HOME_FIELD}
                value={form.business}
                onChange={(e) => set("business")(e.target.value)}
                autoComplete="organization"
                required
                disabled={busy}
              />
            </Field>
            <Field id="enquiry-business-type" label="Type of business">
              <input
                id="enquiry-business-type"
                className={HOME_FIELD}
                value={form.businessType}
                onChange={(e) => set("businessType")(e.target.value)}
                placeholder="e.g. café, charity, club"
                disabled={busy}
              />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="enquiry-website-status" label="Your website today">
              <SelectBox
                id="enquiry-website-status"
                value={form.websiteStatus}
                onChange={(e) => set("websiteStatus")(e.target.value)}
                disabled={busy}
              >
                {WEBSITE_STATUSES.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </SelectBox>
            </Field>
            {statusHasExistingSite(form.websiteStatus) ? (
              <Field id="enquiry-website" label="Your website address">
                <input
                  id="enquiry-website"
                  className={HOME_FIELD}
                  value={form.websiteUrl}
                  onChange={(e) => set("websiteUrl")(e.target.value)}
                  placeholder="www.yourbusiness.co.uk"
                  inputMode="url"
                  disabled={busy}
                />
              </Field>
            ) : null}
          </div>

          <fieldset className="m-0 border-0 p-0">
            <legend className={`${HOME_FIELD_LABEL} p-0`}>
              What would you like on your site?{" "}
              <span className="font-normal text-muted-foreground">
                Tick any that apply. All of it is included in the £99 a month.
              </span>
            </legend>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {PROJECT_FEATURES.map((feature) => {
                const selected = features.includes(feature.id)
                return (
                  <label
                    key={feature.id}
                    className={cn(
                      CHOICE,
                      "inline-flex min-h-[44px] items-center rounded-full px-4 py-1.5 text-base font-medium",
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-card text-foreground",
                    )}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={selected}
                      onChange={() => toggleFeature(feature.id)}
                      disabled={busy}
                    />
                    {feature.label}
                  </label>
                )
              })}
            </div>
          </fieldset>
        </>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="enquiry-method" label="How should I get in touch?">
          <SelectBox
            id="enquiry-method"
            value={form.contactMethod}
            onChange={(e) => set("contactMethod")(e.target.value)}
            disabled={busy}
          >
            {CONTACT_METHODS.map((method) => (
              <option key={method.id} value={method.id}>
                {method.label}
              </option>
            ))}
          </SelectBox>
        </Field>
        {methodNeedsPhone(form.contactMethod) ? (
          <Field id="enquiry-phone" label="Phone number">
            <input
              id="enquiry-phone"
              className={HOME_FIELD}
              value={form.phone}
              onChange={(e) => set("phone")(e.target.value)}
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
          className={`${HOME_FIELD} resize-y py-3`}
          rows={isProject ? 4 : 5}
          value={form.message}
          onChange={(e) => set("message")(e.target.value)}
          required={!isProject}
          disabled={busy}
        />
      </Field>

      {status.type === "error" ? (
        <p role="alert" className="m-0 text-base font-semibold text-destructive">
          {status.message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-[22px] gap-y-3.5">
        <button
          type="submit"
          className={`${HOME_BTN_PRIMARY} ${BTN_LG} cursor-pointer border-0 disabled:opacity-60`}
          disabled={busy}
        >
          {busy ? "Sending…" : isProject ? "Request my free preview" : "Send my question"}
        </button>
        <p className="m-0 flex-[1_1_200px] text-base text-muted-foreground">
          No payment details, no obligation. You hear back from me with clear next steps.
        </p>
      </div>
      <p className="m-0 text-[15px] text-muted-foreground">
        We’ll use these details only to respond to your enquiry.{" "}
        <Link href="/privacy" className={LETTER_LINK}>
          Read our Privacy Notice
        </Link>
        .
      </p>
    </form>
  )
}

// A native <select> drawn like the other fields: browsers give selects their
// own grey chrome otherwise, and a native control is still the best picker on
// a phone.
function SelectBox({ children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select {...props} className={`${HOME_FIELD} cursor-pointer appearance-none pr-10`}>
        {children}
      </select>
      <ChevronDown
        aria-hidden
        width={18}
        height={18}
        strokeWidth={2.2}
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  )
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={HOME_FIELD_LABEL}>
        {label}
      </label>
      {children}
    </div>
  )
}
