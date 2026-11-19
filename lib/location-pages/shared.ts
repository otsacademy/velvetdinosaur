import type { LocationFaq } from "./types"

// Answers that describe the offer itself, so they read the same on every
// local page. Keep them in step with the price card and the agreement.

export const PRICE_ANSWER =
  "£99 a month with everything included: design, build, hosting, updates, support and small content changes. There is no setup fee. The minimum term is twelve months, paid monthly, and after that it rolls on with thirty days’ notice."

// Parish and town councils pay yearly (lib/price-offers.ts, COUNCIL_OFFER).
// A large town council is priced by the size of its site (Ian agreed on
// 19 November 2026): the last two sentences say so, and so does section 20
// of the agreement.
export const COUNCIL_PRICE_ANSWER =
  "£480 a year with everything included: design, build, hosting, updates, support and small content changes. There is no setup fee, and nothing is invoiced until the council has seen its site and agreed to go ahead. The council then receives one invoice a year, in advance. After the first year the service renews each year, and the council can stop it by giving thirty days’ notice before the renewal date. This is the price for a parish council or a small town council. A larger council with several committees is priced by the size of its site."

export const PRICE_FAQ: LocationFaq = {
  question: "How much does a website cost?",
  answer: PRICE_ANSWER,
}

export const TIMING_FAQ: LocationFaq = {
  question: "How long does it take?",
  answer:
    "Most previews are ready within one to two weeks. You then have fourteen days to try yours. If you go ahead, the site is ready to launch within seven days, provided I have your feedback, content and domain access.",
}

export const CTA_TITLE = "Shall I make a start on yours?"
