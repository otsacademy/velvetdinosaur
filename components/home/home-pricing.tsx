import { HOME_CARD, HOME_CONTAINER, HOME_MONO, SectionHeading } from "./home-shared"

const INCLUDED = [
  "Custom design & build",
  "SEO-ready page structure",
  "Sauro CMS included",
  "Performance optimisation",
  "SSL, backups & DNS setup",
  "Launch support & handover",
] as const

export function HomePricing() {
  return (
    <section id="pricing" className="scroll-mt-24">
      <div className={`${HOME_CONTAINER} pt-16 md:pt-[72px]`}>
        <SectionHeading index="03" title="One honest price" />
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className={`${HOME_CARD} p-8 md:p-10`}>
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <div className="text-lg font-bold">All-inclusive launch package</div>
              <span
                className={`${HOME_MONO} rounded-[3px] bg-primary/10 px-2 py-1 text-[10px] text-primary`}
              >
                Most popular
              </span>
            </div>
            <div className="mb-[18px] mt-3.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-4xl font-extrabold tracking-[-0.03em] md:text-[52px]">
                from £3,500
              </span>
              <span className="text-[13px] text-muted-foreground">
                fixed before we start · most professional websites
              </span>
            </div>
            <p className="mb-6 mt-0 text-pretty text-sm leading-relaxed text-muted-foreground">
              Custom design and build, SEO-ready structure, performance optimisation, contact
              forms, Sauro CMS, SSL, daily backups, and launch support. Scope agreed and price
              fixed before development starts — advanced features quoted separately, up front. A
              reduced rate is available for charities and academic projects.
            </p>
            <ul className="m-0 grid list-none gap-2.5 p-0 sm:grid-cols-2">
              {INCLUDED.map((item) => (
                <li key={item} className="flex items-baseline gap-2.5 text-[13px] text-foreground">
                  <span
                    aria-hidden
                    className="inline-flex h-[17px] w-[17px] flex-none translate-y-0.5 items-center justify-center rounded-full bg-primary/10 text-[10.5px] font-bold text-primary"
                  >
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-4">
            <div className={`${HOME_CARD} p-7`}>
              <div className={`${HOME_MONO} mb-2.5 text-[10px] text-muted-foreground`}>
                What agencies charge
              </div>
              <div className="text-[26px] font-extrabold tracking-tight">£10k–£15k</div>
              <div className="mt-1.5 text-[12.5px] text-muted-foreground">
                Typical agency quote for a comparable founder-led build.
              </div>
            </div>
            <div className={`${HOME_CARD} p-7`}>
              <div className={`${HOME_MONO} mb-2.5 text-[10px] text-muted-foreground`}>
                After the first year
              </div>
              <div className="text-[26px] font-extrabold tracking-tight">£250/year</div>
              <div className="mt-1.5 text-[12.5px] text-muted-foreground">
                Performance and security maintenance — or run it independently. No lock-in.
              </div>
            </div>
            <div className="rounded-lg border border-primary/20 bg-primary/10 p-7">
              <div className={`${HOME_MONO} mb-2.5 text-[10px] text-primary`}>It’s yours</div>
              <div className="text-sm font-medium leading-relaxed text-foreground">
                Your domain, your content, your site. Everything set up in your name — move it
                whenever you choose.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
