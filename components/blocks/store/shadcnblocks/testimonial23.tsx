"use client"

import type { ComponentConfig } from "@measured/puck"
import { BadgeCheck, ChevronRight, Clock, MessageSquareCode } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { ShadcnblocksContainer } from "@/components/blocks/store/shadcnblocks/shared"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type TestimonialItem = {
  id: string
  name: string
  username: string
  date: string
  avatar: string
  content: string
  verified?: "true" | "false"
}

export type ShadcnblocksTestimonial23Props = {
  badgeLabel: string
  title: string
  subtitle: string
  ctaLabel: string
  ctaSubLabel: string
  ctaHref: string
  socialIconSrc: string
  socialIconAlt: string
  testimonials: TestimonialItem[]
}

function TestimonialCard({
  testimonial,
  socialIconSrc,
  socialIconAlt,
}: {
  testimonial: TestimonialItem
  socialIconSrc: string
  socialIconAlt: string
}) {
  const isVerified = testimonial.verified !== "false"

  return (
    <Card className="relative mb-5 break-inside-avoid rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <Avatar className="h-10 w-10 rounded-full ring-1 ring-muted">
          <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{testimonial.name}</p>
            {isVerified ? <BadgeCheck className="h-4 w-4 text-primary" /> : null}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">@{testimonial.username}</p>
        </div>
        <div className="ml-auto">
          {socialIconSrc ? (
            <img src={socialIconSrc} alt={socialIconAlt} className="h-4 w-4" />
          ) : null}
        </div>
      </div>

      <div className="my-4 border-t border-dashed border-border" />

      <div className="text-sm text-foreground">
        <q>{testimonial.content}</q>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>{testimonial.date}</span>
      </div>
    </Card>
  )
}

export function ShadcnblocksTestimonial23(props: ShadcnblocksTestimonial23Props) {
  const [columnCount, setColumnCount] = useState(3)

  useEffect(() => {
    const getColumnCount = () => {
      if (typeof window === "undefined") return 3
      const width = window.innerWidth
      if (width < 768) return 1
      if (width < 1024) return 2
      return 3
    }

    const updateColumnCount = () => {
      setColumnCount(getColumnCount())
    }

    updateColumnCount()
    window.addEventListener("resize", updateColumnCount)
    return () => window.removeEventListener("resize", updateColumnCount)
  }, [])

  const reorderForColumns = (items: TestimonialItem[], columns: number) => {
    const itemsPerColumn = Math.ceil(items.length / columns)
    const reordered: TestimonialItem[] = []

    for (let col = 0; col < columns; col++) {
      for (let row = 0; row < itemsPerColumn; row++) {
        const originalIndex = row * columns + col
        if (originalIndex < items.length) {
          reordered.push(items[originalIndex])
        }
      }
    }

    return reordered
  }

  const reorderedData = useMemo(() => {
    return reorderForColumns(props.testimonials || [], columnCount)
  }, [columnCount, props.testimonials])

  return (
    <ShadcnblocksContainer>
      <section className="py-8">
        <div className="container">
          <div className="my-4 flex justify-center">
            <Badge variant="outline" className="rounded-sm py-2 shadow-md">
              <MessageSquareCode className="mr-2 size-4 text-muted-foreground" />
              <span>{props.badgeLabel}</span>
            </Badge>
          </div>

          <div className="flex flex-col items-center gap-6 px-4 sm:px-8">
            <h2 className="mb-2 text-center text-3xl font-semibold lg:text-5xl">
              {props.title}
            </h2>

            <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
              <span>{props.subtitle}</span>
            </div>
          </div>

          <div className="relative mt-14 w-full px-4 after:absolute after:inset-x-0 after:-bottom-2 after:h-96 after:bg-linear-to-t after:from-background sm:px-8 md:px-16 lg:px-32">
            <div className="columns-1 gap-5 md:columns-2 lg:columns-3">
              {reorderedData.map((testimonial) => (
                <TestimonialCard
                  key={testimonial.id}
                  testimonial={testimonial}
                  socialIconSrc={props.socialIconSrc}
                  socialIconAlt={props.socialIconAlt}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            {props.ctaHref ? (
              <Button asChild className="mt-4 gap-2 rounded-lg px-5 py-3 text-sm shadow-sm">
                <a href={props.ctaHref}>
                  <span className="flex items-center gap-1">
                    <span>{props.ctaLabel}</span>
                    <span className="text-muted-foreground/80">-</span>
                    <span className="text-muted-foreground/80">{props.ctaSubLabel}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/80" />
                </a>
              </Button>
            ) : (
              <Button className="mt-4 gap-2 rounded-lg px-5 py-3 text-sm shadow-sm">
                <span className="flex items-center gap-1">
                  <span>{props.ctaLabel}</span>
                  <span className="text-muted-foreground/80">-</span>
                  <span className="text-muted-foreground/80">{props.ctaSubLabel}</span>
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground/80" />
              </Button>
            )}
          </div>
        </div>
      </section>
    </ShadcnblocksContainer>
  )
}

export const shadcnblocksTestimonial23Config: ComponentConfig<ShadcnblocksTestimonial23Props> = {
  fields: {
    badgeLabel: { type: "text" },
    title: { type: "text" },
    subtitle: { type: "textarea" },
    ctaLabel: { type: "text" },
    ctaSubLabel: { type: "text" },
    ctaHref: { type: "text" },
    socialIconSrc: { type: "text" },
    socialIconAlt: { type: "text" },
    testimonials: {
      type: "array",
      arrayFields: {
        id: { type: "text" },
        name: { type: "text" },
        username: { type: "text" },
        date: { type: "text" },
        avatar: { type: "text" },
        content: { type: "textarea" },
        verified: {
          type: "select",
          options: [
            { label: "Verified", value: "true" },
            { label: "Unverified", value: "false" },
          ],
        },
      },
    },
  },
  defaultProps: {
    badgeLabel: "Customer Feedback",
    title: "Hear what our customers are saying",
    subtitle: "Discover how Shadcnblocks is transforming workflows across industries.",
    ctaLabel: "See More",
    ctaSubLabel: "Feedback",
    ctaHref: "#",
    socialIconSrc: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/x.svg",
    socialIconAlt: "X logo",
    testimonials: [
      {
        id: "1",
        name: "John Doe",
        username: "johndoe",
        date: "2023-10-05",
        avatar: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/avatar-1.webp",
        content:
          "This platform has completely transformed the way I manage my projects. The tools are not only intuitive but also incredibly powerful, allowing me to streamline my workflow like never before.",
        verified: "true",
      },
      {
        id: "2",
        name: "Jane Smith",
        username: "janesmith",
        date: "2023-09-30",
        avatar: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/avatar-2.webp",
        content:
          "The collaboration features are truly outstanding, allowing my team and I to work together seamlessly no matter where we are.",
        verified: "true",
      },
      {
        id: "3",
        name: "Alice Johnson",
        username: "alicej",
        date: "2023-09-25",
        avatar: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/avatar-3.webp",
        content: "The analytics are a game-changer!",
        verified: "true",
      },
      {
        id: "4",
        name: "Bob Brown",
        username: "bobbrown",
        date: "2023-09-20",
        avatar: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/avatar-4.webp",
        content:
          "I love how easy it is to integrate this platform with my existing tools. It has streamlined my workflow significantly.",
        verified: "true",
      },
    ],
  },
  render: (props) => <ShadcnblocksTestimonial23 {...props} />,
}
