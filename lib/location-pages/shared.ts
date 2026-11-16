import type { LocationFaq } from "./types"

// Answers that describe the offer itself, so they read the same on every
// local page. Keep them in step with the price card and the agreement.

export const PRICE_ANSWER =
  "£99 a month with everything included: design, build, hosting, updates, support and small content changes. There is no setup fee. The minimum term is twelve months, paid monthly, and after that it rolls on with thirty days’ notice."

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
