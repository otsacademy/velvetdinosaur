import type { Metadata } from "next"

import { DesignShell } from "@/components/home/design-shell"
import { HOME_CARD, HOME_CONTAINER, LETTER_EM, PageIntro } from "@/components/home/home-shared"
import { CtaPanel } from "@/components/home/home-social"
import { WorkGrid } from "@/components/home/work-grid.client"
import { siteName } from "@/lib/site-metadata"

const workTitle = `Website design work and case studies | ${siteName}`
const workDescription =
  "Real projects, real outcomes. Websites for charities, community organisations, travel companies and product platforms, built by Velvet Dinosaur for speed, clarity and content the client controls."

export const metadata: Metadata = {
  title: workTitle,
  description: workDescription,
  alternates: { canonical: "/work" },
  openGraph: {
    type: "website",
    url: "/work",
    siteName,
    title: workTitle,
    description: workDescription,
  },
}

export default function WorkIndexPage() {
  return (
    <DesignShell active="work">
      <PageIntro
        kicker="The work"
        title={
          <>
            Real projects, <em className={LETTER_EM}>real outcomes.</em>
          </>
        }
      >
        Charities, community organisations, travel and product platforms. Each built for speed,
        clarity and content the client controls.
      </PageIntro>

      <section className={`${HOME_CONTAINER} pt-[38px]`}>
        <WorkGrid />
        <p className={`${HOME_CARD} m-0 mt-[30px] px-7 py-6 text-lg text-muted-foreground`}>
          <strong className="font-semibold text-foreground">Powered by Sauro CMS.</strong> Every
          project above except Scholardemia runs on Sauro, the private content manager included
          with every build, so clients update pages, news, media and reviews themselves.
        </p>
      </section>

      <CtaPanel title="Have something similar in mind?" />
    </DesignShell>
  )
}
