"use client"

import type { ComponentConfig } from "@measured/puck"

import { EditableText } from "@/components/content/editable"
import { contentKey } from "@/components/content/content-keys"
import { Section, SectionHeading } from "@/components/ui/section"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"

type ProcessStep = {
  step: number
  title: string
  summary: string
  description: string
}

export type ProcessSectionProps = {
  id?: string
  heading: string
  subheading: string
  steps: ProcessStep[]
}

export function ProcessSection(props: ProcessSectionProps) {
  const key = (path: string) => contentKey(props.id, path)
  const steps = props.steps || []

  return (
    <Section id="process">
      <SectionHeading>
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
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
            <path d="M9 12h6" />
            <path d="M12 9v6" />
          </svg>
          <EditableText contentKey={key("process.heading")} value={props.heading} as="span" showIcon={false} />
        </span>
      </SectionHeading>
      <p className="text-center text-muted-foreground mb-6 md:mb-8 max-w-2xl mx-auto">
        <EditableText
          contentKey={key("process.subheading")}
          value={props.subheading}
          as="span"
          multiline
          showIcon={false}
        />
      </p>

      <div className="relative max-w-2xl mx-auto">
        <div className="absolute left-4 md:left-5 top-3 bottom-3 w-px bg-border" aria-hidden="true" />
        <Accordion type="single" collapsible className="space-y-2">
          {steps.map((item, index) => (
            <AccordionItem key={item.step} value={`step-${item.step}`} className="border-b-0">
              <AccordionTrigger className="group py-4 md:py-5 hover:no-underline transition-none">
                <div className="flex items-start gap-4 text-left">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-semibold text-foreground transition-colors group-hover:text-primary group-hover:border-primary group-data-[state=open]:text-primary group-data-[state=open]:border-primary">
                    <EditableText
                      contentKey={key(`process.steps.${index}.step`)}
                      value={String(item.step)}
                      as="span"
                      showIcon={false}
                    />
                  </span>
                  <div className="space-y-1">
                    <p className="text-base md:text-lg font-medium text-foreground transition-colors group-hover:text-primary group-data-[state=open]:text-primary">
                      <EditableText
                        contentKey={key(`process.steps.${index}.title`)}
                        value={item.title}
                        as="span"
                        showIcon={false}
                      />
                    </p>
                    <p className="text-sm text-muted-foreground transition-colors group-hover:text-primary/80 group-data-[state=open]:text-primary/80">
                      <EditableText
                        contentKey={key(`process.steps.${index}.summary`)}
                        value={item.summary}
                        as="span"
                        showIcon={false}
                      />
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pl-12 md:pl-14">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <EditableText
                    contentKey={key(`process.steps.${index}.description`)}
                    value={item.description}
                    as="span"
                    multiline
                    showIcon={false}
                  />
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  )
}

export const processSectionConfig: ComponentConfig<ProcessSectionProps> = {
  fields: {
    heading: { type: "text" },
    subheading: { type: "textarea" },
    steps: {
      type: "array",
      arrayFields: {
        step: { type: "number" },
        title: { type: "text" },
        summary: { type: "text" },
        description: { type: "textarea" },
      },
    },
  },
  defaultProps: {
    heading: "",
    subheading: "",
    steps: [],
  },
  render: (props) => <ProcessSection {...props} />,
}
