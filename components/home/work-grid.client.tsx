"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

import { cn } from "@/lib/utils"
import { HOME_CARD, HOME_MONO } from "./home-shared"

const CATEGORIES = ["All", "Charity", "Travel", "Product", "Community"] as const

type Category = (typeof CATEGORIES)[number]

type Banner =
  | { kind: "image"; src: string; alt: string }
  | { kind: "gradient"; gradient: string; mark: string }

type Project = {
  cat: Exclude<Category, "All">
  tag: string
  title: string
  blurb: string
  meta: string
  live: boolean
  banner: Banner
  caseStudyHref?: string
}

// Real portfolio. The first four are full case studies carried over from the
// previous site (screenshots in /public/portfolio, articles at /work/[slug]);
// the rest are real engagements evidenced by the Google reviews on /about.
const PROJECTS: Project[] = [
  {
    cat: "Charity",
    tag: "Charity",
    title: "Academics Stand Against Poverty",
    blurb:
      "A global academic network fighting poverty — full rebuild after three years without core updates. Structured content the team publishes and manages themselves.",
    meta: "Full rebuild · CMS · SEO",
    live: true,
    banner: { kind: "image", src: "/portfolio/asap-864w.webp", alt: "academicsstand.org homepage" },
    caseStudyHref: "/work/academics-stand-against-poverty",
  },
  {
    cat: "Travel",
    tag: "Travel",
    title: "The Brave",
    blurb:
      "Values-led ethical travel platform with integrated advocacy and media storytelling — stronger brand differentiation and clearer user pathways.",
    meta: "Design + build · strategy",
    live: true,
    banner: { kind: "image", src: "/portfolio/the-brave-864w.webp", alt: "thebrave.online homepage" },
    caseStudyHref: "/work/the-brave",
  },
  {
    cat: "Travel",
    tag: "Adventure travel",
    title: "Rising Dust Adventures",
    blurb:
      "Premium motorcycle expedition experiences — route clarity, trust-building, and higher-quality visual storytelling that converts.",
    meta: "Design + build · travel",
    live: true,
    banner: {
      kind: "image",
      src: "/portfolio/rising-dust-864w.webp",
      alt: "risingdustadventures.com homepage",
    },
    caseStudyHref: "/work/rising-dust-adventures",
  },
  {
    cat: "Product",
    tag: "Product",
    title: "Scholardemia",
    blurb:
      "Academic networking and publishing product with secure auth and scalable architecture — one product direction across community, collaboration, and publishing.",
    meta: "Product build · platform",
    live: true,
    banner: {
      kind: "image",
      src: "/portfolio/scholardemia-864w.webp",
      alt: "scholardemia.com homepage",
    },
    caseStudyHref: "/work/scholardemia",
  },
  {
    cat: "Community",
    tag: "Parish council",
    title: "Froxfield Parish Council",
    blurb:
      "From a single homepage to a modern, structured site — a trusted source of information reflecting the council’s commitment to openness.",
    meta: "Rebuild · structured content",
    live: true,
    banner: { kind: "gradient", gradient: "linear-gradient(135deg,#166534,#22a55a)", mark: "FPC" },
  },
  {
    cat: "Charity",
    tag: "Publishing",
    title: "Journal ASAP rescue",
    blurb:
      "“Mission impossible handled” — a serious website problem others said needed a full rebuild, solved in a few hours.",
    meta: "Fix + stabilise · same week",
    live: true,
    banner: { kind: "gradient", gradient: "linear-gradient(135deg,#9a3412,#ea7c3c)", mark: "JASAP" },
  },
  {
    cat: "Travel",
    tag: "Conference",
    title: "ITB Berlin presentation site",
    blurb:
      "A conference presentation website delivered at speed — swift, responsive, and detail-focused for an international travel audience.",
    meta: "Conference site · rapid delivery",
    live: false,
    banner: { kind: "gradient", gradient: "linear-gradient(135deg,#0e7490,#22b8cf)", mark: "ITB" },
  },
  {
    cat: "Product",
    tag: "Product",
    title: "Sauro CMS",
    blurb:
      "The calm, private content manager included with every build — pages, news, media, and reviews managed in minutes without a developer.",
    meta: "Product · included in every build",
    live: true,
    banner: { kind: "gradient", gradient: "linear-gradient(135deg,#005eb8,#4a8be8)", mark: "SAURO" },
  },
]

function ProjectBanner({ banner, tag }: { banner: Banner; tag: string }) {
  return (
    <div
      className="relative flex h-[170px] items-end overflow-hidden px-6 py-5"
      style={banner.kind === "gradient" ? { background: banner.gradient } : undefined}
    >
      {banner.kind === "image" ? (
        <Image
          src={banner.src}
          alt={banner.alt}
          fill
          sizes="(min-width: 768px) 540px, 100vw"
          className="object-cover object-top"
        />
      ) : (
        <span className="text-[26px] font-extrabold tracking-[-0.02em] text-white [text-shadow:0_1px_8px_rgba(0,0,0,.18)]">
          {banner.mark}
        </span>
      )}
      <span
        className={`${HOME_MONO} absolute left-3.5 top-3.5 rounded-[3px] bg-white/[.92] px-2 py-1 text-[10px] text-[#0f1c2e]`}
      >
        {tag}
      </span>
    </div>
  )
}

function ProjectCardBody({ project }: { project: Project }) {
  return (
    <div className="flex flex-1 flex-col gap-2.5 px-7 pb-7 pt-6">
      <div className="text-lg font-bold tracking-[-0.01em]">{project.title}</div>
      <div className="flex-1 text-[13.5px] leading-relaxed text-muted-foreground">
        {project.blurb}
      </div>
      <div className="flex flex-wrap items-center gap-3.5 pt-1.5">
        {project.live ? (
          <span
            className={`${HOME_MONO} rounded-[3px] bg-[color-mix(in_srgb,var(--vd-score-perfect)_14%,var(--vd-bg))] px-2 py-1 text-[10px] text-[color-mix(in_srgb,var(--vd-score-perfect)_60%,var(--vd-fg))]`}
          >
            ● Live
          </span>
        ) : null}
        <span className={`${HOME_MONO} text-[10px] text-muted-foreground`}>{project.meta}</span>
        {project.caseStudyHref ? (
          <span className="ms-auto text-[12.5px] font-semibold text-primary">
            Read case study →
          </span>
        ) : null}
      </div>
    </div>
  )
}

export function WorkGrid() {
  const [filter, setFilter] = useState<Category>("All")
  const projects = PROJECTS.filter((p) => filter === "All" || p.cat === filter)

  const cardClasses = `${HOME_CARD} flex flex-col overflow-hidden transition-[transform,box-shadow,border-color] duration-300 ease-[var(--vd-hover-ease)] hover:-translate-y-1 hover:border-primary hover:shadow-[var(--vd-shadow-primary)]`

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setFilter(category)}
            aria-pressed={filter === category}
            className={cn(
              "cursor-pointer rounded-full border px-4.5 py-2 text-[13px] font-semibold transition-colors",
              filter === category
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-background text-muted-foreground hover:border-primary hover:text-primary",
            )}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-2">
        {projects.map((project) =>
          project.caseStudyHref ? (
            <Link
              key={project.title}
              href={project.caseStudyHref}
              className={`${cardClasses} text-foreground hover:text-foreground`}
            >
              <ProjectBanner banner={project.banner} tag={project.tag} />
              <ProjectCardBody project={project} />
            </Link>
          ) : (
            <div key={project.title} className={cardClasses}>
              <ProjectBanner banner={project.banner} tag={project.tag} />
              <ProjectCardBody project={project} />
            </div>
          ),
        )}
      </div>
    </>
  )
}
