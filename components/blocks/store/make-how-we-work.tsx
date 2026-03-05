import type { ComponentConfig } from "@measured/puck"
import type { ElementType } from "react"
import { Code2, PenTool, Rocket, Search } from "lucide-react"

import { Badge } from "@/components/ui/badge"

const iconMap = {
  Search,
  PenTool,
  Code2,
  Rocket,
} satisfies Record<string, ElementType>

export type HowWeWorkStep = {
  title: string
  description: string
  icon?: keyof typeof iconMap
}

export type MakeHowWeWorkProps = {
  id?: string
  eyebrow?: string
  headline: string
  body?: string
  steps: HowWeWorkStep[]
}

function getIcon(name?: string) {
  if (!name) return null
  return (iconMap as Record<string, ElementType>)[name] || null
}

export function MakeHowWeWork({ eyebrow, headline, body, steps }: MakeHowWeWorkProps) {
  return (
    <section className="border-t border-border bg-background py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          {eyebrow ? (
            <Badge
              variant="outline"
              className="mb-4 inline-flex items-center rounded-full border-border px-3 py-1 text-xs uppercase tracking-[0.2em] text-muted-foreground"
            >
              {eyebrow}
            </Badge>
          ) : null}
          <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">{headline}</h2>
          {body ? <p className="text-lg text-muted-foreground">{body}</p> : null}
        </div>

        <div className="grid gap-8 md:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = getIcon(step.icon)
            return (
              <div key={`${step.title}-${index}`} className="relative">
                {index < steps.length - 1 ? (
                  <div className="absolute top-8 left-1/2 hidden h-0.5 w-full -z-10 bg-border md:block" />
                ) : null}
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-sm">
                    {Icon ? <Icon size={32} /> : <span className="text-lg font-semibold">{index + 1}</span>}
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-foreground">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export const makeHowWeWorkConfig: ComponentConfig<MakeHowWeWorkProps> = {
  fields: {
    eyebrow: { type: "text" },
    headline: { type: "text" },
    body: { type: "textarea" },
    steps: {
      type: "array",
      arrayFields: {
        title: { type: "text" },
        description: { type: "textarea" },
        icon: {
          type: "select",
          options: [
            { label: "Search", value: "Search" },
            { label: "PenTool", value: "PenTool" },
            { label: "Code2", value: "Code2" },
            { label: "Rocket", value: "Rocket" },
          ],
        },
      },
    },
  },
  defaultProps: {
    eyebrow: "How we work",
    headline: "How we work",
    body: "Simple, transparent, and focused on getting you a return on investment.",
    steps: [
      {
        title: "1. Discovery & Fixed Price",
        description:
          "We chat about your goals. I give you a fixed project price. No hourly billing, no surprise invoices.",
        icon: "Search",
      },
      {
        title: "2. Design & Prototype",
        description:
          "I design the key pages in Figma. You get a clickable prototype to approve before a single line of code is written.",
        icon: "PenTool",
      },
      {
        title: "3. The Build",
        description:
          "I build the site using Next.js and hook up the CMS. You can start adding real content while I finish the development.",
        icon: "Code2",
      },
      {
        title: "4. Launch & Training",
        description:
          "We go live. I record a personalized video showing you exactly how to edit every part of your new site.",
        icon: "Rocket",
      },
    ],
  },
  render: (props) => <MakeHowWeWork {...props} />,
}
