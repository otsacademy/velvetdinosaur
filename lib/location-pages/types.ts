import type { PriceOffer } from "../price-offers"

export type LocationFaq = { question: string; answer: string }

export type LocationPageContent = {
  slug: string
  /**
   * The place, or the kind of organisation, the page is for, as someone
   * would type it into a search. It appears in the title, the headline and the
   * opening line, and a place name on another local page links here when it
   * matches exactly.
   */
  focus: string
  /** Search-facing title and description. */
  title: string
  description: string
  /** Handwritten greeting above the headline. */
  greeting: string
  /** Headline in two halves: plain, then emphasised in the pen colour. */
  headline: [string, string]
  lead: string
  /** Handwritten caption under Ian's photograph. */
  photoCaption: string
  reasons: {
    kicker: string
    title: string
    cards: Array<{ title: string; body: string }>
  }
  area: {
    kicker: string
    title: string
    paragraphs: string[]
    /** Shown as a row of place names, with a line saying what they are. */
    placesLabel: string
    places: string[]
  }
  /**
   * The price on the page's price card. Leave it out for the standard monthly
   * offer; councils get the yearly one.
   */
  offer?: PriceOffer
  /** Keys of the reviews to show (names in components/home/site-data.ts). */
  reviewNames: string[]
  faqs: LocationFaq[]
  ctaTitle: string
}
