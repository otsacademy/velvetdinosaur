import { ArrowUpRight } from "lucide-react"

interface CaseStudy {
  id: string
  title: string
  subtitle: string
  description: string
}

const caseStudies: CaseStudy[] = [
  {
    id: "asap",
    title: "Academics Stand Against Poverty",
    subtitle: "International academic network fighting poverty",
    description:
      "Velvet Dinosaur initially supported ASAP by helping update and host its journal platform. That work later grew into a full website redesign and migration from an outdated WordPress and Elementor setup to a bespoke platform. The new site offers a cleaner user experience, simpler news publishing, a flexible drag-and-drop page builder, and an integrated event creation tool.",
  },
  {
    id: "the-brave",
    title: "The Brave",
    subtitle: "Values-led ethical tourism platform",
    description:
      "Velvet Dinosaur developed a professional and elegant website supported by a bespoke travel management system. The site includes personalised video content from TikTok and YouTube to communicate the brand's values-led approach. We worked closely with Faye throughout the project to make sure the final result matched her vision.",
  },
  {
    id: "rising-dust",
    title: "Rising Dust Adventures",
    subtitle: "Premium motorcycle expedition company",
    description:
      "The website was designed to reflect the brand's safety-first, experience-led approach, showcasing routes, testimonials, and expedition details in a way that feels credible, aspirational, and easy to explore. The result is a digital presence that supports a niche adventure travel brand with strong storytelling and clear trip information.",
  },
  {
    id: "scholardemia",
    title: "Scholardemia",
    subtitle: "Academic social networking & research management platform",
    description:
      "The platform brings together academic profiles, collaboration tools, event and conference management, research publishing, and journal hosting in one ecosystem. It is designed to reduce the fragmentation of academic workflows by combining networking, peer review, collaborative writing, repository management, and institutional publishing tools in a single platform.",
  },
]

function CaseStudyCard({ title, subtitle, description }: CaseStudy) {
  return (
    <div className="group rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-lg">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-foreground transition-colors group-hover:text-primary">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <ArrowUpRight className="h-5 w-5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  )
}

export function PortfolioSection() {
  return (
    <section id="portfolio" className="py-6 md:py-8">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="vd-section-heading mb-6 text-2xl font-semibold">Portfolio</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {caseStudies.map((study) => (
            <CaseStudyCard key={study.id} {...study} />
          ))}
        </div>
      </div>
    </section>
  )
}
