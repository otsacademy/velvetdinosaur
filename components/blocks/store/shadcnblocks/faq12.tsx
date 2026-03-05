"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { ComponentConfig } from "@measured/puck"

import { cn } from "@/lib/utils"
import { ShadcnblocksContainer } from "@/components/blocks/store/shadcnblocks/shared"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"

type FAQItem = {
  question: string
  answer: string
}

type FAQCategory = {
  title: string
  items: FAQItem[]
}

export type ShadcnblocksFaq12Props = {
  heading: string
  description: string
  categories: FAQCategory[]
}

const TOP_PADDING = 300

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
}

export function ShadcnblocksFaq12(props: ShadcnblocksFaq12Props) {
  const categories = useMemo(() => props.categories || [], [props.categories])
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.title || "")
  const observerRef = useRef<IntersectionObserver | null>(null)
  const isScrollingRef = useRef(false)
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    if (!activeCategory && categories.length) {
      setActiveCategory(categories[0].title)
    }
  }, [categories, activeCategory])

  const setupObserver = useCallback(() => {
    observerRef.current?.disconnect()

    let debounceTimeout: NodeJS.Timeout

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return

        if (debounceTimeout) {
          clearTimeout(debounceTimeout)
        }

        debounceTimeout = setTimeout(() => {
          const intersectingEntries = entries.filter((entry) => entry.isIntersecting)

          const entry = intersectingEntries.reduce(
            (closest, current) => {
              const rect = current.boundingClientRect
              const distanceFromThreshold = Math.abs(rect.top - TOP_PADDING)
              const closestDistance = closest
                ? Math.abs(closest.boundingClientRect.top - TOP_PADDING)
                : Infinity

              return distanceFromThreshold < closestDistance ? current : closest
            },
            null as IntersectionObserverEntry | null,
          )

          if (entry) {
            const category = entry.target.getAttribute("data-category")
            if (category) {
              setActiveCategory(category)
            }
          }
        }, 150)
      },
      {
        root: null,
        rootMargin: `-${TOP_PADDING}px 0px -100% 0px`,
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    )

    Object.entries(categoryRefs.current).forEach(([category, element]) => {
      if (element) {
        element.setAttribute("data-category", category)
        observerRef.current?.observe(element)
      }
    })

    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout)
      }
    }
  }, [])

  useEffect(() => {
    const cleanup = setupObserver()
    return () => {
      cleanup()
      observerRef.current?.disconnect()
    }
  }, [setupObserver])

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category)
    isScrollingRef.current = true

    const element = document.getElementById(`faq-${slugify(category)}`)
    if (element) {
      element.style.scrollMargin = `${TOP_PADDING}px`
      element.scrollIntoView({ behavior: "smooth", block: "start" })

      setTimeout(() => {
        isScrollingRef.current = false
      }, 1000)
    }
  }

  if (!categories.length) return null

  return (
    <ShadcnblocksContainer>
      <section className={cn("bg-muted/30 py-8")}> 
        <div className="container max-w-4xl">
          <div className="text-center">
            <h1 className="text-center text-4xl font-semibold tracking-tight sm:text-5xl">
              {props.heading}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-center text-balance text-muted-foreground">
              {props.description}
            </p>
          </div>

          <div className="mt-8 grid max-w-5xl gap-8 md:mt-12 md:grid-cols-[200px_1fr] md:gap-12 lg:mt-16">
            <div className="sticky top-24 flex h-fit flex-col gap-4 max-md:hidden">
              {categories.map((category) => (
                <Button
                  variant="ghost"
                  key={category.title}
                  onClick={() => handleCategoryClick(category.title)}
                  className={`justify-start text-left text-xl transition-colors ${
                    activeCategory === category.title
                      ? "font-semibold"
                      : "font-normal hover:opacity-75"
                  }`}
                >
                  {category.title}
                </Button>
              ))}
            </div>

            <div className="space-y-6">
              {categories.map((category) => (
                <div
                  key={category.title}
                  id={`faq-${slugify(category.title)}`}
                  ref={(el) => {
                    categoryRefs.current[category.title] = el
                  }}
                  className={cn(
                    "rounded-xl px-6",
                    activeCategory === category.title ? "bg-background" : "bg-background/40",
                  )}
                  style={{ scrollMargin: `${TOP_PADDING}px` }}
                >
                  <Accordion
                    type="single"
                    collapsible
                    defaultValue={`${categories[0]?.title}-0`}
                    className="w-full"
                  >
                    {(category.items || []).map((item, i) => (
                      <AccordionItem
                        key={`${category.title}-${i}`}
                        value={`${category.title}-${i}`}
                        className="border-b border-muted last:border-0"
                      >
                        <AccordionTrigger className="text-base font-medium hover:no-underline">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-base font-medium text-muted-foreground">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </ShadcnblocksContainer>
  )
}

export const shadcnblocksFaq12Config: ComponentConfig<ShadcnblocksFaq12Props> = {
  fields: {
    heading: { type: "text" },
    description: { type: "textarea" },
    categories: {
      type: "array",
      arrayFields: {
        title: { type: "text" },
        items: {
          type: "array",
          arrayFields: {
            question: { type: "text" },
            answer: { type: "textarea" },
          },
        },
      },
    },
  },
  defaultProps: {
    heading: "We've got answers",
    description:
      "This really should be an LLM but we're waiting for RAG to truly reach commodity stage before we touch it.",
    categories: [
      {
        title: "Support",
        items: [
          {
            question: "Is there a free version?",
            answer:
              "Yes! We offer a generous free plan with just enough features except that one feature you really want!",
          },
          {
            question: "Is support free, or do I need to Perplexity everything?",
            answer:
              "We pride ourselves on our comprehensive support system. Our chatbot will happily redirect you to our documentation.",
          },
          {
            question: "What if I need immediate assistance?",
            answer:
              "Our AI support team will get back to you in approximately 3-5 business years.",
          },
        ],
      },
      {
        title: "Account",
        items: [
          {
            question: "How do I update my account without breaking my laptop?",
            answer:
              "Our platform is designed to be extremely user-friendly. Just follow our simple 47-step process, and you should be fine!",
          },
          {
            question: "What happens if I forget my password?",
            answer: "You'll need to solve three riddles and defeat a dragon.",
          },
        ],
      },
      {
        title: "Security",
        items: [
          {
            question: "How secure is my data?",
            answer:
              "We use military-grade encryption, but our password is \"password123\".",
          },
          {
            question: "Do you have a backup system?",
            answer:
              "Yes, we back up everything to a USB stick that we keep in a very safe place... somewhere.",
          },
        ],
      },
    ],
  },
  render: (props) => <ShadcnblocksFaq12 {...props} />,
}
