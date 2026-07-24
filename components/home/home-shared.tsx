import type { ReactNode } from "react"

export const HOME_CONTAINER = "mx-auto w-full max-w-6xl px-6 md:px-10"

export const HOME_MONO = "[font-family:var(--font-space-mono,var(--vd-font-mono))]"

export const HOME_CARD =
  "rounded-lg border border-border bg-background shadow-[var(--vd-shadow-xs)]"

export const HOME_CARD_HOVER =
  "transition-[transform,box-shadow,border-color] duration-300 ease-[var(--vd-hover-ease)] hover:-translate-y-1 hover:border-primary hover:shadow-[var(--vd-shadow-primary)]"

export const HOME_BTN_PRIMARY =
  "inline-flex items-center justify-center rounded-md bg-primary font-semibold text-primary-foreground transition-[transform,box-shadow,background-color] duration-300 ease-[var(--vd-hover-ease)] hover:-translate-y-px hover:bg-[var(--vd-primary-hover)] hover:text-primary-foreground hover:shadow-[var(--vd-shadow-primary)]"

export const HOME_BTN_OUTLINE =
  "inline-flex items-center justify-center rounded-md border-[1.5px] border-border bg-background font-semibold text-foreground transition-colors duration-300 hover:border-primary hover:text-primary"

export const SCORE_LABELS = ["Performance", "Accessibility", "Best practices", "SEO"] as const

export function ScoreCells({ value }: { value: number }) {
  return (
    <>
      {SCORE_LABELS.map((label) => (
        <div key={label} className="bg-muted px-6 py-6 md:px-8">
          <div className={`${HOME_MONO} text-2xl font-bold text-primary`}>{value}</div>
          <div className="mt-1 text-[12.5px] text-muted-foreground">
            {label} — Google Lighthouse
          </div>
        </div>
      ))}
    </>
  )
}

export function SectionHeading({
  index,
  title,
  aside,
}: {
  index: string
  title: string
  aside?: ReactNode
}) {
  return (
    <div className="mb-7 flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
      <span className={`${HOME_MONO} text-xs text-primary`}>{index}</span>
      <h2 className="text-2xl font-bold tracking-tight md:text-[26px]">{title}</h2>
      {aside ? <div className="ms-auto">{aside}</div> : null}
    </div>
  )
}
