"use client"

import { ArrowRight, Building2, Globe, Sparkles, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

const STATS = [
  { value: "2018", label: "Founded", icon: Building2 },
  { value: "50+", label: "Team members", icon: Users },
  { value: "10K+", label: "Customers", icon: Sparkles },
  { value: "30+", label: "Countries", icon: Globe },
]

export default function AboutTwoColumn() {
  return (
    <section className="py-12">
      <div className="mx-auto w-[900px] max-w-full px-4">
        <div className="grid gap-10 lg:grid-cols-2 items-center">
          {/* Left column - Content */}
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">
              We&apos;re building the tools we wished existed
            </h2>

            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>
                What started as a side project in 2018 has grown into a platform trusted by
                thousands of teams worldwide. We saw how much time people wasted on repetitive tasks
                and decided to fix it.
              </p>
              <p>
                Today, we&apos;re a team of 50+ designers, engineers, and operators spread across the
                globe, united by a belief that software should feel like magic, not work.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button className="gap-2">
                Our Story
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline">Meet the Team</Button>
            </div>
          </div>

          {/* Right column - Stats with accent */}
          <div className="relative">
            <div className="absolute left-0 top-4 bottom-4 w-1 rounded-full bg-primary" />
            <div className="grid grid-cols-2 gap-4 pl-8">
              {STATS.map(stat => {
                const Icon = stat.icon
                return (
                  <div className="rounded-lg border p-5" key={stat.label}>
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
