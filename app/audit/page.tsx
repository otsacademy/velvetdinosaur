import type { Metadata } from "next"
import Link from "next/link"

import { AuditRequestForm } from "@/components/home/audit-request-form.client"
import { DesignShell } from "@/components/home/design-shell"
import {
  HOME_BTN_OUTLINE,
  HOME_BTN_PRIMARY,
  HOME_CARD,
  HOME_CONTAINER,
  HOME_KICKER,
  ScoreCells,
  SectionHeading,
} from "@/components/home/home-shared"
import { siteName } from "@/lib/site-metadata"

const auditDescription =
  "A free 15-minute video audit of your website: what's slow, what's costing you enquiries, and exactly what to fix first. No meeting, no obligation."

export const metadata: Metadata = {
  title: "Free Website Audit",
  description: auditDescription,
  alternates: { canonical: "/audit" },
  openGraph: {
    type: "website",
    url: "/audit",
    siteName,
    title: `Free Website Audit | ${siteName}`,
    description: auditDescription,
  },
}

const WHATSAPP_HREF =
  "https://wa.me/447438460437?text=Hi%20Ian%2C%20I'd%20like%20a%20free%20audit%20of%20my%20website."

const AUDIT_CONTENTS = [
  {
    title: "Speed & Google scores",
    body: "I run your site through Google Lighthouse — the same test Google uses to rank pages — and show you your real scores on mobile and desktop, and what they mean for your search visibility.",
  },
  {
    title: "What's turning visitors away",
    body: "I walk through your site the way a first-time customer would, on a phone, and point out exactly where people get confused, lose trust, or give up before contacting you.",
  },
  {
    title: "Your three highest-impact fixes",
    body: "You get a short, prioritised list — the three changes that would make the biggest difference first, explained in plain English, with an honest view of what each takes to fix.",
  },
]

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Send me your web address",
    body: "Fill in the short form below — it takes about a minute. No call to book, nothing to prepare.",
  },
  {
    step: "02",
    title: "I record your video",
    body: "Within two business days you get a personal 15-minute screen recording of me reviewing your site — not an automated report.",
  },
  {
    step: "03",
    title: "The video is yours to keep",
    body: "Hand the fix list to anyone you like. If you'd like me to do the work, the video ends with a fixed price and timeline — and that's the only mention of it.",
  },
]

export default function AuditPage() {
  return (
    <DesignShell>
      <section className="border-b border-border bg-background">
        <div className={`${HOME_CONTAINER} py-12 md:pb-14 md:pt-16`}>
          <div className={`${HOME_KICKER} mb-4 text-[11px] text-primary`}>
            Free website audit
          </div>
          <h1 className="m-0 mb-3.5 max-w-[640px] text-balance text-4xl font-extrabold tracking-[-0.033em] md:text-[42px]">
            Find out what your website is costing you.
          </h1>
          <p className="m-0 max-w-[560px] text-pretty text-base leading-relaxed text-muted-foreground">
            A personal 15-minute video review of your website: what&apos;s slow, what&apos;s
            losing you enquiries, and exactly what to fix first. It&apos;s the same review I
            run before every site I build — free, with no meeting and no obligation.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="#request" className={`${HOME_BTN_PRIMARY} px-6 py-3 text-sm`}>
              Request your free audit
            </Link>
            <Link href="/work" className={`${HOME_BTN_OUTLINE} px-6 py-3 text-sm`}>
              See my work
            </Link>
          </div>
          <p className="m-0 mt-6 max-w-[560px] text-[12.5px] text-muted-foreground">
            Below: this site&apos;s live Google Lighthouse scores — the same test I&apos;ll run
            on yours.
          </p>
        </div>
      </section>

      <div className="border-b border-border bg-border">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 gap-px md:grid-cols-4">
            <ScoreCells value={100} />
          </div>
        </div>
      </div>

      <div className={`${HOME_CONTAINER} pb-4 pt-12 md:pt-14`}>
        <SectionHeading index="01" title="What's in your audit" />
        <div className="grid gap-4 md:grid-cols-3">
          {AUDIT_CONTENTS.map((item) => (
            <div key={item.title} className={`${HOME_CARD} p-7`}>
              <div className="mb-2 text-[15px] font-bold">{item.title}</div>
              <p className="m-0 text-[13.5px] leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className={`${HOME_CONTAINER} pb-4 pt-12`}>
        <SectionHeading index="02" title="How it works" />
        <div className="grid gap-4 md:grid-cols-3">
          {HOW_IT_WORKS.map((item) => (
            <div key={item.step} className={`${HOME_CARD} p-7`}>
              <div className={`${HOME_KICKER} mb-3 text-xs text-primary`}>{item.step}</div>
              <div className="mb-2 text-[15px] font-bold">{item.title}</div>
              <p className="m-0 text-[13.5px] leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className={`${HOME_CONTAINER} pb-16 pt-12 md:pb-[72px]`}>
        <SectionHeading index="03" title="Request your audit" />
        <div className="grid items-start gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div id="request" className={`${HOME_CARD} scroll-mt-24 p-8 md:p-10`}>
            <div className="mb-1.5 text-lg font-bold">Free audit request</div>
            <div className="mb-6 text-[13px] text-muted-foreground">
              Your video arrives by email within two business days.
            </div>
            <AuditRequestForm />
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-primary/20 bg-primary/10 p-7">
              <div className={`${HOME_KICKER} mb-3 text-[11px] text-primary`}>Why is it free?</div>
              <p className="m-0 text-sm font-medium leading-relaxed text-foreground">
                It&apos;s how I meet new clients. Some people take the fix list and sort it
                themselves — that&apos;s fine. Enough people ask me to do the work that the
                time pays for itself. There&apos;s no mailing list and no follow-up sequence.
              </p>
            </div>

            <div className={`${HOME_CARD} p-7`}>
              <div className={`${HOME_KICKER} mb-4 text-[11px] text-muted-foreground`}>
                Good to know
              </div>
              <ul className="m-0 flex list-none flex-col gap-3 p-0 text-[13.5px] leading-relaxed text-muted-foreground">
                <li>
                  <span className="font-semibold text-foreground">A real person reviews it.</span>{" "}
                  Every video is recorded by Ian, not generated by a tool.
                </li>
                <li>
                  <span className="font-semibold text-foreground">One audit per business.</span>{" "}
                  It takes real time to do properly, so I record a handful each week.
                </li>
                <li>
                  <span className="font-semibold text-foreground">Nothing is installed or changed.</span>{" "}
                  I only look at what any visitor can see.
                </li>
              </ul>
            </div>

            <div className={`${HOME_CARD} p-7`}>
              <div className={`${HOME_KICKER} mb-3 text-[11px] text-muted-foreground`}>
                Prefer to talk it through?
              </div>
              <a
                href={WHATSAPP_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] font-semibold text-primary transition-colors hover:text-[var(--vd-primary-hover)]"
              >
                Message Ian on WhatsApp →
              </a>
            </div>
          </div>
        </div>
      </div>
    </DesignShell>
  )
}
