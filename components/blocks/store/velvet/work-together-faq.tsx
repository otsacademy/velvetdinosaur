"use client"

import { useMemo, useState } from "react"
import type { ComponentConfig } from "@measured/puck"
import { ChevronRight, Sparkles } from "lucide-react"

import { EditableText } from "@/components/content/editable"
import { contentKey } from "@/components/content/content-keys"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Section } from "@/components/ui/section"
import { cn } from "@/lib/utils"

type WorkTogetherFaqItem = {
  id?: string
  question: string
  answer: string
}

type WorkTogetherStep = {
  id: string
  number: number
  title: string
  summary: string
  details: string
  faqs: WorkTogetherFaqItem[]
}

export type WorkTogetherFaqProps = {
  id?: string
  heading: string
  subheading: string
  faqsLabel: string
  stepLabel: string
  steps: WorkTogetherStep[]
}

export function WorkTogetherFaq(props: WorkTogetherFaqProps) {
  const key = (path: string) => contentKey(props.id, path)
  const steps = useMemo(() => {
    return (props.steps || []).map((step) => ({
      ...step,
      id: step.id || slugify(step.title),
      faqs: (step.faqs || []).map((faq) => ({
        ...faq,
        id: faq.id || slugify(faq.question),
      })),
    }))
  }, [props.steps])

  const [activeStepId, setActiveStepId] = useState<string>(steps[0]?.id ?? "")
  const [openStepId, setOpenStepId] = useState<string>(steps[0]?.id ?? "")

  const activeStep = useMemo(
    () => steps.find((step) => step.id === activeStepId) ?? steps[0],
    [activeStepId, steps],
  )
  const activeStepIndex = useMemo(
    () => steps.findIndex((step) => step.id === activeStep?.id),
    [steps, activeStep],
  )

  if (!steps.length) return null

  const handleStepChange = (stepId: string) => {
    setActiveStepId(stepId)
    setOpenStepId(stepId)
  }

  return (
    <Section id="process" size="hero">
      <span id="faq" className="sr-only" aria-hidden="true" />
      <div className="space-y-8">
        <div className="space-y-3 text-center">
          <div className="flex items-center justify-center gap-3">
            <Sparkles className="h-7 w-7 text-muted-foreground md:h-8 md:w-8" aria-hidden="true" />
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              <EditableText contentKey={key("workTogether.heading")} value={props.heading} as="span" showIcon={false} />
            </h2>
          </div>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground md:text-base">
            <EditableText
              contentKey={key("workTogether.subheading")}
              value={props.subheading}
              as="span"
              multiline
              showIcon={false}
            />
          </p>
        </div>

        <div className="lg:hidden">
          <Accordion
            type="single"
            collapsible
            value={openStepId}
            onValueChange={(value) => {
              if (!value) return
              setOpenStepId(value)
              setActiveStepId(value)
            }}
            className="space-y-2"
          >
            {steps.map((step, stepIndex) => (
              <AccordionItem key={step.id} value={step.id} className="rounded-xl border border-border/70 px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-xs font-semibold">
                      <EditableText
                        contentKey={key(`workTogether.steps.${stepIndex}.number`)}
                        value={String(step.number)}
                        as="span"
                        showIcon={false}
                      />
                    </span>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        <EditableText
                          contentKey={key(`workTogether.steps.${stepIndex}.title`)}
                          value={step.title}
                          as="span"
                          showIcon={false}
                        />
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <EditableText
                          contentKey={key(`workTogether.steps.${stepIndex}.summary`)}
                          value={step.summary}
                          as="span"
                          showIcon={false}
                        />
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-5">
                  <StepContent
                    step={step}
                    stepIndex={stepIndex}
                    faqsLabel={props.faqsLabel}
                    contentKey={key}
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="hidden gap-6 lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
          <div role="tablist" aria-label="Process steps" className="space-y-3">
            {steps.map((step, stepIndex) => {
              const isActive = step.id === activeStep?.id
              return (
                <button
                  key={step.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`step-panel-${step.id}`}
                  onClick={() => handleStepChange(step.id)}
                  className={cn(
                    "group relative w-full rounded-xl border border-transparent px-4 py-4 text-left transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isActive ? "bg-muted/70 ring-1 ring-border" : "hover:border-border/70 hover:bg-muted/40",
                  )}
                >
                  <span
                    className={cn(
                      "absolute left-0 top-4 h-10 w-1 rounded-full bg-primary transition-opacity duration-200",
                      isActive ? "opacity-100" : "opacity-0",
                    )}
                    aria-hidden="true"
                  />
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-xs font-semibold">
                        <EditableText
                          contentKey={key(`workTogether.steps.${stepIndex}.number`)}
                          value={String(step.number)}
                          as="span"
                          showIcon={false}
                        />
                      </span>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          <EditableText
                            contentKey={key(`workTogether.steps.${stepIndex}.title`)}
                            value={step.title}
                            as="span"
                            showIcon={false}
                          />
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <EditableText
                            contentKey={key(`workTogether.steps.${stepIndex}.summary`)}
                            value={step.summary}
                            as="span"
                            showIcon={false}
                          />
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className={cn(
                        "mt-1 h-4 w-4 text-muted-foreground transition-transform duration-200",
                        isActive ? "rotate-90 text-foreground" : "group-hover:translate-x-0.5",
                      )}
                      aria-hidden="true"
                    />
                  </div>
                </button>
              )
            })}
          </div>

          <div className="lg:sticky lg:top-24">
            <Card id={`step-panel-${activeStep?.id}`} className="border-border/70">
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">
                    <EditableText contentKey={key("workTogether.stepLabel")} value={props.stepLabel} as="span" showIcon={false} />{" "}
                    {activeStep?.number}
                  </Badge>
                  <CardTitle className="text-xl">
                    <EditableText
                      contentKey={key(`workTogether.steps.${activeStepIndex}.title`)}
                      value={activeStep?.title || ""}
                      as="span"
                      showIcon={false}
                    />
                  </CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  <EditableText
                    contentKey={key(`workTogether.steps.${activeStepIndex}.summary`)}
                    value={activeStep?.summary || ""}
                    as="span"
                    showIcon={false}
                  />
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  <EditableText
                    contentKey={key(`workTogether.steps.${activeStepIndex}.details`)}
                    value={activeStep?.details || ""}
                    as="span"
                    multiline
                    showIcon={false}
                  />
                </p>
                <Separator />
                {activeStep ? (
                  <StepFaqs
                    step={activeStep}
                    stepIndex={activeStepIndex}
                    faqsLabel={props.faqsLabel}
                    contentKey={key}
                  />
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Section>
  )
}

type StepContentProps = {
  step: WorkTogetherStep
  stepIndex: number
  faqsLabel: string
  contentKey: (path: string) => string
}

function StepContent({ step, stepIndex, faqsLabel, contentKey: key }: StepContentProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        <EditableText
          contentKey={key(`workTogether.steps.${stepIndex}.details`)}
          value={step.details}
          as="span"
          multiline
          showIcon={false}
        />
      </p>
      <StepFaqs step={step} stepIndex={stepIndex} faqsLabel={faqsLabel} contentKey={key} />
    </div>
  )
}

type StepFaqsProps = {
  step: WorkTogetherStep
  stepIndex: number
  faqsLabel: string
  contentKey: (path: string) => string
}

function StepFaqs({ step, stepIndex, faqsLabel, contentKey: key }: StepFaqsProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        <EditableText contentKey={key("workTogether.faqsLabel")} value={faqsLabel} as="span" showIcon={false} />
      </p>
      <Accordion type="single" collapsible className="space-y-2">
        {(step.faqs || []).map((faq, faqIndex) => (
          <AccordionItem key={faq.id || faqIndex} value={faq.id || String(faqIndex)} className="rounded-lg border border-border/70 px-4">
            <AccordionTrigger className="hover:no-underline">
              <EditableText
                contentKey={key(`workTogether.steps.${stepIndex}.faqs.${faqIndex}.question`)}
                value={faq.question}
                as="span"
                showIcon={false}
              />
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              <EditableText
                contentKey={key(`workTogether.steps.${stepIndex}.faqs.${faqIndex}.answer`)}
                value={faq.answer}
                as="span"
                multiline
                showIcon={false}
              />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
}

export const workTogetherFaqConfig: ComponentConfig<WorkTogetherFaqProps> = {
  fields: {
    heading: { type: "text" },
    subheading: { type: "textarea" },
    faqsLabel: { type: "text" },
    stepLabel: { type: "text" },
    steps: {
      type: "array",
      arrayFields: {
        id: { type: "text" },
        number: { type: "number" },
        title: { type: "text" },
        summary: { type: "textarea" },
        details: { type: "textarea" },
        faqs: {
          type: "array",
          arrayFields: {
            id: { type: "text" },
            question: { type: "text" },
            answer: { type: "textarea" },
          },
        },
      },
    },
  },
  defaultProps: {
    heading: "",
    subheading: "",
    faqsLabel: "",
    stepLabel: "",
    steps: [],
  },
  render: (props) => <WorkTogetherFaq {...props} />,
}
