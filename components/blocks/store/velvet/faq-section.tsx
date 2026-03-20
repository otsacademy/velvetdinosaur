"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { ComponentConfig } from "@measured/puck"
import { ChevronRight, HelpCircle, Search } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { EditableText } from "@/components/content/editable"
import { contentKey } from "@/components/content/content-keys"

type FaqItem = {
  question: string
  answer: string
  category: string
}

type FaqCta = {
  label: string
  href: string
}

type StringItem = string | { value?: string }

export type FaqSectionProps = {
  id?: string
  heading: string
  subheading: string
  searchPlaceholder: string
  allLabel: string
  questionsLabel: string
  resultLabel: string
  emptyMessage: string
  clearFiltersLabel: string
  stillUnsureLabel: string
  selectPrompt: string
  selectPromptTitle: string
  selectPromptBody: string
  primaryCta: FaqCta
  secondaryCta: FaqCta
  categories: StringItem[]
  items: FaqItem[]
}

export function FaqSection(props: FaqSectionProps) {
  const key = (path: string) => contentKey(props.id, path)
  const items = props.items || []
  const normalizedCategories = (props.categories || [])
    .map((item) => (typeof item === "string" ? item : item?.value))
    .filter((item): item is string => Boolean(item))
  const categories = normalizedCategories.length
    ? normalizedCategories
    : Array.from(new Set(items.map((item) => item.category)))
  const allLabel = props.allLabel || "All"
  const selectPromptTitle = props.selectPromptTitle || props.selectPrompt
  const selectPromptBody = props.selectPromptBody || props.selectPrompt

  const faqs = useMemo(() => {
    return items.map((item, index) => ({
      id: slugify(item.question),
      question: item.question,
      answer: item.answer,
      category: item.category,
      index,
    }))
  }, [items])

  const [selectedCategory, setSelectedCategory] = useState<string>(allLabel)
  const [search, setSearch] = useState("")
  const [activeId, setActiveId] = useState<string>(faqs[0]?.id ?? "")
  const answerRef = useRef<HTMLDivElement | null>(null)

  const counts = useMemo(() => {
    const result = new Map<string, number>()
    categories.forEach((category) => result.set(category, 0))
    faqs.forEach((item) => result.set(item.category, (result.get(item.category) ?? 0) + 1))
    return result
  }, [categories, faqs])

  const filteredFaqs = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    return faqs.filter((item) => {
      if (selectedCategory !== allLabel && item.category !== selectedCategory) return false
      if (!normalized) return true
      return item.question.toLowerCase().includes(normalized)
    })
  }, [faqs, search, selectedCategory, allLabel])

  const resolvedActiveId = useMemo(() => {
    if (filteredFaqs.some((item) => item.id === activeId)) return activeId
    return filteredFaqs[0]?.id ?? ""
  }, [activeId, filteredFaqs])

  const activeFaq = useMemo(
    () => filteredFaqs.find((item) => item.id === resolvedActiveId) ?? filteredFaqs[0],
    [filteredFaqs, resolvedActiveId],
  )

  useEffect(() => {
    if (!activeFaq) return
    if (typeof window === "undefined") return
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches
    if (isDesktop) return
    if (!answerRef.current) return
    requestAnimationFrame(() => {
      answerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }, [resolvedActiveId, activeFaq])

  const clearFilters = () => {
    setSearch("")
    setSelectedCategory(allLabel)
  }

  return (
    <section id="faq" className="py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="space-y-4 text-center">
          <div className="flex items-center justify-center gap-3">
            <HelpCircle className="h-8 w-8 text-muted-foreground md:h-9 md:w-9" aria-hidden="true" />
            <h2 className="text-3xl font-semibold tracking-tight">
              <EditableText contentKey={key("faq.heading")} value={props.heading} as="span" showIcon={false} />
            </h2>
          </div>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground md:text-base">
            <EditableText
              contentKey={key("faq.subheading")}
              value={props.subheading}
              as="span"
              multiline
              showIcon={false}
            />
          </p>
        </div>

        <div className="mt-8 space-y-5">
          <div className="flex gap-3 overflow-x-auto pb-2" role="tablist" aria-label="FAQ categories">
            <CategoryChip
              label={allLabel}
              count={faqs.length}
              isActive={selectedCategory === allLabel}
              onClick={() => setSelectedCategory(allLabel)}
            />
            {categories.map((category) => (
              <CategoryChip
                key={category}
                label={category}
                count={counts.get(category) ?? 0}
                isActive={selectedCategory === category}
                onClick={() => setSelectedCategory(category)}
              />
            ))}
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={props.searchPlaceholder}
              className="pl-9"
              aria-label={props.searchPlaceholder}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start">
            <Card className="border-border/70">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">
                  <EditableText
                    contentKey={key("faq.questionsLabel")}
                    value={props.questionsLabel}
                    as="span"
                    showIcon={false}
                  />
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {filteredFaqs.length} {props.resultLabel}{filteredFaqs.length === 1 ? "" : "s"}
                </p>
              </CardHeader>
              <CardContent>
                {filteredFaqs.length ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      {filteredFaqs.map((item) => {
                        const isActive = item.id === activeFaq?.id
                        return (
                          <button
                            key={item.id}
                            type="button"
                            role="option"
                            aria-selected={isActive}
                            onClick={() => setActiveId(item.id)}
                            className={cn(
                              "group relative w-full rounded-xl border border-transparent px-4 py-3 text-left transition-all duration-200",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                              isActive
                                ? "bg-muted/70 ring-1 ring-border"
                                : "hover:border-border/70 hover:bg-muted/40",
                            )}
                          >
                            <span
                              className={cn(
                                "absolute left-0 top-3 h-10 w-1 rounded-full bg-primary transition-opacity duration-200",
                                isActive ? "opacity-100" : "opacity-0",
                              )}
                              aria-hidden="true"
                            />
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm font-medium text-foreground">
                                <EditableText
                                  contentKey={key(`faq.items.${item.index}.question`)}
                                  value={item.question}
                                  as="span"
                                  showIcon={false}
                                />
                              </span>
                              <ChevronRight
                                className={cn(
                                  "h-4 w-4 text-muted-foreground transition-transform duration-200",
                                  isActive ? "rotate-90 text-foreground" : "group-hover:translate-x-0.5",
                                )}
                                aria-hidden="true"
                              />
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/70 p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      <EditableText
                        contentKey={key("faq.emptyMessage")}
                        value={props.emptyMessage}
                        as="span"
                        showIcon={false}
                      />
                    </p>
                    <Button variant="outline" onClick={clearFilters}>
                      <EditableText
                        contentKey={key("faq.clearFiltersLabel")}
                        value={props.clearFiltersLabel}
                        as="span"
                        showIcon={false}
                      />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <div ref={answerRef} className="lg:sticky lg:top-24">
              <Card className="border-border/70">
                <CardHeader className="space-y-2 pb-4">
                  <Badge variant="secondary" className="w-fit">
                    {activeFaq?.category ?? props.heading}
                  </Badge>
                  <CardTitle className="text-xl">
                    {activeFaq ? (
                      <EditableText
                        contentKey={key(`faq.items.${activeFaq.index}.question`)}
                        value={activeFaq.question}
                        as="span"
                        showIcon={false}
                      />
                    ) : (
                      <EditableText
                        contentKey={key("faq.selectPromptTitle")}
                        value={selectPromptTitle}
                        as="span"
                        showIcon={false}
                      />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    {activeFaq ? (
                      <EditableText
                        contentKey={key(`faq.items.${activeFaq.index}.answer`)}
                        value={activeFaq.answer}
                        as="p"
                        multiline
                        showIcon={false}
                      />
                    ) : (
                      <EditableText
                        contentKey={key("faq.selectPromptBody")}
                        value={selectPromptBody}
                        as="p"
                        showIcon={false}
                      />
                    )}
                  </div>
                  <Separator />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-medium">
                      <EditableText
                        contentKey={key("faq.stillUnsureLabel")}
                        value={props.stillUnsureLabel}
                        as="span"
                        showIcon={false}
                      />
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild variant="secondary" size="sm" className="rounded-full">
                        <a href={props.primaryCta?.href || "#booking"}>
                          <EditableText
                            contentKey={key("faq.primaryCta.label")}
                            value={props.primaryCta?.label || ""}
                            as="span"
                            showIcon={false}
                          />
                        </a>
                      </Button>
                      <Button asChild variant="outline" size="sm" className="rounded-full">
                        <a href={props.secondaryCta?.href || "mailto:hello@example.com"}>
                          <EditableText
                            contentKey={key("faq.secondaryCta.label")}
                            value={props.secondaryCta?.label || ""}
                            as="span"
                            showIcon={false}
                          />
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

type CategoryChipProps = {
  label: string
  count: number
  isActive: boolean
  onClick: () => void
}

function CategoryChip({ label, count, isActive, onClick }: CategoryChipProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={cn(
        "group inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isActive ? "border-primary/60 bg-primary/10 text-primary" : "border-border/70 text-muted-foreground hover:bg-muted/50",
      )}
    >
      <span>{label}</span>
      <Badge variant={isActive ? "default" : "secondary"} className="px-2 py-0 text-[11px]">
        {count}
      </Badge>
    </button>
  )
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
}

export const faqSectionConfig: ComponentConfig<FaqSectionProps> = {
  fields: {
    heading: { type: "text" },
    subheading: { type: "textarea" },
    searchPlaceholder: { type: "text" },
    allLabel: { type: "text" },
    questionsLabel: { type: "text" },
    resultLabel: { type: "text" },
    emptyMessage: { type: "text" },
    clearFiltersLabel: { type: "text" },
    stillUnsureLabel: { type: "text" },
    selectPrompt: { type: "text" },
    selectPromptTitle: { type: "text" },
    selectPromptBody: { type: "text" },
    primaryCta: {
      type: "object",
      objectFields: {
        label: { type: "text" },
        href: { type: "text" },
      },
    },
    secondaryCta: {
      type: "object",
      objectFields: {
        label: { type: "text" },
        href: { type: "text" },
      },
    },
    categories: { type: "array", arrayFields: { value: { type: "text" } } },
    items: {
      type: "array",
      arrayFields: {
        question: { type: "text" },
        answer: { type: "textarea" },
        category: { type: "text" },
      },
    },
  },
  defaultProps: {
    heading: "",
    subheading: "",
    searchPlaceholder: "",
    allLabel: "All",
    questionsLabel: "",
    resultLabel: "result",
    emptyMessage: "",
    clearFiltersLabel: "",
    stillUnsureLabel: "",
    selectPrompt: "",
    selectPromptTitle: "",
    selectPromptBody: "",
    primaryCta: { label: "", href: "" },
    secondaryCta: { label: "", href: "" },
    categories: [],
    items: [],
  },
  render: (props) => <FaqSection {...props} />,
}
