import { MapPin, MessageCircle, Phone } from "lucide-react"

import { Contact25 } from "@/components/contact25"
import { ContactForm } from "@/components/contact/contact-form.client"
import { DeferredIframe } from "@/components/site/deferred-iframe.client"

const CONTACT_FORM_ID = "velvet_contact_section"
const MAPS_APP_HREF = "https://maps.app.goo.gl/qXGMvoF1E36RWeDS9"
const MAP_EMBED_SRC = "https://www.google.com/maps?q=51.7936206,-1.5530184&z=16&output=embed"
const WHATSAPP_HREF =
  "https://wa.me/447962705433?text=Hi%20Ian%2C%20I'd%20like%20to%20discuss%20a%20website%20project."

const faqs = [
  {
    question: "What's included in the £99 a month?",
    answer:
      "Everything your website needs: the design and build of your site, hosting, SSL, daily backups, security and software updates, your own CMS admin area, contact forms and enquiry inbox, email for your domain, and small content changes done for you. There is no setup fee and nothing extra to pay.",
  },
  {
    question: "How does the free preview work?",
    answer:
      "I build a working version of your new website first, then send you a private sign-up link. You set your own password and can try everything — edit text, swap photos, test the forms, view it on your phone. You have 14 days. If you're not interested, the preview is simply deleted and it costs you nothing.",
  },
  {
    question: "What happens after I subscribe?",
    answer:
      "We spend up to seven days refining the site together — by email, chat, video call, or in person where practical — then it launches on your domain. Your first 30 days are covered by my money-back guarantee: if it isn't right for your business, tell me and I'll refund everything you've paid.",
  },
  {
    question: "Do I own my website and domain?",
    answer:
      "Your domain, content, photographs, and business data are always yours, and you can export your data at any time. Your site runs on my Sauro platform, which I keep updated and improving for you — but what's yours stays yours.",
  },
  {
    question: "What happens after the first year?",
    answer:
      "Nothing changes and nothing surprises you: it stays £99 a month on a rolling basis with 30 days' notice. Or renew for another 12 months and I'll refresh your design completely free — your content, bookings, and settings stay exactly as they are.",
  },
  {
    question: "Can I move my site elsewhere later?",
    answer:
      "Yes. There is no lock-in. If you decide to migrate, I provide practical support, technical handover details, and a clear transition plan to keep downtime and risk low.",
  },
]

export function ContactSection() {
  const phoneNumber = process.env.NEXT_PUBLIC_PHONE ?? "+447962705433"
  const callHref = `tel:${phoneNumber.replace(/\s+/g, "")}`
  const phoneDisplay = formatPhoneDisplay(phoneNumber)
  const mapCard = (
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

      <div className="h-[220px] w-full bg-muted/30">
        <DeferredIframe
          title="Velvet Dinosaur location on Google Maps"
          src={MAP_EMBED_SRC}
          placeholderLabel="Load map preview"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-full w-full border-0"
        />
      </div>
    </div>
  )

  return (
    <Contact25
      sectionId="contact"
      className="py-8"
      title="Tell me about your website"
      description="Tell me about your business and what's not working online. You will hear back directly from Ian within one business day."
      faqTitle="Questions people usually ask"
      faqTopContent={mapCard}
      formTitle="Website enquiry"
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
                className="rounded-xl border border-[color-mix(in_oklch,var(--vd-border)_72%,transparent)] bg-background px-4 py-3 transition-all duration-200 hover:-translate-y-px hover:border-[color-mix(in_oklch,var(--vd-primary)_24%,var(--vd-border))] hover:bg-[color-mix(in_oklch,var(--vd-primary)_4%,var(--vd-bg))] hover:shadow-[0_2px_8px_color-mix(in_oklch,var(--vd-fg)_6%,transparent)]"
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
                className="rounded-xl border border-[color-mix(in_oklch,var(--vd-border)_72%,transparent)] bg-background px-4 py-3 transition-all duration-200 hover:-translate-y-px hover:border-[color-mix(in_oklch,var(--vd-primary)_24%,var(--vd-border))] hover:bg-[color-mix(in_oklch,var(--vd-primary)_4%,var(--vd-bg))] hover:shadow-[0_2px_8px_color-mix(in_oklch,var(--vd-fg)_6%,transparent)]"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <MessageCircle className="size-4 text-[var(--vd-primary)]" />
                  WhatsApp
                </span>
                <span className="mt-1 block text-sm text-[var(--vd-copy)]">Message about your project</span>
              </a>
            </div>
          </div>
        </>
      }
      formContent={
        <ContactForm
          analyticsFormId={CONTACT_FORM_ID}
          messagePlaceholder="Tell me about your business, your current website, and what needs fixing."
          submitLabel="Send enquiry"
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
