import type { ReactNode } from "react"
import { Check, Plus, Star } from "lucide-react"

import { cn } from "@/lib/utils"

// Shared building blocks for the Letter design (see app/letter.css for the
// tokens). Colours come from tokens only: primary is the navy, accent is the
// terracotta "pen", muted-foreground is the softer ink used for body copy.

export const HOME_CONTAINER = "mx-auto w-full max-w-[1240px] px-6 sm:px-8"

/** The measure the letter itself is written in. */
export const LETTER_COLUMN = "mx-auto w-full max-w-[720px]"

/** Small capital labels. `vd-label` keeps label-styled headings in the sans. */
export const HOME_KICKER =
  "vd-label text-[13px] font-bold uppercase leading-normal tracking-[0.15em]"

/** Handwritten greetings, captions and margin notes. */
export const LETTER_HAND = "font-hand font-semibold leading-none text-accent"

export const LETTER_H1 =
  "m-0 text-balance text-[clamp(2.625rem,5.5vw,5rem)] leading-[1.02] tracking-[-0.022em]"

/** Headline for the inner pages, a step down from the home page's. */
export const LETTER_PAGE_H1 =
  "m-0 text-balance text-[clamp(2.5rem,5vw,4.375rem)] leading-[1.04] tracking-[-0.022em]"

export const LETTER_H2 =
  "m-0 text-balance text-[clamp(2.125rem,3.6vw,3.125rem)] leading-[1.08] tracking-[-0.018em]"

export const LETTER_H3 = "m-0 text-[27px] leading-[1.15] tracking-[-0.01em] sm:text-[29px]"

export const LETTER_LEAD =
  "m-0 text-pretty text-[19px] leading-[1.55] text-muted-foreground sm:text-[21px]"

/** The emphasised half of a headline, in the pen colour. */
export const LETTER_EM = "italic text-accent"

/** Quiet asides under a step, set in the serif italic. */
export const LETTER_ASIDE = "font-serif text-[19px] italic leading-[1.5] text-foreground"

export const LETTER_LINK =
  "font-semibold text-primary underline decoration-highlight decoration-2 underline-offset-4 transition-[text-decoration-color] duration-200 hover:text-primary hover:decoration-primary"

const BTN_BASE =
  "inline-flex items-center justify-center gap-2.5 rounded-full text-center font-semibold transition-[transform,box-shadow,filter] duration-[250ms] ease-[var(--vd-hover-ease)] hover:-translate-y-0.5 hover:shadow-[var(--vd-shadow-primary)] hover:brightness-110 motion-reduce:transition-none motion-reduce:hover:translate-y-0"

export const HOME_BTN_PRIMARY = `${BTN_BASE} bg-primary text-primary-foreground hover:text-primary-foreground`

/** The white button used on navy panels. */
export const HOME_BTN_LIGHT = `${BTN_BASE} bg-card text-foreground hover:text-foreground`

export const HOME_BTN_OUTLINE =
  "inline-flex items-center justify-center gap-2.5 rounded-full border-[1.5px] border-foreground bg-transparent text-center font-semibold text-foreground transition-colors duration-200 hover:bg-foreground hover:text-background"

export const BTN_LG = "min-h-[58px] px-[30px] py-2 text-[19px]"
export const BTN_MD = "min-h-[46px] px-[22px] py-1.5 text-base"

export const HOME_CARD = "rounded-lg border border-border bg-card"

export const HOME_CARD_HOVER =
  "transition-[transform,box-shadow] duration-[350ms] ease-[var(--vd-hover-ease)] hover:-translate-y-1 hover:shadow-[var(--vd-shadow-lift)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"

export const HOME_FIELD =
  "min-h-[50px] w-full rounded-md border-[1.5px] border-input bg-card px-3.5 text-[17px] text-foreground transition-[border-color,box-shadow] duration-200 placeholder:text-[var(--vd-placeholder)] focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 disabled:opacity-60"

export const HOME_FIELD_LABEL = "text-[15px] font-semibold text-foreground"

/** A row of five filled stars, announced once as a rating. */
export function Stars({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <span role="img" aria-label="5 out of 5 stars" className={cn("flex gap-1 text-star", className)}>
      {[0, 1, 2, 3, 4].map((index) => (
        <Star key={index} aria-hidden width={size} height={size} className="fill-current" />
      ))}
    </span>
  )
}

/** The plus that turns into a cross when a <details> opens (needs `group`). */
export function PlusMark({ size = 36 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-flex flex-none items-center justify-center rounded-full border-[1.5px] border-primary text-primary transition-[transform,background-color,color] duration-[250ms] group-open:rotate-45 group-open:bg-primary group-open:text-primary-foreground motion-reduce:transition-none"
      style={{ width: size, height: size }}
    >
      <Plus width={size / 2} height={size / 2} strokeWidth={2.4} />
    </span>
  )
}

/** A ticked line in a list of what is included. */
export function CheckItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <li className={cn("flex gap-3", className)}>
      <Check
        aria-hidden
        width={22}
        height={22}
        strokeWidth={2.4}
        className="mt-1 flex-none text-primary"
      />
      <span>{children}</span>
    </li>
  )
}

/** Label, headline and opening paragraph that start each part of a page. */
export function SectionIntro({
  kicker,
  title,
  children,
  className,
}: {
  kicker: string
  title: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <div data-reveal className={cn(LETTER_COLUMN, className)}>
      <p className={`${HOME_KICKER} m-0 mb-3 text-accent`}>{kicker}</p>
      <h2 className={LETTER_H2}>{title}</h2>
      {children ? <p className={`${LETTER_LEAD} mt-[22px]`}>{children}</p> : null}
    </div>
  )
}

/** Hero block shared by the inner pages: label, headline and lead paragraph. */
export function PageIntro({
  kicker,
  title,
  children,
  className,
}: {
  kicker: string
  title: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <section className={cn(`${HOME_CONTAINER} pt-14 sm:pt-[76px]`, className)}>
      <p className={`${HOME_KICKER} m-0 mb-3 text-accent`}>{kicker}</p>
      <h1 className={`${LETTER_PAGE_H1} max-w-[900px]`}>{title}</h1>
      {children ? <p className={`${LETTER_LEAD} mt-[22px] max-w-[640px]`}>{children}</p> : null}
    </section>
  )
}

export const SCORE_LABELS = ["Performance", "Accessibility", "Best practices", "SEO"] as const

/** The four Google Lighthouse scores, as cells of a ruled strip. */
export function ScoreCells({ value }: { value: number }) {
  return (
    <>
      {SCORE_LABELS.map((label) => (
        <div key={label} className="bg-card px-6 py-7 sm:px-8">
          <div className="font-serif text-[40px] font-medium leading-none text-accent">{value}</div>
          <div className="mt-2 text-[15px] leading-snug text-muted-foreground">
            {label}, Google Lighthouse
          </div>
        </div>
      ))}
    </>
  )
}
