import type { Metadata } from "next"

import { DesignShell } from "@/components/home/design-shell"
import { EnquiryForm } from "@/components/home/enquiry-form.client"
import { FaqAccordion } from "@/components/home/faq-accordion"
import { HOME_CARD, HOME_CONTAINER, HOME_KICKER, SectionHeading } from "@/components/home/home-shared"
import {
  ADDRESS_LINE_1,
  ADDRESS_LINE_2,
  MAPS_HREF,
  MAP_EMBED_SRC,
  PHONE_DISPLAY,
  PHONE_HREF,
  WHATSAPP_HREF,
} from "@/lib/contact-details"
import { siteName } from "@/lib/site-metadata"

const contactDescription =
  "Start your free Velvet Dinosaur preview, or just ask a question. Either way you'll hear back directly from Ian within one business day."

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

export default function ContactPage() {
  return (
    <DesignShell active="contact">
      <section className="border-b border-border bg-background">
        <div className={`${HOME_CONTAINER} py-12 md:pb-12 md:pt-16`}>
          <div className={`${HOME_KICKER} mb-4 text-[11px] text-primary`}>Say hello</div>
          <h1 className="m-0 mb-3.5 text-balance text-4xl font-extrabold tracking-[-0.033em] md:text-[42px]">
            Request your free preview.
          </h1>
          <p className="m-0 max-w-[540px] text-pretty text-base leading-relaxed text-muted-foreground">
            Tell me a little about your business and I&apos;ll build your new website first —
            you see the finished thing before you pay a penny. Just have a question instead?
            That&apos;s the second option below. Either way you&apos;ll hear back directly from
            Ian within one business day.
          </p>
        </div>
      </section>

      <div className={`${HOME_CONTAINER} grid items-start gap-8 pb-16 pt-12 md:pb-[72px] lg:grid-cols-[1.2fr_1fr]`}>
        <div id="form" className={`${HOME_CARD} scroll-mt-24 p-8 md:p-10`}>
          <div className="mb-1.5 text-lg font-bold">Your free preview</div>
          <div className="mb-6 text-[13px] text-muted-foreground">
            No payment details, no obligation — you&apos;ll hear directly from Ian with clear
            next steps.
          </div>
          <EnquiryForm />
        </div>

        <div className="flex flex-col gap-4">
          <div className={`${HOME_CARD} overflow-hidden`}>
            <div className="p-7 pb-4">
              <div className={`${HOME_KICKER} mb-3 text-[11px] text-muted-foreground`}>
                Where I’m based
              </div>
              <div className="text-sm font-semibold">{ADDRESS_LINE_1}</div>
              <div className="mt-1 text-[12.5px] text-muted-foreground">{ADDRESS_LINE_2}</div>
            </div>
            <iframe
              data-map
              src={MAP_EMBED_SRC}
              title="Map showing Velvet Dinosaur in Minster Lovell, Oxfordshire"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="block h-[220px] w-full border-0 border-t border-border"
            />
            <div className="px-7 py-4">
              <a
                href={MAPS_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12.5px] font-semibold text-primary transition-colors hover:text-[var(--vd-primary-hover)]"
              >
                Open in Google Maps →
              </a>
            </div>
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary/10 p-7">
            <div className={`${HOME_KICKER} mb-3 text-[11px] text-primary`}>Quick replies</div>
            <div className="text-sm font-medium leading-relaxed text-foreground">
              Enquiries answered within one business day — most previews are ready within one to
              two weeks.
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-primary/20 pt-3.5 text-[13px] font-semibold">
              <span className="text-muted-foreground">Rather talk?</span>
              <a
                href="mailto:hello@velvetdinosaur.com"
                className="text-primary transition-colors hover:text-[var(--vd-primary-hover)]"
              >
                <span aria-hidden>✉️</span> hello@velvetdinosaur.com
              </a>
              <a
                href={PHONE_HREF}
                className="text-primary transition-colors hover:text-[var(--vd-primary-hover)]"
              >
                <span aria-hidden>📞</span> {PHONE_DISPLAY}
              </a>
              <a
                href={WHATSAPP_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary transition-colors hover:text-[var(--vd-primary-hover)]"
              >
                <span aria-hidden>💬</span> WhatsApp
              </a>
            </div>
          </div>

          <div>
            <SectionHeading index="FAQ" title="Questions people usually ask" />
            <FaqAccordion />
          </div>
        </div>
      </div>
    </DesignShell>
  )
}
