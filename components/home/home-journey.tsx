import Link from "next/link"

import { Progress } from "@/components/ui/progress"
import {
  HOME_BTN_PRIMARY,
  HOME_CARD,
  HOME_CONTAINER,
  HOME_KICKER,
  SectionHeading,
} from "./home-shared"

type Stage = {
  id: string
  chip: string
  title: string
  body: string
  note: string
  meta: string
  progress: number
}

// **bold** runs are rendered by Emphasise below.
const STAGES: Stage[] = [
  {
    id: "preview",
    chip: "Preview",
    title: "Review your bespoke preview",
    body: "We build a working version of your new website before you pay anything. You receive private access for 14 days, allowing you to explore the design, test it on your phone, try the forms and experience the CMS for yourself.",
    note: "If you do not want to continue, the preview is deleted and you pay nothing.",
    meta: "14 days · free",
    progress: 25,
  },
  {
    id: "refine",
    chip: "Refine",
    title: "Refine it for launch",
    body: "If you love the preview, subscribe and we begin a seven-day refinement period. This includes up to **five substantial design or content revisions** and **ten smaller adjustments**, based on your feedback.",
    note: "We also prepare your domain, email, forms, security, backups and other launch settings.",
    meta: "Up to 7 days",
    progress: 50,
  },
  {
    id: "launch",
    chip: "Launch",
    title: "Approve and go live",
    body: "Once you approve the finished website, we complete the final checks and launch it on your domain. Your forms, email, mobile layout, SSL certificate and essential integrations are tested before launch.",
    note: "Your first 30 days remain protected by our money-back guarantee.",
    meta: "Launch day",
    progress: 75,
  },
  {
    id: "supported",
    chip: "Support",
    title: "Supported for the future",
    body: "Your subscription includes hosting, SSL, daily backups, security monitoring, software updates and access to your CMS.",
    note: "You can also use your customer support area to report technical problems, request reasonable content changes and follow their progress from submission to completion.",
    meta: "Ongoing",
    progress: 100,
  },
]

// The allowance is defined publicly so "a big change" can't be read as
// "an entire booking system".
const CHANGE_RULES = [
  {
    term: "Substantial revision",
    detail: "changing the design, structure or content of an existing section.",
  },
  {
    term: "Minor adjustment",
    detail: "changing text, images, colours, spacing, buttons or other small details.",
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

/** Timeline rail: vertical on small screens, horizontal from lg. */
function Rail({ tone }: { tone: "base" | "filled" }) {
  const colour = tone === "filled" ? "bg-primary" : "bg-border"
  return (
    <div className="grid h-full w-4 justify-center gap-10 lg:h-4 lg:w-auto lg:grid-cols-4 lg:items-center">
      <div
        className={`absolute inset-0 left-1/2 w-px -translate-x-1/2 ${colour} lg:inset-auto lg:left-auto lg:h-px lg:w-full lg:translate-x-0`}
      />
      {STAGES.map((stage) => (
        <span
          key={stage.id}
          className={`relative top-3 size-2 rounded-full ${colour} lg:top-0`}
        />
      ))}
    </div>
  )
}

export function HomeJourney() {
  return (
    <section id="how-it-works" className="scroll-mt-24">
      <div className={`${HOME_CONTAINER} pt-16 md:pt-[72px]`}>
        <SectionHeading
          index="04"
          title="From free preview to fully supported"
          aside={
            <span className="text-[13px] text-muted-foreground">
              What happens, and when.
            </span>
          }
        />
        <p className="m-0 mb-7 max-w-[720px] text-pretty text-[15px] leading-relaxed text-muted-foreground">
          See your website before paying. Refine it with us, approve the finished version and
          leave the technical work to Velvet Dinosaur.
        </p>

        <div className={`${HOME_CARD} flex flex-col gap-6 p-5 sm:p-8 lg:p-11`}>
          <div className="contents items-center justify-between sm:flex">
            <h3 className="m-0 text-[19px] font-bold tracking-[-0.01em]">
              Every step is included in the £99 a month
            </h3>
            <Link
              href="/contact"
              className={`${HOME_BTN_PRIMARY} order-last whitespace-nowrap px-6 py-3 text-[13px]`}
            >
              Request your free preview
            </Link>
          </div>

          <div className="mt-3 flex gap-4 lg:flex-col">
            <div className="relative">
              <Rail tone="base" />
              <div className="vd-timeline-reveal absolute inset-0">
                <Rail tone="filled" />
              </div>
            </div>

            <div className="grid gap-10 lg:grid-cols-4">
              {STAGES.map((stage, index) => (
                <div key={stage.id} className="flex h-full flex-col justify-between gap-4">
                  <div className="flex flex-col">
                    <div className="flex h-8 w-fit items-center gap-px overflow-hidden rounded-md border border-border bg-border text-[13px] font-medium">
                      <span className={`${HOME_KICKER} grid h-full place-items-center bg-background px-2 text-[11px]`}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="grid h-full place-items-center bg-background px-2">
                        {stage.chip}
                      </span>
                    </div>
                    <h4 className="m-0 mt-5 text-[15px] font-bold">{stage.title}</h4>
                    <p className="m-0 mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                      <Emphasise text={stage.body} />
                    </p>
                    <p className="m-0 mt-2.5 text-[13.5px] leading-relaxed text-muted-foreground">
                      <Emphasise text={stage.note} />
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={stage.progress}
                        aria-label={`${stage.title}: ${stage.progress}% through the journey`}
                        className="h-1 flex-1"
                      />
                      <span className="w-9 text-right text-[11px] text-muted-foreground">
                        {stage.progress}%
                      </span>
                    </div>
                    <p className="m-0 mt-1 text-[11px] text-muted-foreground">{stage.meta}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className={`${HOME_CARD} p-7`}>
            <div className={`${HOME_KICKER} mb-3 text-[11px] text-muted-foreground`}>
              What counts as a change
            </div>
            <dl className="m-0 flex flex-col gap-2.5 text-[13.5px] leading-relaxed">
              {CHANGE_RULES.map((rule) => (
                <div key={rule.term}>
                  <dt className="inline font-semibold text-foreground">{rule.term}:</dt>{" "}
                  <dd className="m-0 inline text-muted-foreground">{rule.detail}</dd>
                </div>
              ))}
            </dl>
            <p className="m-0 mt-3.5 text-[13px] leading-relaxed text-muted-foreground">
              New functionality, integrations, additional page types or a fundamental change of
              direction fall outside the allowance and are agreed with you separately.
            </p>
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/10 p-7">
            <div className={`${HOME_KICKER} mb-2.5 text-[11px] text-primary`}>Launch timing</div>
            <p className="m-0 text-sm font-medium leading-relaxed text-foreground">
              Ready to launch within seven days, provided we receive the necessary feedback,
              content and domain access.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
