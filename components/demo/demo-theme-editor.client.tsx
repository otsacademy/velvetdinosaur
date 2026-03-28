"use client"

import { useMemo, useState } from "react"
import type { CSSProperties } from "react"
import { Moon, Palette, Sun } from "lucide-react"
import { DemoHelpTooltip } from "@/components/demo/demo-help-tooltip"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"

type ThemePreset = {
  id: string
  label: string
  hue: number
  chroma: number
  contrast: number
  radius: number
}

const presets: ThemePreset[] = [
  { id: "ocean", label: "Ocean", hue: 232, chroma: 0.19, contrast: 0.18, radius: 1.3 },
  { id: "citrus", label: "Citrus", hue: 112, chroma: 0.16, contrast: 0.16, radius: 1.05 },
  { id: "ember", label: "Ember", hue: 28, chroma: 0.18, contrast: 0.2, radius: 1.45 },
  { id: "studio", label: "Studio", hue: 286, chroma: 0.2, contrast: 0.19, radius: 1.2 }
]

function formatOklch(lightness: number, chroma: number, hue: number) {
  return `oklch(${lightness.toFixed(3)} ${chroma.toFixed(3)} ${hue.toFixed(1)})`
}

function buildThemePreview(mode: "light" | "dark", hue: number, chroma: number, contrast: number, radius: number) {
  const isDark = mode === "dark"
  const background = formatOklch(isDark ? 0.18 : 0.985, isDark ? 0.015 : 0.01, hue)
  const foreground = formatOklch(isDark ? 0.94 : 0.26, isDark ? 0.015 : 0.03, hue)
  const card = formatOklch(isDark ? 0.23 : 0.995, isDark ? 0.018 : 0.012, hue)
  const cardFg = foreground
  const muted = formatOklch(isDark ? 0.28 : 0.952, isDark ? 0.02 : 0.018, hue)
  const mutedFg = formatOklch(isDark ? 0.75 : 0.48, isDark ? 0.018 : 0.022, hue)
  const border = formatOklch(isDark ? 0.36 : 0.88, chroma * 0.22, hue)
  const primary = formatOklch(isDark ? 0.74 : 0.58 + contrast * 0.08, chroma, hue)
  const primaryFg = formatOklch(isDark ? 0.18 : 0.985, 0.01, hue)
  const accent = formatOklch(isDark ? 0.68 : 0.72, chroma * 0.72, hue + 18)
  const accentFg = formatOklch(isDark ? 0.12 : 0.22, 0.02, hue)

  const vars: CSSProperties = {
    "--vd-bg": background,
    "--vd-fg": foreground,
    "--vd-card": card,
    "--vd-card-fg": cardFg,
    "--vd-muted": muted,
    "--vd-muted-fg": mutedFg,
    "--vd-border": border,
    "--vd-primary": primary,
    "--vd-primary-fg": primaryFg,
    "--vd-accent": accent,
    "--vd-accent-fg": accentFg,
    "--vd-ring": primary,
    "--vd-radius": `${radius.toFixed(2)}rem`
  } as CSSProperties

  return {
    vars,
    tokens: [
      ["--vd-bg", background],
      ["--vd-fg", foreground],
      ["--vd-primary", primary],
      ["--vd-accent", accent],
      ["--vd-border", border],
      ["--vd-radius", `${radius.toFixed(2)}rem`]
    ]
  }
}

export function DemoThemeEditor() {
  const [mode, setMode] = useState<"light" | "dark">("light")
  const [presetId, setPresetId] = useState(presets[0].id)
  const [hue, setHue] = useState(presets[0].hue)
  const [chroma, setChroma] = useState(presets[0].chroma)
  const [contrast, setContrast] = useState(presets[0].contrast)
  const [radius, setRadius] = useState(presets[0].radius)

  const preview = useMemo(
    () => buildThemePreview(mode, hue, chroma, contrast, radius),
    [mode, hue, chroma, contrast, radius]
  )

  const handlePreset = (preset: ThemePreset) => {
    setPresetId(preset.id)
    setHue(preset.hue)
    setChroma(preset.chroma)
    setContrast(preset.contrast)
    setRadius(preset.radius)
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <Card className="overflow-hidden p-0">
        <ScrollArea className="h-full max-h-[880px]">
          <div className="space-y-6 p-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--vd-muted-fg)]">
                    Theme mode
                  </p>
                  <p className="mt-1 text-sm text-[var(--vd-muted-fg)]">Switch between light and dark preview states.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-[var(--vd-muted-fg)]" />
                  <Switch checked={mode === "dark"} onCheckedChange={(checked) => setMode(checked ? "dark" : "light")} />
                  <Moon className="h-4 w-4 text-[var(--vd-muted-fg)]" />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--vd-muted-fg)]">
                  Presets
                </p>
                <p className="text-sm text-[var(--vd-muted-fg)]">Start from a mood, then tune the tokens live.</p>
              </div>
              <div className="grid gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={`flex items-center justify-between rounded-[1rem] border px-4 py-3 text-left transition-colors ${
                      presetId === preset.id
                        ? "border-[color-mix(in_oklch,var(--vd-primary)_22%,var(--vd-border))] bg-[color-mix(in_oklch,var(--vd-primary)_7%,var(--vd-bg))]"
                        : "border-[color-mix(in_oklch,var(--vd-border)_75%,transparent)] hover:bg-[var(--vd-muted)]"
                    }`}
                    onClick={() => handlePreset(preset)}
                  >
                    <span className="font-medium text-[var(--vd-fg)]">{preset.label}</span>
                    <span className="h-5 w-5 rounded-full border border-white/60" style={{ background: formatOklch(0.66, preset.chroma, preset.hue) }} />
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <Label htmlFor="theme-hue">Hue</Label>
                  <span className="text-[var(--vd-muted-fg)]">{Math.round(hue)}°</span>
                </div>
                <Slider id="theme-hue" min={0} max={360} step={1} value={[hue]} onValueChange={([value]) => setHue(value ?? hue)} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <Label htmlFor="theme-chroma">Chroma</Label>
                  <span className="text-[var(--vd-muted-fg)]">{chroma.toFixed(2)}</span>
                </div>
                <Slider
                  id="theme-chroma"
                  min={0.08}
                  max={0.24}
                  step={0.01}
                  value={[chroma]}
                  onValueChange={([value]) => setChroma(value ?? chroma)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <Label htmlFor="theme-contrast">Contrast</Label>
                  <span className="text-[var(--vd-muted-fg)]">{contrast.toFixed(2)}</span>
                </div>
                <Slider
                  id="theme-contrast"
                  min={0.12}
                  max={0.24}
                  step={0.01}
                  value={[contrast]}
                  onValueChange={([value]) => setContrast(value ?? contrast)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <Label htmlFor="theme-radius">Corner radius</Label>
                  <span className="text-[var(--vd-muted-fg)]">{radius.toFixed(2)}rem</span>
                </div>
                <Slider
                  id="theme-radius"
                  min={0.75}
                  max={1.75}
                  step={0.05}
                  value={[radius]}
                  onValueChange={([value]) => setRadius(value ?? radius)}
                />
              </div>
            </div>
          </div>
        </ScrollArea>
      </Card>

      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <Badge className="border-transparent bg-[color-mix(in_oklch,var(--vd-primary)_12%,var(--vd-bg))] text-[var(--vd-primary)]">
            OKLCH tokens
          </Badge>
          <p className="text-sm text-[var(--vd-muted-fg)]">
            This mirrors the real theme workflow, but the state is local to this page only.
          </p>
        </div>

        <div
          style={preview.vars}
          className="overflow-hidden rounded-[calc(var(--vd-radius)+0.9rem)] border border-[var(--vd-border)] bg-[var(--vd-bg)] text-[var(--vd-fg)] shadow-[0_30px_90px_-58px_color-mix(in_oklch,var(--vd-fg)_36%,transparent)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--vd-border)] bg-[color-mix(in_oklch,var(--vd-card)_92%,transparent)] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[calc(var(--vd-radius)-0.1rem)] bg-[color-mix(in_oklch,var(--vd-primary)_12%,var(--vd-bg))] text-[var(--vd-primary)]">
                <Palette className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold">Theme preview</p>
                <p className="text-sm text-[var(--vd-muted-fg)]">Changes apply instantly across the sample workspace.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DemoHelpTooltip content="Store the current token mix in this demo session so you can keep tuning from the same version.">
                <Button type="button" size="sm" variant="outline" className="border-[var(--vd-border)] bg-transparent">
                  Save draft
                </Button>
              </DemoHelpTooltip>
              <DemoHelpTooltip content="Run the theme publish step clients use without changing any live site styling outside this sandbox.">
                <button
                  type="button"
                  className="inline-flex min-h-9 items-center justify-center rounded-[var(--vd-radius)] bg-[var(--vd-primary)] px-4 text-sm font-medium text-[var(--vd-primary-fg)]"
                >
                  Publish
                </button>
              </DemoHelpTooltip>
            </div>
          </div>

          <div className="grid gap-6 p-5 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-5">
              <section className="rounded-[calc(var(--vd-radius)+0.2rem)] border border-[var(--vd-border)] bg-[linear-gradient(145deg,color-mix(in_oklch,var(--vd-primary)_8%,var(--vd-bg)),var(--vd-bg))] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--vd-muted-fg)]">Homepage hero</p>
                <h3 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight">Founder-led websites that stay easy to run after launch.</h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--vd-muted-fg)]">
                  The preview below shows how a brand palette, surfaces, and CTAs respond together when the tokens move.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center justify-center rounded-[var(--vd-radius)] bg-[var(--vd-primary)] px-5 text-sm font-medium text-[var(--vd-primary-fg)]"
                  >
                    Start project
                  </button>
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center justify-center rounded-[var(--vd-radius)] border border-[var(--vd-border)] px-5 text-sm font-medium text-[var(--vd-fg)]"
                  >
                    Explore work
                  </button>
                </div>
              </section>

              <div className="grid gap-4 md:grid-cols-3">
                {[
                  ["Lead time", "4-6 weeks"],
                  ["Support", "Founder direct"],
                  ["Performance", "100 / 100"]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[calc(var(--vd-radius)+0.15rem)] border border-[var(--vd-border)] bg-[var(--vd-card)] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--vd-muted-fg)]">{label}</p>
                    <p className="mt-3 text-xl font-semibold">{value}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {["Launch sequence", "Support retainers"].map((label, index) => (
                  <div key={label} className="rounded-[calc(var(--vd-radius)+0.15rem)] border border-[var(--vd-border)] bg-[var(--vd-card)] p-5">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{label}</p>
                      <span className="rounded-full bg-[color-mix(in_oklch,var(--vd-primary)_10%,var(--vd-bg))] px-3 py-1 text-xs font-medium text-[var(--vd-primary)]">
                        {index === 0 ? "Primary flow" : "Upsell option"}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--vd-muted-fg)]">
                      Token changes affect these supporting surfaces too, so the whole system stays coherent rather than only the buttons.
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[calc(var(--vd-radius)+0.2rem)] border border-[var(--vd-border)] bg-[var(--vd-card)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--vd-muted-fg)]">Core tokens</p>
                <div className="mt-4 space-y-3">
                  {preview.tokens.map(([name, value]) => (
                    <div key={name} className="rounded-[calc(var(--vd-radius)-0.15rem)] border border-[var(--vd-border)] bg-[color-mix(in_oklch,var(--vd-muted)_72%,transparent)] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-mono text-xs text-[var(--vd-fg)]">{name}</span>
                        <span className="h-4 w-4 rounded-full border border-white/60" style={{ background: value }} />
                      </div>
                      <p className="mt-2 break-all font-mono text-[11px] text-[var(--vd-muted-fg)]">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[calc(var(--vd-radius)+0.2rem)] border border-[var(--vd-border)] bg-[var(--vd-card)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--vd-muted-fg)]">Why prospects care</p>
                <div className="mt-4 space-y-3 text-sm leading-6 text-[var(--vd-muted-fg)]">
                  <p>They can see the brand system moving in real time rather than hearing a vague promise about flexibility.</p>
                  <p>Because this is a sandbox, you can let them push the controls without risking the live site.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
