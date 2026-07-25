"use client"

import { useState } from "react"

import { cn } from "@/lib/utils"
import { HOME_CARD, HOME_MONO } from "./home-shared"

const CATEGORIES = ["All", "Charity", "Product", "Travel", "Professional services"] as const

type Category = (typeof CATEGORIES)[number]

type Project = {
  cat: Exclude<Category, "All">
  tag: string
  mark: string
  title: string
  blurb: string
  meta: string
  live: boolean
  gradient: string
}

const PROJECTS: Project[] = [
  {
    cat: "Charity",
    tag: "Charity",
    mark: "ASAP",
    title: "Academics Stand Against Poverty",
    blurb:
      "A global academic network fighting poverty. Full rebuild: structured content, fast pages, and a site the team updates themselves through Sauro CMS.",
    meta: "Full rebuild · CMS · SEO",
    live: true,
    gradient: "linear-gradient(135deg,#0c2f5a,#005eb8)",
  },
  {
    cat: "Product",
    tag: "Product",
    mark: "SAURO",
    title: "Sauro CMS",
    blurb:
      "The calm, private content manager included with every build — pages, news, media, and reviews managed in minutes without a developer.",
    meta: "Product · included in every build",
    live: true,
    gradient: "linear-gradient(135deg,#005eb8,#4a8be8)",
  },
  {
    cat: "Travel",
    tag: "Travel",
    mark: "ITB",
    title: "ITB Berlin presentation site",
    blurb:
      "A conference presentation website delivered at speed — swift, responsive, and detail-focused for an international travel audience.",
    meta: "Conference site · rapid delivery",
    live: false,
    gradient: "linear-gradient(135deg,#0e7490,#22b8cf)",
  },
  {
    cat: "Charity",
    tag: "Parish council",
    mark: "FPC",
    title: "Froxfield Parish Council",
    blurb:
      "From a single homepage to a modern, structured site — a trusted source of information reflecting the council’s commitment to openness.",
    meta: "Rebuild · structured content",
    live: true,
    gradient: "linear-gradient(135deg,#166534,#22a55a)",
  },
  {
    cat: "Professional services",
    tag: "Professional services",
    mark: "BRAVE",
    title: "The Brave",
    blurb:
      "A strategic, user-friendly site genuinely tailored to its audience — built end to end for a founder-led organisation.",
    meta: "Design + build · strategy",
    live: true,
    gradient: "linear-gradient(135deg,#7c2d92,#b656d6)",
  },
  {
    cat: "Product",
    tag: "Publishing",
    mark: "JASAP",
    title: "Journal ASAP rescue",
    blurb:
      "“Mission impossible handled” — a serious website problem others said needed a full rebuild, solved in a few hours.",
    meta: "Fix + stabilise · same week",
    live: true,
    gradient: "linear-gradient(135deg,#9a3412,#ea7c3c)",
  },
]

export function WorkGrid() {
  const [filter, setFilter] = useState<Category>("All")
  const projects = PROJECTS.filter((p) => filter === "All" || p.cat === filter)

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
        {projects.map((project) => (
          <div
            key={project.title}
            className={`${HOME_CARD} flex flex-col overflow-hidden transition-[transform,box-shadow,border-color] duration-300 ease-[var(--vd-hover-ease)] hover:-translate-y-1 hover:border-primary hover:shadow-[var(--vd-shadow-primary)]`}
          >
            <div
              className="relative flex h-[150px] items-end px-6 py-5"
              style={{ background: project.gradient }}
            >
              <span
                className={`${HOME_MONO} absolute left-3.5 top-3.5 rounded-[3px] bg-white/[.92] px-2 py-1 text-[10px] text-[#0f1c2e]`}
              >
                {project.tag}
              </span>
              <span className="text-[26px] font-extrabold tracking-[-0.02em] text-white [text-shadow:0_1px_8px_rgba(0,0,0,.18)]">
                {project.mark}
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-2.5 px-7 pb-7 pt-6">
              <div className="text-lg font-bold tracking-[-0.01em]">{project.title}</div>
              <div className="flex-1 text-[13.5px] leading-relaxed text-muted-foreground">
                {project.blurb}
              </div>
              <div className="flex items-center gap-3.5 pt-1.5">
                {project.live ? (
                  <span
                    className={`${HOME_MONO} rounded-[3px] bg-[color-mix(in_srgb,var(--vd-score-perfect)_14%,var(--vd-bg))] px-2 py-1 text-[10px] text-[color-mix(in_srgb,var(--vd-score-perfect)_60%,var(--vd-fg))]`}
                  >
                    ● Live
                  </span>
                ) : null}
                <span className={`${HOME_MONO} text-[10px] text-muted-foreground`}>
                  {project.meta}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
