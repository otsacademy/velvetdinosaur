import { CTA_TITLE, PRICE_FAQ, TIMING_FAQ } from "./shared"
import type { LocationPageContent } from "./types"

export const CHIPPING_NORTON_PAGE: LocationPageContent = {
  slug: "web-design-chipping-norton",
  focus: "Chipping Norton",
  title: "Web design in Chipping Norton, built before you pay | Velvet Dinosaur",
  description:
    "Web designer near Witney for Chipping Norton businesses, clubs and groups. Your website is built first, so you see it before you pay. Hosting and support included.",
  greeting: "Hello, Chipping Norton,",
  headline: ["Web design in Chipping Norton,", "built before you pay."],
  lead: "I’m Ian. I run Velvet Dinosaur from Minster Lovell, near Witney, south of Chipping Norton. I build websites for market town businesses, trades, clubs and community groups, and you see your finished site working before you pay anything.",
  photoCaption: "Down the road, near Witney.",
  reasons: {
    kicker: "Why it suits Chipping Norton",
    title: "For a market town with plenty going on.",
    cards: [
      {
        title: "Events, tickets and news",
        body: "Your site can list events, take registrations and send a newsletter, so people know what is on, sign up and hear about the next one.",
      },
      {
        title: "Found in town and around it",
        body: "Chipping Norton serves a wide spread of villages. A fast site that says clearly what you do and where helps people from all of them find you.",
      },
      {
        title: "Close enough to meet",
        body: "Chipping Norton is further from me than Witney, but still an easy drive. I’m happy to come up and go through your preview with you in person.",
      },
    ],
  },
  area: {
    kicker: "Where I am",
    title: "Minster Lovell, south of Chipping Norton.",
    paragraphs: [
      "I work from my home in Minster Lovell, near Witney. Most of the work happens online, so the distance never slows anything down, and when it helps to sit down together, I come to you.",
      "I build for the organisations a market town runs on: independent shops, trades, venues, clubs, societies and the volunteers who keep them going.",
    ],
    placesLabel: "Around Chipping Norton",
    places: [
      "Chipping Norton",
      "Over Norton",
      "Churchill",
      "Kingham",
      "Hook Norton",
      "Enstone",
      "Charlbury",
      "Long Compton",
    ],
  },
  reviewNames: ["Faye Taylor", "Lynn Casey", "Michal Apollo"],
  faqs: [
    {
      question: "Is Chipping Norton too far for you?",
      answer:
        "No. It is an easy drive from Minster Lovell, and I’m happy to come to you. We can also do everything by phone, WhatsApp, email or video call if that suits you better.",
    },
    PRICE_FAQ,
    TIMING_FAQ,
    {
      question: "Can the site list our events and take sign-ups?",
      answer:
        "Yes. Events and registrations, news and an email newsletter can all be part of your site. People see what is on and sign up online, and you can email them about the next one.",
    },
    {
      question: "What if the preview isn’t right?",
      answer:
        "Then you say no and pay nothing. You have fourteen days to try your preview, and if it isn’t what you need, it is deleted.",
    },
  ],
  ctaTitle: CTA_TITLE,
}
