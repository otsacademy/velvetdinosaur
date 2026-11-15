import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { HOME_CARD, HOME_CARD_HOVER, HOME_KICKER, LETTER_H3, LETTER_LINK } from "./home-shared"
import type { WorkProject } from "./site-data"

// One project, as a framed snapshot (or a line from the client's review where
// there is no snapshot) with its story underneath. When there is a case study
// the title is the link, stretched over the whole card.
export function WorkCard({
  project,
  heading: Heading = "h3",
  detailed = false,
  eager = false,
  reveal = false,
}: {
  project: WorkProject
  heading?: "h2" | "h3"
  /** Adds the footer line: what the job was, and the case-study prompt. */
  detailed?: boolean
  /** Load the snapshot straight away, for cards at the top of a page. */
  eager?: boolean
  reveal?: boolean
}) {
  const { banner } = project

  return (
    <article
      data-reveal={reveal ? "" : undefined}
      className={cn(HOME_CARD, HOME_CARD_HOVER, "relative flex flex-col px-3.5 pb-[26px] pt-3.5")}
    >
      {banner.kind === "image" ? (
        <Image
          src={banner.src}
          alt={banner.alt}
          width={1440}
          height={654}
          sizes="(min-width: 900px) min(545px, calc(50vw - 75px)), calc(100vw - 78px)"
          loading={eager ? "eager" : "lazy"}
          className="block h-auto w-full rounded border border-border"
        />
      ) : (
        <div
          className={cn(
            "flex aspect-[1440/654] items-center justify-center rounded p-6 text-center",
            banner.tone === "navy"
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-muted text-foreground",
          )}
        >
          <p className="m-0 max-w-[420px] font-serif text-[clamp(1.25rem,2.3vw,1.9375rem)] italic leading-[1.25]">
            “{banner.quote}”
          </p>
        </div>
      )}
      <div className="flex flex-1 flex-col px-3 pt-5">
        <p className={`${HOME_KICKER} m-0 text-accent`}>{project.tag}</p>
        <Heading className={`${LETTER_H3} mt-1.5`}>
          {project.caseStudyHref ? (
            <Link
              href={project.caseStudyHref}
              className="after:absolute after:inset-0 after:rounded-lg after:content-[''] hover:text-primary"
            >
              {project.title}
            </Link>
          ) : (
            project.title
          )}
        </Heading>
        <p className="m-0 mt-2.5 flex-1 text-[17px] text-muted-foreground">{project.blurb}</p>
        {detailed ? (
          <p className="m-0 mt-[18px] flex flex-wrap justify-between gap-x-4 gap-y-2 border-t border-border pt-4 text-[15px] text-muted-foreground">
            <span>{project.meta}</span>
            {project.caseStudyHref ? (
              <span aria-hidden className={LETTER_LINK}>
                Read the case study
              </span>
            ) : null}
          </p>
        ) : null}
      </div>
    </article>
  )
}

export const WORK_GRID = "grid gap-[26px] min-[900px]:grid-cols-2"
