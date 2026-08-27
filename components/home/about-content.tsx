import { FounderAvatar } from "./founder-avatar"
import { HOME_CARD, HOME_CONTAINER, HOME_KICKER, SectionHeading } from "./home-shared"

const BIO_PARAGRAPHS = [
  "I spent most of my professional life working in the NHS. My time handling clinical research and governance taught me how to tackle complex problems with real care.",
  "Alongside my NHS career I spent years building websites independently. I built charity platforms and followed self directed design projects wherever they led. Velvet Dinosaur naturally grew from that experience.",
  "When we partner together you deal exclusively with me. We skip the confusing jargon and the usual agency runaround. You just get a beautifully built website managed month to month. Best of all your content and your domain remain entirely yours.",
] as const

const HOW_I_WORK = [
  {
    kicker: "Background",
    title: "NHS-grade rigour",
    body: "Years across medical equipment, clinical research, and governance — complex problems handled with structure and care.",
  },
  {
    kicker: "Builds",
    title: "Built for you first",
    body: "Your new website is designed and built before you pay anything — try it free for 14 days, then decide.",
  },
  {
    kicker: "Approach",
    title: "Direct and transparent",
    body: "One person, first call to launch and beyond. One flat monthly price, and your content and domain always yours.",
  },
] as const

export const GOOGLE_REVIEWS = [
  {
    name: "Lynn Casey",
    company: "Froxfield Parish Council",
    date: "Recent",
    quote:
      "With the involvement of Velvet Dinosaur (Ian) we are now able to present a modern website with structured content and a clear purpose, not just a homepage. The result is a trusted source of information that reflects the council’s commitment to openness and service.",
    sourceUrl: "https://maps.app.goo.gl/BY3mKgFkLysYTG7VA",
  },
  {
    name: "Vikram Katoch",
    company: "",
    date: "Recent",
    quote:
      "I had a wonderful experience working with Ian Wickens from Velvet Dinosaur. He was swift, responsive, highly professional, and delivered excellent results with great attention to detail for my ITB Berlin presentation website.",
    sourceUrl: "https://maps.app.goo.gl/Bnr7Q8WgRWqUfDraA",
  },
  {
    name: "Faye Taylor",
    company: "Founder, The Brave",
    date: "1 month ago",
    quote:
      "Phenomenal service and end result from a phenomenal chap. Ian went far beyond expectations and built a site that is user-friendly, strategic, and genuinely tailored to our audience.",
    sourceUrl: "https://maps.app.goo.gl/vxcNWmsFxNUV9zvMA",
  },
  {
    name: "Michal Apollo",
    company: "Co-Editor, Journal ASAP",
    date: "1 month ago",
    quote:
      "We had a serious website problem and no one could fix it without a full rebuild. Ian from Velvet Dinosaur solved it in a few hours. Mission impossible handled.",
    sourceUrl: "https://maps.app.goo.gl/EHiApj1drvvdPTsR8",
  },
] as const

export function AboutHero() {
  return (
    <section className="border-b border-border bg-background">
      <div
        className={`${HOME_CONTAINER} grid items-start gap-10 py-12 md:pb-14 md:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(340px,380px)] lg:gap-14`}
      >
        <div>
          <div className={`${HOME_KICKER} mb-4 text-[11px] text-primary`}>About me</div>
          <h1 className="m-0 mb-5 text-balance text-4xl font-extrabold tracking-[-0.033em] md:text-[42px]">
            Websites made by a person, not a platform.
          </h1>
          <div className="flex max-w-[600px] flex-col gap-4 text-[15.5px] leading-[1.7] text-muted-foreground">
            <p className="m-0 text-foreground">
              Hello. I am Ian Wickens and I run Velvet Dinosaur from my home in Minster
              Lovell. I build managed websites for organisations looking for something
              carefully crafted. I actually build your site before you pay anything at all.
            </p>
            {BIO_PARAGRAPHS.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="m-0">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        <div className="mx-auto w-full max-w-[420px] lg:mx-0">
          <figure className="vd-profile-figure group relative isolate m-0 aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-foreground shadow-[0_24px_70px_-28px_color-mix(in_oklch,var(--vd-fg)_55%,transparent)] ring-1 ring-foreground/10">
            <FounderAvatar
              size={720}
              tone="light"
              shape="portrait"
              fillContainer
              sizes="(min-width: 1024px) 380px, (min-width: 640px) 420px, calc(100vw - 48px)"
              className="vd-profile-portrait absolute inset-0 rounded-none border-0 bg-transparent shadow-none"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 z-10 bg-gradient-to-t from-foreground/95 via-foreground/12 via-45% to-transparent"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 z-20 rounded-[inherit] ring-1 ring-inset ring-white/20"
            />
            <figcaption className="vd-profile-caption absolute inset-x-0 bottom-0 z-30 px-6 pb-6 pt-20 text-white sm:px-7 sm:pb-7">
              <div className="text-[1.35rem] font-bold leading-tight tracking-[-0.025em]">
                Ian Wickens
              </div>
              <div className="mt-1.5 text-[13px] font-medium leading-snug text-white/[0.78]">
                Founder · Minster Lovell, Oxfordshire
              </div>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  )
}

export function HowIWork() {
  return (
    <section className={`${HOME_CONTAINER} pt-14 md:pt-16`}>
      <SectionHeading index="01" title="How I work" />
      <div className="grid gap-4 md:grid-cols-3">
        {HOW_I_WORK.map((card) => (
          <div key={card.title} className={`${HOME_CARD} flex flex-col gap-3 p-7`}>
            <div className={`${HOME_KICKER} text-[11px] text-muted-foreground`}>{card.kicker}</div>
            <div className="text-base font-bold">{card.title}</div>
            <div className="text-[14px] leading-relaxed text-muted-foreground">{card.body}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function GoogleReviews() {
  return (
    <section className={`${HOME_CONTAINER} pb-16 pt-14 md:pb-[72px] md:pt-16`}>
      <SectionHeading
        index="02"
        title="Google reviews"
        aside={
          <span className={`${HOME_KICKER} text-[11px] text-muted-foreground`}>
            5.0 ★ · independent reviews
          </span>
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        {GOOGLE_REVIEWS.map((review) => (
          <div
            key={review.name}
            className={`${HOME_CARD} flex flex-col gap-3 p-7 transition-[transform,box-shadow,border-color] duration-300 ease-[var(--vd-hover-ease)] hover:-translate-y-[3px] hover:border-primary hover:shadow-[var(--vd-shadow-primary)]`}
          >
            <div className="flex items-baseline justify-between gap-2.5">
              <div>
                <div className="text-[14.5px] font-bold">{review.name}</div>
                {review.company ? (
                  <div className="mt-0.5 text-xs text-muted-foreground">{review.company}</div>
                ) : null}
              </div>
              <span className={`${HOME_KICKER} whitespace-nowrap text-[11px] text-muted-foreground`}>
                {review.date}
              </span>
            </div>
            <div aria-label="5 out of 5 stars" className="text-[13px] tracking-[2px] text-amber-500">
              ★★★★★
            </div>
            <div className="text-[14px] leading-[1.65] text-muted-foreground">{review.quote}</div>
            <a
              href={review.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto text-[12.5px] font-semibold text-primary transition-colors hover:text-[var(--vd-primary-hover)]"
            >
              View on Google Maps →
            </a>
          </div>
        ))}
      </div>
    </section>
  )
}
