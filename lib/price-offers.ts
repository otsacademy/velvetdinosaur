// The prices the site shows on its price card. The monthly offer is the
// standard one. Parish and town councils budget and pay once a year, so they
// get a yearly offer instead (agreed by Ian on 17 November 2026).
// £480 is for a parish council or a small town council. A large town council
// is priced by the size of its site (agreed by Ian on 19 November 2026).
//
// Keep these in step with the agreement (app/agreement/agreement-content.ts,
// sections 3 and 20) and with the price answers in lib/location-pages/shared.ts.

export type PriceOffer = {
  /** The figure in large type, such as "£99". */
  amount: string
  /** The line under the figure. */
  period: string
  /** The short terms listed under the price. */
  terms: readonly string[]
}

export const MONTHLY_OFFER: PriceOffer = {
  amount: "£99",
  period: "a month, everything included",
  terms: ["No setup fee", "12-month minimum, paid monthly", "Then rolling, with 30 days’ notice"],
}

export const COUNCIL_OFFER: PriceOffer = {
  amount: "£480",
  period: "a year, everything included",
  terms: [
    "No setup fee",
    "Invoiced once a year, in advance",
    "Renews yearly unless you give 30 days’ notice",
    "Larger town councils are priced by size",
  ],
}
