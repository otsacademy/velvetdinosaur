import type { ReactNode } from "react"

import { cn } from "@/lib/utils"
import {
  HOME_CONTAINER,
  LETTER_ASIDE,
  LETTER_COLUMN,
  LETTER_H3,
  LETTER_HAND,
  PlusMark,
  SectionIntro,
} from "./home-shared"

type Step = {
  id: string
  chip: string
  title: string
  body: string
  note: string
  /** A handwritten note in the margin, shown on wide screens only. */
  margin?: { side: "left" | "right"; text: string }
}

// **bold** runs are rendered by Emphasise below.
const STEPS: Step[] = [
  {
    id: "preview",
    chip: "14 days · free",
    title: "You review your preview",
    body: "I build a working version of your new website before you pay anything. You get private access for 14 days to explore the design, test it on your phone, try the forms and use the editor yourself.",
    note: "If you don’t want to continue, the preview is deleted and you pay nothing.",
    margin: { side: "right", text: "No card details. No obligation." },
  },
  {
    id: "refine",
    chip: "Up to 7 days",
    title: "We refine it for launch",
    body: "If you love the preview, you subscribe and we begin a seven-day refinement period. It includes up to **five substantial design or content revisions** and **ten smaller adjustments**, based on your feedback.",
    note: "I also prepare your domain, email, forms, security and backups.",
  },
  {
    id: "launch",
    chip: "Launch day",
    title: "You approve and go live",
    body: "Once you approve the finished website, I complete the final checks and launch it on your domain. Your forms, email, mobile layout, SSL certificate and essential integrations are all tested first.",
    note: "Your first 30 days are protected by a money-back guarantee.",
    margin: { side: "left", text: "Ready to launch within seven days." },
  },
  {
    id: "supported",
    chip: "Ongoing",
    title: "I look after it",
    body: "Your subscription includes hosting, SSL, daily backups, security monitoring, software updates and access to your editor. Report a problem or request a content change in your support area, and follow it through to completion.",
    note: "And if something important goes wrong, you contact me directly. No support queue, no chatbot.",
  },
]

// The allowance is defined publicly so "a big change" can't be read as
// "an entire booking system".
const SMALL_PRINT: Array<{ term?: string; detail: string }> = [
  {
    term: "Substantial revision:",
    detail: "changing the design, structure or content of an existing section.",
  },
  {
    term: "Minor adjustment:",
    detail: "changing text, images, colours, spacing, buttons or other small details.",
  },
  {
    detail:
      "New functionality, integrations, additional page types or a fundamental change of direction fall outside the allowance and are agreed with you separately.",
  },
  {
    term: "Launch timing:",
    detail:
      "ready to launch within seven days, provided I receive the necessary feedback, content and domain access.",
  },
]

function Emphasise({ text }: { text: string }) {
  return (
    <>
      {text.split("**").map((part, index) =>
        index % 2 === 1 ? (
          <strong key={index} className="font-semibold text-foreground">
            {part}
          </strong>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  )
}

// Hand-drawn arrows for the margin notes; decorative, so hidden from readers.
function MarginNote({ side, children }: { side: "left" | "right"; children: ReactNode }) {
  const arrow =
    side === "right" ? (
      <svg viewBox="0 0 70 40" width="62" height="36" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M66 6C48 2 22 8 6 30" />
        <path d="M6 30l2-12" />
        <path d="M6 30l12-3" />
      </svg>
    ) : (
      <svg viewBox="0 0 70 40" width="62" height="36" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ms-auto mt-0.5">
        <path d="M4 6c18-4 44 2 60 24" />
        <path d="M64 30l-2-12" />
        <path d="M64 30l-12-3" />
      </svg>
    )

  return (
    <div
      aria-hidden
      className={cn(
        "absolute hidden text-accent min-[1260px]:block",
        side === "right"
          ? "left-[calc(100%+30px)] top-0.5 w-[200px] -rotate-[4deg]"
          : "right-[calc(100%+30px)] top-1.5 w-[190px] rotate-3 text-right",
      )}
    >
      {side === "right" ? arrow : null}
      <p
        className={cn(
          LETTER_HAND,
          "m-0 text-[27px] leading-[1.05]",
          side === "right" ? "ms-[26px] mt-0.5" : "me-[22px]",
        )}
      >
        {children}
      </p>
      {side === "left" ? arrow : null}
    </div>
  )
}

export function HomeJourney() {
  return (
    <section
      id="how-it-works"
      className={`${HOME_CONTAINER} scroll-mt-20 pt-20 sm:pt-[104px]`}
    >
      <SectionIntro kicker="Part one · How it works" title="From free preview to fully supported.">
        See your website before paying. Refine it with me, approve the finished version, and
        leave the technical work to Velvet Dinosaur. Every step below is included in the £99 a
        month.
      </SectionIntro>

      <ol className={`${LETTER_COLUMN} m-0 mt-12 flex list-none flex-col p-0 sm:mt-14`}>
        {STEPS.map((step, index) => (
          <li
            key={step.id}
            data-reveal
            className="relative grid grid-cols-[48px_minmax(0,1fr)] gap-x-5 pb-[46px] last:pb-0 sm:grid-cols-[64px_minmax(0,1fr)] sm:gap-x-[26px]"
          >
            <div className="flex flex-col items-center">
              <span className="flex size-12 flex-none items-center justify-center rounded-full bg-primary font-serif text-2xl font-medium text-primary-foreground sm:size-16 sm:text-[28px]">
                {index + 1}
              </span>
              {index < STEPS.length - 1 ? (
                <span aria-hidden className="mt-2.5 w-0.5 flex-1 bg-border" />
              ) : null}
            </div>
            <div className="pt-1">
              <p className="m-0 mb-2 inline-flex rounded-full bg-[color-mix(in_srgb,var(--vd-highlight)_34%,var(--card))] px-3 py-[3px] text-sm font-bold tracking-[0.02em] text-foreground">
                {step.chip}
              </p>
              <h3 className={LETTER_H3}>{step.title}</h3>
              <p className="m-0 mt-2.5 text-muted-foreground">
                <Emphasise text={step.body} />
              </p>
              <p className={`${LETTER_ASIDE} m-0 mt-2.5`}>{step.note}</p>
            </div>
            {step.margin ? (
              <MarginNote side={step.margin.side}>{step.margin.text}</MarginNote>
            ) : null}
          </li>
        ))}
      </ol>

      <details className={`${LETTER_COLUMN} group mt-11 rounded-md border border-border bg-card`}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-[18px] px-[22px] py-[18px] text-lg font-semibold [&::-webkit-details-marker]:hidden">
          <span>The small print: what counts as a change, and launch timing</span>
          <PlusMark size={32} />
        </summary>
        <div className="flex flex-col gap-2 px-[22px] pb-[22px] text-[17px] text-muted-foreground">
          {SMALL_PRINT.map((rule) => (
            <p key={rule.detail} className="m-0">
              {rule.term ? (
                <strong className="font-semibold text-foreground">{rule.term} </strong>
              ) : null}
              {rule.detail}
            </p>
          ))}
        </div>
      </details>
    </section>
  )
}
