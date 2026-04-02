import { Clock3, MailIcon, MessageCircle, Star } from "lucide-react"

import { ContactForm } from "@/components/contact/contact-form.client"

const CONTACT_FORM_ID = "velvet_contact_section"

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
  const whatsappDigits = phoneNumber.replace(/\D/g, "")
  const whatsappHref = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent("Hi Ian, I'd like to discuss a website project.")}`

  return (
    <section id="contact" className="py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="vd-surface-panel vd-soft-panel rounded-[calc(var(--vd-radius)+18px)] p-6 md:p-10">
          <div className="mb-10 max-w-3xl space-y-3">
            <p className="inline-flex rounded-full border border-[color-mix(in_oklch,var(--vd-border)_82%,transparent)] bg-background px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--vd-muted-fg)]">
              Let&apos;s build something valuable
            </p>
            <h2 className="text-2xl font-semibold tracking-tight">Tell me about your project</h2>
            <p className="text-[var(--vd-copy)]">
              Share your goals, current pain points, and timeline. You will hear back directly from Ian within one business day.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="vd-surface-card border border-[color-mix(in_oklch,var(--vd-border)_82%,transparent)] bg-background/80 p-5 md:p-6">
              <div className="mb-6 flex items-center gap-2">
                <MessageCircle className="size-5 text-[var(--vd-muted-fg)]" />
                <h3 className="vd-section-heading text-lg font-medium">Questions people usually ask</h3>
              </div>
              <div className="space-y-3">
                {faqs.map((faq) => (
                  <details
                    key={faq.question}
                    className="group rounded-[calc(var(--vd-radius)+4px)] border border-[color-mix(in_oklch,var(--vd-border)_72%,transparent)] bg-background/90 px-4 py-3"
                  >
                    <summary className="cursor-pointer list-none text-base font-medium text-[var(--vd-fg)] marker:hidden">
                      <span className="flex items-start justify-between gap-4">
                        <span>{faq.question}</span>
                        <span className="mt-0.5 text-[var(--vd-muted-fg)] transition-transform group-open:rotate-45">+</span>
                      </span>
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed text-[var(--vd-copy)]">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>

            <div className="vd-surface-card border border-[color-mix(in_oklch,var(--vd-border)_82%,transparent)] bg-background/84 p-5 md:p-6">
              <div className="mb-4 flex items-center gap-2">
                <MailIcon className="size-5 text-[var(--vd-muted-fg)]" />
                <h3 className="vd-section-heading text-lg font-medium">Project enquiry</h3>
              </div>

              <p className="mb-4 text-sm text-[var(--vd-copy)]">You&apos;ll hear directly from Ian with clear next steps.</p>

              <div className="mb-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[color-mix(in_oklch,var(--vd-border)_72%,transparent)] bg-card p-3">
                  <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--vd-muted-fg)]">
                    <Star className="h-3.5 w-3.5 text-primary" />
                    Google rating
                  </p>
                  <p className="text-sm font-semibold text-foreground">5.0 average from clients</p>
                </div>
                <div className="rounded-xl border border-[color-mix(in_oklch,var(--vd-border)_72%,transparent)] bg-card p-3">
                  <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--vd-muted-fg)]">
                    <Clock3 className="h-3.5 w-3.5 text-primary" />
                    Typical response
                  </p>
                  <p className="text-sm font-semibold text-foreground">Within 1 business day</p>
                </div>
              </div>

              <div className="mb-5 rounded-xl border border-[color-mix(in_oklch,var(--vd-border)_72%,transparent)] bg-card p-4">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  data-analytics-event="whatsapp_click"
                  data-analytics-category="contact"
                  data-analytics-label="Quick chat on WhatsApp"
                  data-analytics-section="contact"
                  className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline-offset-4 hover:text-primary"
                >
                  <MessageCircle className="size-4" />
                  Quick chat on WhatsApp
                </a>
                <p className="mt-1 text-xs text-[var(--vd-muted-fg)]">
                  Prefer chat first? WhatsApp is often the fastest route.
                </p>
              </div>

              <div className="rounded-[calc(var(--vd-radius)+8px)] border border-[color-mix(in_oklch,var(--vd-border)_72%,transparent)] bg-background p-5">
                <ContactForm
                  analyticsFormId={CONTACT_FORM_ID}
                  messagePlaceholder="Tell me about your goals, audience, and what needs fixing."
                  submitLabel="Send project enquiry"
                  successDelayMs={0}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
