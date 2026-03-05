"use client"

import type { ComponentConfig } from "@measured/puck"
import { Layers, Pencil, Search, Server, Smartphone, Zap } from "lucide-react"

import { EditableText } from "@/components/demo/editable"
import { demoKey } from "@/components/demo/demo-helpers"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Section, SectionHeading } from "@/components/ui/section"
import { AnimatedSection } from "@/components/ui/animated-section"

const iconMap: Record<string, React.ElementType> = {
  Zap,
  Pencil,
  Search,
  Server,
  Smartphone,
  Layers,
}

type ServiceItem = {
  title: string
  body: string
  builtWith?: string
  icon: string
}

export type ServicesGridProps = {
  id?: string
  heading: string
  items: ServiceItem[]
}

export function ServicesGrid(props: ServicesGridProps) {
  const key = (path: string) => demoKey(props.id, path)

  return (
    <Section id="services" className="bg-muted/30" animate divider>
      <SectionHeading displayFont>
        <span className="inline-flex items-center justify-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8 md:h-9 md:w-9 text-muted-foreground"
            aria-hidden
          >
            <path d="m15 12-9.373 9.373a1 1 0 0 1-3.001-3L12 9" />
            <path d="m18 15 4-4" />
            <path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172v-.344a2 2 0 0 0-.586-1.414l-1.657-1.657A6 6 0 0 0 12.516 3H9l1.243 1.243A6 6 0 0 1 12 8.485V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5" />
          </svg>
          <EditableText demoKey={key("services.heading")} value={props.heading} as="span" showIcon={false} />
        </span>
      </SectionHeading>
      <AnimatedSection animation="fade-up" staggerChildren staggerDelay={80} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {props.items.map((service, index) => {
          const Icon = iconMap[service.icon] || Zap

          return (
            <Card key={index} className="bg-background border-border/60 hover:border-primary/50 transition-all duration-300">
              <CardHeader className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="icon-badge shrink-0">
                    <Icon className="w-5 h-5" aria-hidden />
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="text-foreground text-lg leading-snug">
                      <EditableText
                        demoKey={key(`services.items.${index}.title`)}
                        value={service.title}
                        as="span"
                        showIcon={false}
                      />
                    </CardTitle>
                    <CardDescription className="text-muted-foreground leading-relaxed">
                      <EditableText
                        demoKey={key(`services.items.${index}.body`)}
                        value={service.body}
                        as="span"
                        multiline
                        showIcon={false}
                      />
                    </CardDescription>
                    {service.builtWith ? (
                      <p className="text-xs text-muted-foreground/80">
                        <EditableText
                          demoKey={key(`services.items.${index}.builtWith`)}
                          value={service.builtWith}
                          as="span"
                          showIcon={false}
                        />
                      </p>
                    ) : null}
                  </div>
                </div>
              </CardHeader>
            </Card>
          )
        })}
      </AnimatedSection>
    </Section>
  )
}

export const servicesGridConfig: ComponentConfig<ServicesGridProps> = {
  fields: {
    heading: { type: "text" },
    items: {
      type: "array",
      arrayFields: {
        title: { type: "text" },
        body: { type: "textarea" },
        builtWith: { type: "text" },
        icon: {
          type: "select",
          options: [
            { label: "Zap", value: "Zap" },
            { label: "Pencil", value: "Pencil" },
            { label: "Search", value: "Search" },
            { label: "Server", value: "Server" },
            { label: "Smartphone", value: "Smartphone" },
            { label: "Layers", value: "Layers" },
          ],
        },
      },
    },
  },
  defaultProps: {
    heading: "",
    items: [],
  },
  render: (props) => <ServicesGrid {...props} />,
}
