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
                everything included · no setup fee · 12-month minimum, then monthly
              </span>
            </div>
            <p className="mb-6 mt-0 text-pretty text-sm leading-relaxed text-muted-foreground">
              We build your new website first and send you a private sign-up link — you set
              your own password and can try editing everything yourself. Take fourteen days.
              If you don&rsquo;t love it, we shake hands and walk away; the preview is simply
              deleted and costs nothing. If you do, one flat monthly price covers absolutely
              everything, under a plain-English agreement you read before you sign.
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
                You own your content and your domain. After the first year you can leave any
                time — and if you ever move on, we&rsquo;ll actively help you pack up and
                migrate. Clients stay because they want to.
              </div>
            </div>
            <div className={`${HOME_CARD} p-7`}>
              <div className={`${HOME_KICKER} mb-2.5 text-[11px] text-muted-foreground`}>
                What this replaces
              </div>
              <div className="text-[26px] font-extrabold tracking-tight">£3,500+ up front</div>
              <div className="mt-1.5 text-[12.5px] text-muted-foreground">
                A typical agency build, before hosting and maintenance. Agencies quote
                £10k–£15k for comparable work.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
