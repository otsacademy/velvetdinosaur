import { CTA_TITLE, PRICE_FAQ, TIMING_FAQ } from "./shared"
import type { LocationPageContent } from "./types"

export const CARTERTON_PAGE: LocationPageContent = {
  slug: "web-design-carterton",
  focus: "Carterton",
  title: "Web design in Carterton, built before you pay | Velvet Dinosaur",
  description:
    "Web designer in Minster Lovell, a short drive from Carterton. I build your new website first, so you see it working before you pay. Hosting and support included.",
  greeting: "Hello, Carterton,",
  headline: ["Web design in Carterton,", "built before you pay."],
  lead: "I’m Ian. I run Velvet Dinosaur from Minster Lovell, a few miles north-east of Carterton. I design, build and look after websites for local businesses, trades, clubs and charities, and you see your finished site working before you pay anything.",
  photoCaption: "Only a few miles away.",
  reasons: {
    kicker: "Why someone local",
    title: "Help from a few miles up the road.",
    cards: [
      {
        title: "Found by people new to town",
        body: "New people arrive in Carterton all the time, many of them with RAF Brize Norton, and they look for local services on their phones. A fast, clear site helps them choose you.",
      },
      {
        title: "Easy to fit around your work",
        body: "I can come to your shop, workshop or office to go through your preview, or we can talk it over by phone or video call if that is quicker for you.",
      },
      {
        title: "No big bill up front",
        body: "There is no setup fee and nothing to pay for the preview. One monthly price then covers the design, hosting, updates and support.",
      },
    ],
  },
  area: {
    kicker: "Where I am",
    title: "Minster Lovell, a few miles from Carterton.",
    paragraphs: [
      "I work from my home in Minster Lovell, a short drive from Carterton. Whether you run a shop in the town centre, a trade working across West Oxfordshire or a club looking for new members, I can come and sit down with you.",
      "If you would rather not meet, we can do everything by phone, WhatsApp, email or video call. Either way you deal with me, not a call centre.",
    ],
    placesLabel: "Around Carterton",
    places: [
      "Carterton",
      "Brize Norton",
      "Alvescot",
      "Black Bourton",
      "Shilton",
      "Clanfield",
      "Bampton",
      "Witney",
    ],
  },
  reviewNames: ["Faye Taylor", "Lynn Casey", "Vikram Katoch"],
  faqs: [
    {
      question: "Will you come out to Carterton?",
      answer:
        "Yes. Carterton is a short drive from Minster Lovell, so I can meet you at your business or somewhere nearby to go through your preview. We can also work by phone, WhatsApp, email or video call.",
    },
    PRICE_FAQ,
    TIMING_FAQ,
    {
      question: "Can customers book or get in touch through the site?",
      answer:
        "Yes. Every site includes contact forms and a booking system that syncs with your Google Calendar, so customers can send an enquiry or book a time without having to phone.",
    },
    {
      question: "Will people find me on Google?",
      answer:
        "Every site is built to load fast, work well on phones and tell search engines clearly what you do and where. That is the groundwork for local search, though nobody can honestly promise you a position on Google.",
    },
  ],
  ctaTitle: CTA_TITLE,
}
