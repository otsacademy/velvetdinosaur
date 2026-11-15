"use client"

import { useState } from "react"

import { cn } from "@/lib/utils"
import { WORK_CATEGORIES, WORK_PROJECTS, type WorkCategory } from "./site-data"
import { WORK_GRID, WorkCard } from "./work-card"

// The Work page's portfolio: filter chips over the project cards. The
// projects themselves live in site-data.ts.
export function WorkGrid() {
  const [filter, setFilter] = useState<WorkCategory>("All")
  const projects = WORK_PROJECTS.filter((project) => filter === "All" || project.cat === filter)

  return (
    <>
      <div role="group" aria-label="Filter projects" className="flex flex-wrap gap-2.5">
        {WORK_CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setFilter(category)}
            aria-pressed={filter === category}
            className={cn(
              "min-h-[46px] cursor-pointer rounded-full border-[1.5px] px-5 text-[17px] font-semibold transition-[transform,border-color] duration-200 hover:-translate-y-px hover:border-primary motion-reduce:transition-none motion-reduce:hover:translate-y-0",
              filter === category
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-transparent text-foreground",
            )}
          >
            {category}
          </button>
        ))}
      </div>

      <div className={`${WORK_GRID} mt-9`}>
        {projects.map((project, index) => (
          <WorkCard key={project.key} project={project} heading="h2" detailed eager={index < 2} />
        ))}
      </div>
    </>
  )
}
