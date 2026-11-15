import Link from "next/link"

import { HOME_CONTAINER, LETTER_LINK, SectionIntro } from "./home-shared"
import { FEATURED_WORK } from "./site-data"
import { WORK_GRID, WorkCard } from "./work-card"

export function HomeWork() {
  return (
    <section id="work" className={`${HOME_CONTAINER} scroll-mt-20 pt-20 sm:pt-28`}>
      <SectionIntro kicker="Part three · The work" title="Some things I’ve made.">
        Charities, community organisations, travel companies and product platforms. Each one
        built for speed and clarity, with content the client controls.
      </SectionIntro>
      <div className={`${WORK_GRID} mt-11 sm:mt-[52px]`}>
        {FEATURED_WORK.map((project) => (
          <WorkCard key={project.key} project={project} reveal />
        ))}
      </div>
      <p className="m-0 mt-[34px] text-center">
        <Link href="/work" className={`${LETTER_LINK} text-[19px]`}>
          See all the work, with case studies
        </Link>
      </p>
    </section>
  )
}
