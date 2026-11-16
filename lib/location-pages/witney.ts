import { CTA_TITLE, PRICE_FAQ, TIMING_FAQ } from "./shared"
import type { LocationPageContent } from "./types"

export const WITNEY_PAGE: LocationPageContent = {
  slug: "web-design-witney",
  focus: "Witney",
  title: "Web design in Witney, built before you pay | Velvet Dinosaur",
  description:
    "Web designer in Minster Lovell, just outside Witney. I build your new website first, so you see it before you pay. Hosting, updates and support included.",
  greeting: "Hello, neighbour,",
  headline: ["Web design in Witney,", "built before you pay."],
  lead: "I’m Ian. I run Velvet Dinosaur from Minster Lovell, a few minutes west of Witney. I design, build and look after websites for small businesses, charities and community groups, and you see your finished site before you pay a penny.",
  photoCaption: "I’m just down the road.",
  reasons: {
    kicker: "Why someone nearby",
    title: "A web designer you can actually meet.",
    cards: [
      {
        title: "We can meet in person",
        body: "I can come to you in Witney and go through your preview with you on your own screen. Phone, WhatsApp, email or a video call work just as well if you prefer.",
      },
      {
        title: "One person, start to finish",
        body: "You deal with me from the first conversation to launch and long after. No account managers, no support queue and no chatbot.",
      },
      {
        title: "You see it before you pay",
        body: "I build a working version of your website first. You get fourteen days to try it, and if it isn’t right the preview is deleted and you pay nothing.",
      },
    ],
  },
  area: {
    kicker: "Where I am",
    title: "Minster Lovell, just outside Witney.",
    paragraphs: [
      "Velvet Dinosaur is run from my home in Minster Lovell, on the Burford side of Witney. If you run a shop, a café, a trade, a clinic, a club, a charity or a parish council in or around the town, I’m close enough to sit down with you and talk it through.",
      "You don’t have to be local, though. Most of the work happens online, so I also look after websites for organisations elsewhere in the UK.",
    ],
    placesLabel: "Easy for me to reach",
    places: ["Witney", "Minster Lovell", "Carterton", "Burford", "Eynsham", "Bampton", "Woodstock"],
  },
  reviewNames: ["Faye Taylor", "Lynn Casey", "Michal Apollo"],
  faqs: [
    {
      question: "Can we meet face to face?",
      answer:
        "Yes. I’m in Minster Lovell, so Witney and the villages around it are easy for me to reach. We can also work by email, phone, WhatsApp or video call, whichever suits you.",
    },
    PRICE_FAQ,
    TIMING_FAQ,
    {
      question: "I already have a website. Can you replace it?",
      answer:
        "Yes. Tell me its address when you request your preview and I’ll build the new version first, so you can compare the two before you decide. You keep your domain name and your content throughout.",
    },
    {
      question: "Do you only work with businesses in Witney?",
      answer:
        "No. Being nearby simply means we can meet in person if you’d like to. Most of the work happens online, so I take on businesses, charities and community organisations anywhere in the UK.",
    },
  ],
  ctaTitle: CTA_TITLE,
}
