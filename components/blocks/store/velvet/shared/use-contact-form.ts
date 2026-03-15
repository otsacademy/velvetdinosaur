"use client"

import { useRef, useState, type FormEvent } from "react"
import { trackAnalyticsEvent } from "@/lib/analytics/client"

type ContactFormMessages = {
  successMessage?: string
  errorMessage?: string
  analyticsFormId?: string
}

export function useContactForm(messages: ContactFormMessages = {}) {
  const [formState, setFormState] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [formMessage, setFormMessage] = useState("")
  const hasTrackedStartRef = useRef(false)

  const successMessage = messages.successMessage ?? "Thanks - your message has been sent."
  const errorMessage = messages.errorMessage ?? "Something went wrong. Please try again."
  const analyticsFormId = messages.analyticsFormId ?? "founder_booking"

  const trackFormStart = () => {
    if (hasTrackedStartRef.current) return
    hasTrackedStartRef.current = true
    void trackAnalyticsEvent({
      eventType: "engagement",
      eventName: "form_start",
      eventCategory: "form",
      formId: analyticsFormId,
    })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormState("submitting")
    setFormMessage("")
    trackFormStart()
    void trackAnalyticsEvent({
      eventType: "engagement",
      eventName: "form_submit",
      eventCategory: "form",
      formId: analyticsFormId,
    })

    const formData = new FormData(event.currentTarget)
    const payload = Object.fromEntries(formData.entries())

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const rawText = await response.text().catch(() => "")
      let data: { success?: boolean; error?: string } | null = null

      if (rawText) {
        try {
          data = JSON.parse(rawText) as { success?: boolean; error?: string }
        } catch {
          data = null
        }
      }

      if (response.ok && data?.success !== false) {
        setFormState("success")
        setFormMessage(successMessage)
        hasTrackedStartRef.current = false
        void trackAnalyticsEvent({
          eventType: "conversion",
          eventName: "form_submit_success",
          eventCategory: "form",
          formId: analyticsFormId,
          conversionName: "contact_submit_success",
        })
        event.currentTarget.reset()
      } else {
        setFormState("error")
        setFormMessage(data?.error ?? errorMessage)
      }
    } catch {
      setFormState("error")
      setFormMessage(errorMessage)
    }
  }

  return { formState, formMessage, handleSubmit, trackFormStart }
}
