"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import type { ComponentConfig } from "@measured/puck"
import { Star } from "lucide-react"

import { EditableText } from "@/components/demo/editable"
import { demoKey } from "@/components/demo/demo-helpers"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Section, SectionHeading } from "@/components/ui/section"
import { AnimatedSection } from "@/components/ui/animated-section"
import type { Review } from "@/lib/content/types"
import { cn } from "@/lib/utils"

type TestimonialItem = {
  quote: string
  name: string
  roleOrContext: string
  org?: string
  outcome?: string
  websiteUrl?: string
  rating?: number
  source?: "google" | "manual"
  avatar?: string
  dateLabel?: string
}

type RenderItem = TestimonialItem & {
  id: string
  editable: boolean
  index?: number
}

export type TestimonialsSectionProps = {
  id?: string
  heading: string
  outcomeLabel: string
  items: TestimonialItem[]
  showGoogleReviews?: boolean | "true" | "false"
  reviewsLimit?: number
}

const DEFAULT_REVIEWS_LIMIT = 6

function normalizeRating(value?: number) {
  if (typeof value !== "number") return undefined
  const rounded = Math.round(value)
  return Math.max(0, Math.min(5, rounded))
}

function getInitial(value?: string) {
  if (!value) return "?"
  return value.trim().charAt(0).toUpperCase()
}

function mapGoogleReview(review: Review, index: number): RenderItem | null {
  const quote = review.content?.trim()
  const rating = normalizeRating(review.rating)
  const message = quote || (rating ? `Rated ${rating} out of 5 on Google.` : "")
  if (!message) return null
  return {
    id: `google-${review.slug || index}`,
    quote: message,
    name: review.author || "Google reviewer",
    roleOrContext: review.role || "Google review",
    rating,
    avatar: review.avatar,
    dateLabel: review.dateLabel,
    source: "google",
    editable: false,
  }
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 text-primary" aria-label={`${rating} star rating`}>
      {[...Array(5)].map((_, index) => (
        <Star
          key={index}
          className={cn(
            "h-3.5 w-3.5",
            index < rating ? "fill-current" : "text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  )
}

export function TestimonialsSection(props: TestimonialsSectionProps) {
  const key = (path: string) => demoKey(props.id, path)
  const testimonials = props.items || []
  const filteredTestimonials = useMemo(
    () =>
      testimonials
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => {
          const hasOrg = Boolean(item.org?.trim())
          const hasName = Boolean(item.name?.trim())
          const hasOutcome = Boolean(item.outcome?.trim())
          return hasOrg && (hasName || hasOutcome)
        }),
    [testimonials]
  )
  const manualItems = useMemo<RenderItem[]>(
    () =>
      filteredTestimonials.map(({ item, index }) => ({
        ...item,
        id: `manual-${index}`,
        source: "manual",
        editable: true,
        index,
      })),
    [filteredTestimonials]
  )

  const showGoogleReviews =
    props.showGoogleReviews === false || props.showGoogleReviews === "false" ? false : true
  const reviewsLimit = Math.max(1, Math.min(props.reviewsLimit || DEFAULT_REVIEWS_LIMIT, 12))
  const [googleItems, setGoogleItems] = useState<RenderItem[]>([])

  useEffect(() => {
    if (!showGoogleReviews) {
      setGoogleItems([])
      return
    }

    let active = true
    const controller = new AbortController()

    const load = async () => {
      try {
        const res = await fetch("/api/content/reviews?source=google", {
          cache: "no-store",
          signal: controller.signal,
        })
        if (!res.ok) return
        const data = (await res.json()) as { reviews?: Review[] }
        const items = (data.reviews || [])
          .map((review, index) => mapGoogleReview(review, index))
          .filter(Boolean) as RenderItem[]
        if (active) {
          setGoogleItems(items.slice(0, reviewsLimit))
        }
      } catch {
        if (active) {
          setGoogleItems([])
        }
      }
    }

    void load()

    return () => {
      active = false
      controller.abort()
    }
  }, [reviewsLimit, showGoogleReviews])

  const items = [...manualItems, ...googleItems]

  if (!items.length) return null

  return (
    <Section id="testimonials" className="bg-muted/30" animate divider>
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
            <path d="m10 9-3 3 3 3" />
            <path d="m14 15 3-3-3-3" />
            <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />
          </svg>
          <EditableText demoKey={key("testimonials.heading")} value={props.heading} as="span" showIcon={false} />
        </span>
      </SectionHeading>
      <AnimatedSection animation="fade-up" staggerChildren staggerDelay={100} className="grid gap-6 md:grid-cols-2">
        {items.map((item) => {
          const editable = item.editable && typeof item.index === "number"
          const quote = editable ? (
            <EditableText
              demoKey={key(`testimonials.items.${item.index}.quote`)}
              value={item.quote}
              as="span"
              multiline
              showIcon={false}
            />
          ) : (
            item.quote
          )
          const name = editable ? (
            <EditableText
              demoKey={key(`testimonials.items.${item.index}.name`)}
              value={item.name}
              as="span"
              showIcon={false}
            />
          ) : (
            item.name
          )
          const roleOrContext = editable ? (
            <EditableText
              demoKey={key(`testimonials.items.${item.index}.roleOrContext`)}
              value={item.roleOrContext}
              as="span"
              multiline
              showIcon={false}
            />
          ) : (
            item.roleOrContext
          )

          return (
            <Card key={item.id} className="bg-background border-border shadow-none">
              <CardHeader className="gap-4">
                {item.source === "google" ? (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted text-foreground flex items-center justify-center text-xs font-semibold overflow-hidden">
                        {item.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.avatar} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          <span>{getInitial(item.name)}</span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
                          Google review
                        </p>
                        {item.dateLabel ? (
                          <p className="text-xs text-muted-foreground">{item.dateLabel}</p>
                        ) : null}
                      </div>
                    </div>
                    {item.rating ? <RatingStars rating={item.rating} /> : null}
                  </div>
                ) : null}
                <CardDescription className="text-sm text-muted-foreground">
                  &ldquo;{quote}&rdquo;
                </CardDescription>
                <div className="space-y-1">
                  <CardTitle className="text-base text-foreground">{name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{roleOrContext}</p>
                  {item.org ? (
                    <p className="text-sm text-muted-foreground">
                      {editable ? (
                        <EditableText
                          demoKey={key(`testimonials.items.${item.index}.org`)}
                          value={item.org}
                          as="span"
                          showIcon={false}
                        />
                      ) : (
                        item.org
                      )}
                    </p>
                  ) : null}
                  {item.outcome ? (
                    <p className="text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
                      {editable ? (
                        <EditableText
                          demoKey={key("testimonials.outcomeLabel")}
                          value={props.outcomeLabel}
                          as="span"
                          showIcon={false}
                        />
                      ) : (
                        props.outcomeLabel
                      )}{" "}
                      <span className="normal-case tracking-normal">
                        {editable ? (
                          <EditableText
                            demoKey={key(`testimonials.items.${item.index}.outcome`)}
                            value={item.outcome}
                            as="span"
                            showIcon={false}
                          />
                        ) : (
                          item.outcome
                        )}
                      </span>
                    </p>
                  ) : null}
                  {item.websiteUrl ? (
                    <Link
                      href={item.websiteUrl}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {editable ? (
                        <EditableText
                          demoKey={key(`testimonials.items.${item.index}.websiteUrl`)}
                          value={item.websiteUrl}
                          as="span"
                          showIcon={false}
                        />
                      ) : (
                        item.websiteUrl
                      )}
                    </Link>
                  ) : null}
                </div>
              </CardHeader>
            </Card>
          )
        })}
      </AnimatedSection>
    </Section>
  )
}

export const testimonialsSectionConfig: ComponentConfig<TestimonialsSectionProps> = {
  fields: {
    heading: { type: "text" },
    outcomeLabel: { type: "text" },
    showGoogleReviews: {
      type: "select",
      options: [
        { label: "Show Google reviews", value: "true" },
        { label: "Hide Google reviews", value: "false" },
      ],
    },
    reviewsLimit: { type: "number" },
    items: {
      type: "array",
      arrayFields: {
        quote: { type: "textarea" },
        name: { type: "text" },
        roleOrContext: { type: "textarea" },
        org: { type: "text" },
        outcome: { type: "text" },
        websiteUrl: { type: "text" },
      },
    },
  },
  defaultProps: {
    heading: "",
    outcomeLabel: "",
    items: [],
    showGoogleReviews: true,
    reviewsLimit: DEFAULT_REVIEWS_LIMIT,
  },
  render: (props) => <TestimonialsSection {...props} />,
}
