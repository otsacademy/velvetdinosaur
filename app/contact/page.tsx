import type { Metadata } from "next"

import { DesignShell } from "@/components/home/design-shell"
import { EnquiryForm } from "@/components/home/enquiry-form.client"
import {
  HOME_CONTAINER,
  HOME_KICKER,
  LETTER_EM,
  LETTER_HAND,
  LETTER_LEAD,
  LETTER_LINK,
} from "@/components/home/home-shared"
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

const contactTitle = `Request your free website preview | ${siteName}`
const contactDescription =
  "Start your free Velvet Dinosaur preview, or just ask a question. Either way you'll hear back directly from Ian, a web designer near Witney, within one business day."

export const metadata: Metadata = {
  title: contactTitle,
  description: contactDescription,
  alternates: { canonical: "/contact" },
  openGraph: {
    type: "website",
    url: "/contact",
    siteName,
    title: contactTitle,
    description: contactDescription,
  },
}

const NEXT_STEPS = [
  "You hear back directly from me within one business day.",
  "I build your preview. Most are ready within one to two weeks.",
  "You try it free for 14 days, then decide. No payment details, no obligation.",
] as const

export default function ContactPage() {
  return (
    <DesignShell active="contact">
      {/* On small screens the form follows the introduction; on wide screens it
          takes the right-hand column beside both blocks of text. */}
      <section
        className={`${HOME_CONTAINER} grid items-start gap-x-[72px] gap-y-12 pb-20 pt-12 sm:pb-[110px] sm:pt-[76px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:grid-rows-[auto_1fr]`}
      >
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <p className={`${LETTER_HAND} m-0 mb-3 origin-bottom-left -rotate-3 text-[34px]`}>
            Say hello,
          </p>
          <h1 className="m-0 text-balance text-[clamp(2.5rem,4.8vw,4.125rem)] leading-[1.04] tracking-[-0.022em]">
            Request your <em className={LETTER_EM}>free preview.</em>
          </h1>
          <p className={`${LETTER_LEAD} mt-6 max-w-[520px]`}>
            Tell me a little about your business and I’ll build your new website first. You see
            the finished thing before you pay a penny. Just have a question instead? That’s the
            second option on the form.
          </p>
        </div>

        <div
          id="form"
          className="min-w-0 scroll-mt-24 rounded-lg border border-border bg-card px-5 py-7 shadow-[var(--vd-shadow-card)] sm:px-[38px] sm:pb-10 sm:pt-[38px] lg:col-start-2 lg:row-span-2 lg:row-start-1"
        >
          <EnquiryForm />
        </div>

        <div className="min-w-0 lg:col-start-1 lg:row-start-2">
          <h2 className={`${HOME_KICKER} m-0 text-accent`}>What happens next</h2>
          <ol className="m-0 mt-[18px] flex max-w-[500px] list-none flex-col gap-[18px] p-0">
            {NEXT_STEPS.map((step, index) => (
              <li key={step} className="flex gap-4">
                <span className="flex size-[38px] flex-none items-center justify-center rounded-full border-[1.5px] border-primary font-serif text-xl font-semibold text-primary">
                  {index + 1}
                </span>
                <span className="pt-1">{step}</span>
              </li>
            ))}
          </ol>

          <div className="mt-[46px] flex flex-wrap gap-x-12 gap-y-[26px] border-t border-border pt-[30px]">
            <div>
              <h2 className={`${HOME_KICKER} m-0 mb-2.5 text-accent`}>Rather talk?</h2>
              <p className="m-0 flex flex-col items-start gap-1.5">
                <a href={PHONE_HREF} className={LETTER_LINK}>
                  {PHONE_DISPLAY}
                </a>
                <a
                  href={WHATSAPP_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={LETTER_LINK}
                >
                  WhatsApp
                </a>
                <a href="mailto:hello@velvetdinosaur.com" className={LETTER_LINK}>
                  hello@velvetdinosaur.com
                </a>
              </p>
            </div>
            <div>
              <h2 className={`${HOME_KICKER} m-0 mb-2.5 text-accent`}>Where I’m based</h2>
              <p className="m-0 text-muted-foreground">
                {ADDRESS_LINE_1}
                <br />
                {ADDRESS_LINE_2}
                <br />
                <a
                  href={MAPS_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={LETTER_LINK}
                >
                  Open in Google Maps
                </a>
              </p>
            </div>
          </div>

          <iframe
            data-map
            src={MAP_EMBED_SRC}
            title="Map showing Velvet Dinosaur in Minster Lovell, Oxfordshire"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="mt-[30px] block h-[240px] w-full max-w-[560px] rounded-lg border border-border"
          />
        </div>
      </section>
    </DesignShell>
  )
}
