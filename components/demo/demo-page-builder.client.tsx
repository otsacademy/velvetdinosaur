"use client"

import { useEffect, useMemo, useState } from "react"
import { CopyPlus, GripVertical, MoveDown, MoveUp, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"

type BuilderSection = {
  id: string
  title: string
  style: "hero" | "proof" | "feature" | "cta"
  summary: string
  accent: boolean
  callToAction?: string
}

const initialPages = {
  home: [
    {
      id: "hero",
      title: "Hero",
      style: "hero",
      summary: "Introduce the offer and point to the booking action.",
      accent: true,
      callToAction: "Book a discovery call"
    },
    {
      id: "proof",
      title: "Proof strip",
      style: "proof",
      summary: "Surface ratings, speed guarantees, and launch timelines.",
      accent: false
    },
    {
      id: "services",
      title: "Services grid",
      style: "feature",
      summary: "Outline the bespoke build, migrations, and SEO support.",
      accent: false
    },
    {
      id: "contact",
      title: "Contact CTA",
      style: "cta",
      summary: "Close with a direct founder contact block.",
      accent: true,
      callToAction: "Start your project"
    }
  ]
} satisfies Record<string, BuilderSection[]>

function moveItem<T>(items: T[], from: number, to: number) {
  const next = [...items]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export function DemoPageBuilder() {
  const [sections, setSections] = useState<BuilderSection[]>(initialPages.home)
  const [selectedId, setSelectedId] = useState(initialPages.home[0].id)

  const selectedSection = useMemo(
    () => sections.find((section) => section.id === selectedId) ?? sections[0],
    [sections, selectedId]
  )

  useEffect(() => {
    if (!sections.some((section) => section.id === selectedId)) {
      setSelectedId(sections[0]?.id ?? "")
    }
  }, [sections, selectedId])

  const moveSelected = (direction: -1 | 1) => {
    const index = sections.findIndex((section) => section.id === selectedId)
    const nextIndex = index + direction
    if (index < 0 || nextIndex < 0 || nextIndex >= sections.length) return
    setSections((current) => moveItem(current, index, nextIndex))
  }

  const duplicateSelected = () => {
    if (!selectedSection) return
    const duplicate: BuilderSection = {
      ...selectedSection,
      id: `${selectedSection.id}-${Date.now()}`,
      title: `${selectedSection.title} copy`
    }
    const index = sections.findIndex((section) => section.id === selectedSection.id)
    setSections((current) => {
      const next = [...current]
      next.splice(index + 1, 0, duplicate)
      return next
    })
    setSelectedId(duplicate.id)
  }

  const updateSelected = (patch: Partial<BuilderSection>) => {
    setSections((current) =>
      current.map((section) => (section.id === selectedId ? { ...section, ...patch } : section))
    )
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_280px]">
      <Card className="overflow-hidden p-0">
        <div className="border-b border-[var(--vd-border)] px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--vd-muted-fg)]">Section stack</p>
          <p className="mt-1 text-sm text-[var(--vd-muted-fg)]">Move sections around to reshape the page flow.</p>
        </div>
        <ScrollArea className="max-h-[760px]">
          <div className="space-y-2 p-4">
            {sections.map((section, index) => {
              const isSelected = section.id === selectedId
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setSelectedId(section.id)}
                  className={`w-full rounded-[1.25rem] border p-4 text-left transition-colors ${
                    isSelected
                      ? "border-[color-mix(in_oklch,var(--vd-primary)_22%,var(--vd-border))] bg-[color-mix(in_oklch,var(--vd-primary)_7%,var(--vd-bg))]"
                      : "border-[color-mix(in_oklch,var(--vd-border)_75%,transparent)] hover:bg-[var(--vd-muted)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--vd-muted-fg)]">
                        Block {index + 1}
                      </p>
                      <p className="font-semibold text-[var(--vd-fg)]">{section.title}</p>
                      <p className="text-sm leading-6 text-[var(--vd-muted-fg)]">{section.summary}</p>
                    </div>
                    <GripVertical className="mt-1 h-4 w-4 shrink-0 text-[var(--vd-muted-fg)]" />
                  </div>
                </button>
              )
            })}
          </div>
        </ScrollArea>
      </Card>

      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <Badge className="border-transparent bg-[color-mix(in_oklch,var(--vd-primary)_12%,var(--vd-bg))] text-[var(--vd-primary)]">
            Page flow demo
          </Badge>
          <p className="text-sm text-[var(--vd-muted-fg)]">Reordering and copy edits are local to this session only.</p>
        </div>

        <Card className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--vd-border)] px-5 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--vd-muted-fg)]">Live preview</p>
              <p className="mt-1 text-sm text-[var(--vd-muted-fg)]">A simplified landing page reflecting the current section order.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => moveSelected(-1)}>
                <MoveUp className="h-4 w-4" />
                Move up
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => moveSelected(1)}>
                <MoveDown className="h-4 w-4" />
                Move down
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={duplicateSelected}>
                <CopyPlus className="h-4 w-4" />
                Duplicate
              </Button>
            </div>
          </div>

          <div className="space-y-4 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--vd-bg)_94%,white),var(--vd-bg))] p-5">
            {sections.map((section, index) => {
              const active = section.id === selectedId
              const blockClassName =
                section.style === "hero"
                  ? "bg-[linear-gradient(145deg,color-mix(in_oklch,var(--vd-primary)_8%,var(--vd-bg)),var(--vd-bg))]"
                  : section.style === "cta"
                    ? "bg-[color-mix(in_oklch,var(--vd-primary)_6%,var(--vd-bg))]"
                    : "bg-[var(--vd-card)]"

              return (
                <section
                  key={section.id}
                  className={`rounded-[1.5rem] border p-5 transition-colors ${
                    active
                      ? "border-[color-mix(in_oklch,var(--vd-primary)_24%,var(--vd-border))] shadow-[0_20px_60px_-48px_color-mix(in_oklch,var(--vd-primary)_36%,transparent)]"
                      : "border-[var(--vd-border)]"
                  } ${blockClassName}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--vd-muted-fg)]">
                        Section {index + 1}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-[var(--vd-fg)]">{section.title}</h3>
                    </div>
                    {section.accent ? (
                      <span className="rounded-full bg-[color-mix(in_oklch,var(--vd-primary)_10%,var(--vd-bg))] px-3 py-1 text-xs font-medium text-[var(--vd-primary)]">
                        Accent band
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--vd-muted-fg)]">{section.summary}</p>
                  {section.callToAction ? (
                    <div className="mt-5">
                      <button
                        type="button"
                        className="inline-flex min-h-11 items-center justify-center rounded-[var(--vd-radius)] bg-[var(--vd-primary)] px-5 text-sm font-medium text-[var(--vd-primary-fg)]"
                      >
                        {section.callToAction}
                      </button>
                    </div>
                  ) : null}
                </section>
              )
            })}
          </div>
        </Card>
      </div>

      <Card className="space-y-5">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--vd-muted-fg)]">Inspector</p>
          <p className="text-sm text-[var(--vd-muted-fg)]">Edit the selected block copy and treatment.</p>
        </div>

        {selectedSection ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="builder-title">Section title</Label>
              <Input
                id="builder-title"
                value={selectedSection.title}
                onChange={(event) => updateSelected({ title: event.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="builder-summary">Summary</Label>
              <Input
                id="builder-summary"
                value={selectedSection.summary}
                onChange={(event) => updateSelected({ summary: event.target.value })}
              />
            </div>

            {selectedSection.callToAction ? (
              <div className="space-y-2">
                <Label htmlFor="builder-cta">Button label</Label>
                <Input
                  id="builder-cta"
                  value={selectedSection.callToAction}
                  onChange={(event) => updateSelected({ callToAction: event.target.value })}
                />
              </div>
            ) : null}

            <div className="flex items-center justify-between rounded-[1rem] border border-[var(--vd-border)] bg-[var(--vd-muted)] px-4 py-3">
              <div>
                <p className="font-medium text-[var(--vd-fg)]">Accent treatment</p>
                <p className="text-sm text-[var(--vd-muted-fg)]">Highlight this block in the page flow.</p>
              </div>
              <Switch checked={selectedSection.accent} onCheckedChange={(checked) => updateSelected({ accent: checked })} />
            </div>

            <div className="rounded-[1rem] border border-[var(--vd-border)] bg-[color-mix(in_oklch,var(--vd-primary)_4%,var(--vd-bg))] p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-4 w-4 text-[var(--vd-primary)]" />
                <p className="text-sm leading-6 text-[var(--vd-muted-fg)]">
                  This demo mirrors the editing workflow and decision-making, not the production database.
                </p>
              </div>
            </div>
          </>
        ) : null}
      </Card>
    </div>
  )
}
