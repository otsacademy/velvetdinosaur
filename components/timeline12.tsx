"use client"

import Image from "next/image"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

export interface Timeline12Item {
  id: string
  phase: string
  title: string
  date: string
  heading: string
  description: string
  imageSrc: string
  imageAlt: string
}

interface Timeline12Props {
  className?: string
  items: Timeline12Item[]
}

export function Timeline12({ className, items }: Timeline12Props) {
  if (items.length === 0) {
    return null
  }

  return (
    <div className={cn("w-full", className)}>
      <ol className="relative grid gap-4 md:gap-5 lg:grid-cols-2">
        {items.map((item, index) => (
          <motion.li
            key={item.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.35, delay: index * 0.06 }}
            className="rounded-2xl border border-border bg-card/85 p-4 backdrop-blur-sm"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-primary/30 bg-background text-xs font-semibold text-foreground">
                  {item.phase}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{item.date}</p>
                </div>
              </div>
            </div>

            <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
              <div className="space-y-2">
                <h4 className="text-lg font-semibold tracking-tight text-foreground">{item.heading}</h4>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </div>
              <Card className="overflow-hidden rounded-xl border border-border bg-background p-0">
                <CardContent className="relative mt-0 aspect-[16/10] p-0">
                  <Image
                    src={item.imageSrc}
                    alt={item.imageAlt}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 768px) 100vw, 180px"
                  />
                </CardContent>
              </Card>
            </div>
          </motion.li>
        ))}
      </ol>
    </div>
  )
}
