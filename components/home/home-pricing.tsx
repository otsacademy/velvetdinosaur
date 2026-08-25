import Link from "next/link"

import { HOME_CARD, HOME_CONTAINER, HOME_KICKER, SectionHeading } from "./home-shared"

const INCLUDED = [
  "Custom design & build",
  "Hosting, SSL & daily backups",
  "Sauro CMS — edit it yourself",
  "Software updates & maintenance",
  "Email for your domain",
  "Small content changes done for you",
] as const

export function HomePricing() {
  return (
    <section id="pricing" className="scroll-mt-24">
      <div className={`${HOME_CONTAINER} pt-16 md:pt-[72px]`}>
        <SectionHeading index="04" title="One honest price" />
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className={`${HOME_CARD} p-8 md:p-10`}>
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <div className="text-lg font-bold">Your website, built before you pay</div>
              <span
                className={`${HOME_KICKER} rounded-[3px] bg-primary/10 px-2 py-1 text-[11px] text-primary`}
              >
                See it first — free
              </span>
            </div>
            <div className="mb-[18px] mt-3.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-4xl font-extrabold tracking-[-0.03em] md:text-[52px]">
                £99/month
              </span>
              <span className="text-[13px] text-muted-foreground">
                Everything included. No setup fee. 12 month minimum contract paid monthly.
              </span>
            </div>
            <p className="mb-6 mt-0 text-pretty text-sm leading-relaxed text-muted-foreground">
              I build your new website first and send you a private link. You set your own
              password and try editing everything yourself. You get fourteen days to test it
              out. We shake hands and walk away if you decide it is not a good fit. The preview
              simply gets deleted and costs you absolutely nothing. If you love it you pay one
              flat monthly price that covers everything. Everything is laid out in a plain
              English agreement for you to read before you sign.
            </p>
            <p className="mb-6 mt-[-8px] text-[13px]">
              <Link
                href="/agreement"
                className="font-semibold text-primary transition-colors hover:text-[var(--vd-primary-hover)]"
              >
                Read the full service agreement →
              </Link>
            </p>
            <ul className="m-0 grid list-none gap-2.5 p-0 sm:grid-cols-2">
              {INCLUDED.map((item) => (
                <li key={item} className="flex items-baseline gap-2.5 text-[13px] text-foreground">
                  <span
                    aria-hidden
                    className="inline-flex h-[17px] w-[17px] flex-none translate-y-0.5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary"
                  >
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-primary/20 bg-primary/10 p-7">
              <div className={`${HOME_KICKER} mb-2.5 text-[11px] text-primary`}>
                Our portability promise
              </div>
              <div className="text-sm font-medium leading-relaxed text-foreground">
                You retain full ownership of your domain and your content from day one. You
                are completely free to leave at any point after your first year. I will even
                help you pack up and move your site if you decide to go elsewhere. I want my
                clients to stay simply because they are happy with the service.
              </div>
            </div>
            <div className={`${HOME_CARD} p-7`}>
              <div className={`${HOME_KICKER} mb-2.5 text-[11px] text-muted-foreground`}>
                What this replaces
              </div>
              <div className="text-[26px] font-extrabold tracking-tight">£3,500+ up front</div>
              <div className="mt-1.5 text-[12.5px] text-muted-foreground">
                A typical agency build, before hosting and maintenance. Comparable bespoke
                builds can cost thousands up front.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
