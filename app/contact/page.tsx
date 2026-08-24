import type { Metadata } from "next"

import { DesignShell } from "@/components/home/design-shell"
import { EnquiryForm } from "@/components/home/enquiry-form.client"
import { FaqAccordion } from "@/components/home/faq-accordion"
import { HOME_CARD, HOME_CONTAINER, HOME_KICKER, SectionHeading } from "@/components/home/home-shared"
import { siteName } from "@/lib/site-metadata"

const contactDescription =
  "Tell Velvet Dinosaur about your project. You'll hear back directly from Ian within one business day."

export const metadata: Metadata = {
  title: "Contact",
  description: contactDescription,
  alternates: { canonical: "/contact" },
  openGraph: {
    type: "website",
    url: "/contact",
    siteName,
    title: `Contact | ${siteName}`,
    description: contactDescription,
  },
}

const WHATSAPP_HREF =
  "https://wa.me/447438460437?text=Hi%20Ian%2C%20I'd%20like%20to%20discuss%20a%20website%20project."
const MAPS_HREF = "https://maps.app.goo.gl/qXGMvoF1E36RWeDS9"

const TALK_CARD_CLASSES =
  "flex flex-col gap-1 rounded-md border-[1.5px] border-input px-4 py-3.5 text-foreground transition-[transform,border-color] duration-300 ease-[var(--vd-hover-ease)] hover:-translate-y-[3px] hover:border-primary hover:text-foreground"

export default function ContactPage() {
  return (
    <DesignShell active="contact">
      <section className="border-b border-border bg-background">
        <div className={`${HOME_CONTAINER} py-12 md:pb-12 md:pt-16`}>
          <div className={`${HOME_KICKER} mb-4 text-[11px] text-primary`}>Say hello</div>
          <h1 className="m-0 mb-3.5 text-balance text-4xl font-extrabold tracking-[-0.033em] md:text-[42px]">
            Tell me about your project.
          </h1>
          <p className="m-0 max-w-[540px] text-pretty text-base leading-relaxed text-muted-foreground">
            Share your goals, current pain points, and timeline. You&apos;ll hear back directly
            from Ian within one business day.
          </p>
        </div>
      </section>

      <div className={`${HOME_CONTAINER} grid items-start gap-8 pb-6 pt-12 lg:grid-cols-[1.2fr_1fr]`}>
        <div id="form" className={`${HOME_CARD} scroll-mt-24 p-8 md:p-10`}>
          <div className="mb-1.5 text-lg font-bold">Project enquiry</div>
          <div className="mb-6 text-[13px] text-muted-foreground">
            You&apos;ll hear directly from Ian with clear next steps.
          </div>
          <EnquiryForm />
        </div>

        <div className="flex flex-col gap-4">
          <div className={`${HOME_CARD} p-7`}>
            <div className={`${HOME_KICKER} mb-4 text-[11px] text-muted-foreground`}>
              Prefer to talk?
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <a href="tel:+447438460437" className={TALK_CARD_CLASSES}>
                <span className="text-[13.5px] font-bold">📞 Call Ian</span>
                <span className="text-[12.5px] text-muted-foreground">+44 7438 460437</span>
              </a>
              <a
                href={WHATSAPP_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className={TALK_CARD_CLASSES}
              >
                <span className="text-[13.5px] font-bold">💬 WhatsApp</span>
                <span className="text-[12.5px] text-muted-foreground">
                  Message about your project
                </span>
              </a>
            </div>
          </div>

          <div className={`${HOME_CARD} p-7`}>
            <div className={`${HOME_KICKER} mb-3 text-[11px] text-muted-foreground`}>
              Where I’m based
            </div>
            <div className="text-sm font-semibold">16 Holloway Lane, Minster Lovell, Witney</div>
            <div className="mt-1 text-[12.5px] text-muted-foreground">
              Oxfordshire, United Kingdom
            </div>
            <a
              href={MAPS_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-[12.5px] font-semibold text-primary transition-colors hover:text-[var(--vd-primary-hover)]"
            >
              Open in Google Maps →
            </a>
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary/10 p-7">
            <div className={`${HOME_KICKER} mb-3 text-[11px] text-primary`}>Quick replies</div>
            <div className="text-sm font-medium leading-relaxed text-foreground">
              Enquiries answered within one business day — most projects can start within one to
              two weeks.
            </div>
          </div>
        </div>
      </div>

      <div className={`${HOME_CONTAINER} pb-16 pt-12 md:pb-[72px]`}>
        <SectionHeading index="FAQ" title="Questions people usually ask" />
        <FaqAccordion />
      </div>
    </DesignShell>
  )
}
