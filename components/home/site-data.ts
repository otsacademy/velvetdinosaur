// Facts shared across the public pages: the portfolio and the Google reviews.
// Kept free of React so both server and client components can import it.

export const WORK_CATEGORIES = ["All", "Charity", "Travel", "Product", "Community"] as const

export type WorkCategory = (typeof WORK_CATEGORIES)[number]

export type WorkProject = {
  key: string
  cat: Exclude<WorkCategory, "All">
  tag: string
  title: string
  blurb: string
  meta: string
  /** A live snapshot from /public/portfolio, or a line from the client's review. */
  banner:
    | { kind: "image"; src: string; alt: string }
    | { kind: "quote"; quote: string; tone: "navy" | "paper" }
  caseStudyHref?: string
}

// Real portfolio only. The first four are full case studies with live
// snapshots in /public/portfolio (refresh via scripts/snapshot-portfolio-sites.ts
// + bun run portfolio:images) and articles at /work/[slug]; the remaining two
// are real engagements evidenced by the Google reviews below.
export const WORK_PROJECTS: WorkProject[] = [
  {
    key: "asap",
    cat: "Charity",
    tag: "Charity",
    title: "Academics Stand Against Poverty",
    blurb:
      "A global academic network fighting poverty. A full rebuild after three years without core updates, with structured content the team publishes and manages themselves.",
    meta: "Full rebuild · CMS · SEO",
    banner: {
      kind: "image",
      src: "/portfolio/asap-1440w.webp",
      alt: "The Academics Stand Against Poverty homepage",
    },
    caseStudyHref: "/work/academics-stand-against-poverty",
  },
  {
    key: "the-brave",
    cat: "Travel",
    tag: "Travel",
    title: "The Brave",
    blurb:
      "A values-led ethical travel platform with integrated advocacy and media storytelling. Stronger brand differentiation and clearer pathways for visitors.",
    meta: "Design + build · strategy",
    banner: { kind: "image", src: "/portfolio/the-brave-1440w.webp", alt: "The Brave homepage" },
    caseStudyHref: "/work/the-brave",
  },
  {
    key: "rising-dust",
    cat: "Travel",
    tag: "Adventure travel",
    title: "Rising Dust Adventures",
    blurb:
      "Premium motorcycle expeditions. Route clarity, trust-building and higher-quality visual storytelling that converts.",
    meta: "Design + build · travel",
    banner: {
      kind: "image",
      src: "/portfolio/rising-dust-1440w.webp",
      alt: "The Rising Dust Adventures homepage",
    },
    caseStudyHref: "/work/rising-dust-adventures",
  },
  {
    key: "scholardemia",
    cat: "Product",
    tag: "Product",
    title: "Scholardemia",
    blurb:
      "An academic networking and publishing product with secure sign-in and scalable architecture, across community, collaboration and publishing.",
    meta: "Product build · platform",
    banner: {
      kind: "image",
      src: "/portfolio/scholardemia-1440w.webp",
      alt: "The Scholardemia sign-in page",
    },
    caseStudyHref: "/work/scholardemia",
  },
  {
    key: "froxfield",
    cat: "Community",
    tag: "Parish council",
    title: "Froxfield Parish Council",
    blurb: "From a single homepage to a modern, structured site that residents can rely on.",
    meta: "Rebuild · structured content",
    banner: {
      kind: "quote",
      quote:
        "A trusted source of information that reflects the council’s commitment to openness.",
      tone: "navy",
    },
  },
  {
    key: "journal-asap",
    cat: "Charity",
    tag: "Publishing",
    title: "Journal ASAP rescue",
    blurb:
      "A serious website problem that others said needed a full rebuild, solved in a few hours.",
    meta: "Fix + stabilise · same week",
    banner: { kind: "quote", quote: "Mission impossible handled.", tone: "paper" },
  },
]

/** The four case studies shown on the home page. */
export const FEATURED_WORK = WORK_PROJECTS.filter((project) => project.caseStudyHref)

export type GoogleReview = {
  name: string
  /** Role or organisation, where the reviewer gave one. */
  role: string
  quote: string
  sourceUrl: string
}

// Quoted from the Google Business Profile; each links to the original review.
export const GOOGLE_REVIEWS: GoogleReview[] = [
  {
    name: "Faye Taylor",
    role: "Founder, The Brave",
    quote:
      "Phenomenal service and end result from a phenomenal chap. Ian went far beyond expectations and built a site that is user-friendly, strategic, and genuinely tailored to our audience.",
    sourceUrl: "https://maps.app.goo.gl/vxcNWmsFxNUV9zvMA",
  },
  {
    name: "Lynn Casey",
    role: "Froxfield Parish Council",
    quote:
      "With the involvement of Velvet Dinosaur (Ian) we are now able to present a modern website with structured content and a clear purpose, not just a homepage. The result is a trusted source of information that reflects the council’s commitment to openness and service.",
    sourceUrl: "https://maps.app.goo.gl/BY3mKgFkLysYTG7VA",
  },
  {
    name: "Vikram Katoch",
    role: "",
    quote:
      "I had a wonderful experience working with Ian Wickens from Velvet Dinosaur. He was swift, responsive, highly professional, and delivered excellent results with great attention to detail for my ITB Berlin presentation website.",
    sourceUrl: "https://maps.app.goo.gl/Bnr7Q8WgRWqUfDraA",
  },
  {
    name: "Michal Apollo",
    role: "Co-Editor, Journal ASAP",
    quote:
      "We had a serious website problem and no one could fix it without a full rebuild. Ian from Velvet Dinosaur solved it in a few hours. Mission impossible handled.",
    sourceUrl: "https://maps.app.goo.gl/EHiApj1drvvdPTsR8",
  },
]

/** The review given pride of place on the home page; the rest sit beneath it. */
export const [FEATURED_REVIEW, ...SUPPORTING_REVIEWS] = GOOGLE_REVIEWS
