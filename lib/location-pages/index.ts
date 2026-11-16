// Local landing pages: each is the same letter addressed to one place or one
// kind of organisation, rendered by components/home/location-page.tsx.
//
// Everything in these files has to stay true of the business: where Ian is,
// how he works and what the offer is. Do not add client names or local track
// record that the Work page and the Google reviews cannot back up. Each page
// must say something of its own about its place (lib/location-pages.test.ts
// fails on shared wording), so a new page is never a copy with the name
// swapped.
//
// Adding a page: write it here, then add app/<slug>/page.tsx, an entry in
// app/sitemap.ts and a route in tests/visual/visual.spec.ts.

import { BURFORD_PAGE } from "./burford"
import { CARTERTON_PAGE } from "./carterton"
import { CHARITIES_PAGE } from "./charities"
import { CHIPPING_NORTON_PAGE } from "./chipping-norton"
import { EYNSHAM_PAGE } from "./eynsham"
import { OXFORDSHIRE_PAGE } from "./oxfordshire"
import { PARISH_COUNCILS_PAGE } from "./parish-councils"
import type { LocationPageContent } from "./types"
import { WITNEY_PAGE } from "./witney"
import { WOODSTOCK_PAGE } from "./woodstock"

export type { LocationFaq, LocationPageContent } from "./types"
export {
  BURFORD_PAGE,
  CARTERTON_PAGE,
  CHARITIES_PAGE,
  CHIPPING_NORTON_PAGE,
  EYNSHAM_PAGE,
  OXFORDSHIRE_PAGE,
  PARISH_COUNCILS_PAGE,
  WITNEY_PAGE,
  WOODSTOCK_PAGE,
}

export const LOCATION_PAGES: LocationPageContent[] = [
  WITNEY_PAGE,
  OXFORDSHIRE_PAGE,
  CARTERTON_PAGE,
  BURFORD_PAGE,
  EYNSHAM_PAGE,
  WOODSTOCK_PAGE,
  CHIPPING_NORTON_PAGE,
  CHARITIES_PAGE,
  PARISH_COUNCILS_PAGE,
]

/** Where a place name on one page links: that place's own page, if it has one. */
export function placeHref(place: string, currentSlug: string): string | undefined {
  const page = LOCATION_PAGES.find((candidate) => candidate.focus === place)
  return page && page.slug !== currentSlug ? `/${page.slug}` : undefined
}
