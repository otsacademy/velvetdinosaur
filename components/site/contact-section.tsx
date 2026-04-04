import { MapPin, MessageCircle, Phone } from "lucide-react"

import { Contact25 } from "@/components/contact25"
import { ContactForm } from "@/components/contact/contact-form.client"

const CONTACT_FORM_ID = "velvet_contact_section"
const MAPS_APP_HREF = "https://maps.app.goo.gl/qXGMvoF1E36RWeDS9"
const MAP_EMBED_SRC = "https://www.google.com/maps?q=51.7936206,-1.5530184&z=16&output=embed"
const WHATSAPP_HREF =
  "https://wa.me/447438460437?text=Hi%20Ian%2C%20I'd%20like%20to%20discuss%20a%20website%20project."

const faqs = [
  {
    question: "What's included in the £2,500 package?",
    answer:
      "The £2,500 package includes custom design and build, SEO-ready page structure, performance optimisation, contact forms, launch support, SSL, daily backups, support portal access, and handover guidance. I agree the scope with you before development starts so the deliverables are clear. Advanced features are quoted separately before build begins.",
  },
  {
    question: "Do I own my website and domain?",
    answer:
      "Yes. You retain ownership of your domain, content, and website assets. Accounts and access are set up in your name, not locked in a closed platform, so you can manage or move your site whenever you choose.",
  },
  {
    question: "What happens after the first year?",
    answer:
      "Hosting is £120/year after Year 1. Domain renewal is separate and procured at cost price. You can keep ongoing support if you want it, or run the site independently with full access and handover documentation.",
  },
  {
    question: "Can I move my site elsewhere later?",
    answer:
      "Yes. There is no lock-in. If you decide to migrate, I provide practical support, technical handover details, and a clear transition plan to keep downtime and risk low.",
  },
  {
    question: "How quickly can we start?",
    answer:
      "Most projects can start within one to two weeks, depending on scope and how ready your content is. A standard build is usually delivered in about 4-6 weeks, with clear milestones from discovery through launch.",
  },
  {
    question: "Can you improve an existing site?",
    answer:
      "Yes. I regularly improve existing websites, including redesigns, speed fixes, technical SEO improvements, and migrations away from older platforms. Work can also be phased so you do not need a full rebuild on day one.",
  },
]

export function ContactSection() {
  const phoneNumber = process.env.NEXT_PUBLIC_PHONE ?? "+447438460437"
  const callHref = `tel:${phoneNumber.replace(/\s+/g, "")}`
  const phoneDisplay = formatPhoneDisplay(phoneNumber)

  return (
    <Contact25
      sectionId="contact"
      className="py-8"
      title="Tell me about your project"
      description="Share your goals, current pain points, and timeline. You will hear back directly from Ian within one business day."
      faqTitle="Questions people usually ask"
      formTitle="Project enquiry"
      formDescription={"You'll hear directly from Ian with clear next steps."}
      faqs={faqs}
      detailsContent={
        <>
          <div className="rounded-xl border border-[color-mix(in_oklch,var(--vd-border)_72%,transparent)] bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <Phone className="size-4 text-[var(--vd-primary)]" />
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--vd-muted-fg)]">
                Direct contact
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <a
                href={callHref}
                className="rounded-xl border border-[color-mix(in_oklch,var(--vd-border)_72%,transparent)] bg-background px-4 py-3 transition-colors hover:border-[color-mix(in_oklch,var(--vd-primary)_24%,var(--vd-border))] hover:bg-[color-mix(in_oklch,var(--vd-primary)_4%,var(--vd-bg))]"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Phone className="size-4 text-[var(--vd-primary)]" />
                  Call Ian
                </span>
                <span className="mt-1 block text-sm text-[var(--vd-copy)]">{phoneDisplay}</span>
              </a>

              <a
                href={WHATSAPP_HREF}
                target="_blank"
                rel="noreferrer"
                data-analytics-event="whatsapp_click"
                data-analytics-category="contact"
                data-analytics-label="Quick chat on WhatsApp"
                data-analytics-section="contact"
                className="rounded-xl border border-[color-mix(in_oklch,var(--vd-border)_72%,transparent)] bg-background px-4 py-3 transition-colors hover:border-[color-mix(in_oklch,var(--vd-primary)_24%,var(--vd-border))] hover:bg-[color-mix(in_oklch,var(--vd-primary)_4%,var(--vd-bg))]"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <MessageCircle className="size-4 text-[var(--vd-primary)]" />
                  WhatsApp
                </span>
                <span className="mt-1 block text-sm text-[var(--vd-copy)]">Message about your project</span>
              </a>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-[color-mix(in_oklch,var(--vd-border)_72%,transparent)] bg-card">
            <div className="flex items-start justify-between gap-4 border-b border-[color-mix(in_oklch,var(--vd-border)_72%,transparent)] px-4 py-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--vd-muted-fg)]">
                  <MapPin className="size-4 text-[var(--vd-primary)]" />
                  Google map
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  16 Holloway Lane, Minster Lovell, Witney
                </p>
              </div>

              <a
                href={MAPS_APP_HREF}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 text-sm font-medium text-foreground underline-offset-4 hover:underline"
              >
                Open map
              </a>
            </div>

            <div className="aspect-[16/10] w-full bg-muted/30">
              <iframe
                title="Velvet Dinosaur location on Google Maps"
                src={MAP_EMBED_SRC}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full w-full border-0"
              />
            </div>
          </div>
        </>
      }
      formContent={
        <ContactForm
          analyticsFormId={CONTACT_FORM_ID}
          messagePlaceholder="Tell me about your goals, audience, and what needs fixing."
          submitLabel="Send project enquiry"
          successDelayMs={0}
        />
      }
    />
  )
}

function formatPhoneDisplay(phoneNumber: string) {
  const digits = phoneNumber.replace(/\D/g, "")

  if (digits.length === 12 && digits.startsWith("44")) {
    return `+44 ${digits.slice(2, 6)} ${digits.slice(6)}`
  }

  if (digits.length === 11 && digits.startsWith("0")) {
    return `${digits.slice(0, 5)} ${digits.slice(5)}`
  }

  return phoneNumber
}
