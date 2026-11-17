import { CTA_TITLE, PRICE_FAQ, TIMING_FAQ } from "./shared"
import type { LocationPageContent } from "./types"

export const OXFORDSHIRE_PAGE: LocationPageContent = {
  slug: "web-design-oxfordshire",
  focus: "Oxfordshire",
  title: "Web design in Oxfordshire, built before you pay | Velvet Dinosaur",
  description:
    "Oxfordshire web designer based in Minster Lovell, near Witney. I build your new website first, so you see it before you pay. Hosting, updates and support included.",
  greeting: "Hello, Oxfordshire,",
  headline: ["Web design in Oxfordshire,", "built before you pay."],
  lead: "I’m Ian, a web designer in Minster Lovell, West Oxfordshire. If you run a small business, a charity, a parish council or a community group anywhere in the county, I’ll build your new website first, and you see the finished site before you pay a penny.",
  photoCaption: "Based in West Oxfordshire.",
  reasons: {
    kicker: "Who I build for",
    title: "Small organisations that need a site they can rely on.",
    cards: [
      {
        title: "Small businesses",
        body: "A fast, clear website shaped around your business, with contact forms and a booking system built in. You can update it yourself, or ask me to make small changes for you.",
      },
      {
        title: "Charities and community groups",
        body: "I rebuilt the website for Academics Stand Against Poverty, a global academic network, so its team can publish and manage structured content themselves.",
      },
      {
        title: "Parish and town councils",
        body: "I helped Froxfield Parish Council reorganise its single homepage into a modern, structured site that residents can rely on as a source of information.",
      },
    ],
  },
  area: {
    kicker: "Where I work",
    title: "Based near Witney, working across the county.",
    paragraphs: [
      "I’m in Minster Lovell, between Witney and Burford. West Oxfordshire and Oxford are within easy reach, so we can meet in person and go through your preview together.",
      "Elsewhere in the county we can meet in person where it’s practical, or work by phone, WhatsApp, email or video call. Either way you deal directly with me.",
    ],
    placesLabel: "Across Oxfordshire",
    places: [
      "Witney",
      "Carterton",
      "Burford",
      "Chipping Norton",
      "Woodstock",
      "Eynsham",
      "Oxford",
      "Abingdon",
      "Bicester",
      "Banbury",
      "Didcot",
      "Thame",
      "Wantage",
      "Henley-on-Thames",
    ],
  },
  reviewNames: ["Lynn Casey", "Faye Taylor", "Vikram Katoch"],
  faqs: [
    {
      question: "Do I need to be near Witney?",
      answer:
        "No. I’m based near Witney, but most of the work happens online. We can meet in person where it’s practical, and otherwise by phone, WhatsApp, email or video call.",
    },
    PRICE_FAQ,
    TIMING_FAQ,
    {
      question: "Can I update the website myself?",
      answer:
        "Yes. Every site comes with Sauro CMS, a private admin area where you edit text, swap photos and publish news. Version history lets you undo a mistake, and I make small content changes for you if you’d rather not.",
    },
    {
      question: "Who owns the website and the domain?",
      answer:
        "You always own your domain name and your content, and you can export your data at any time. You are free to leave after your first year, and I will help you move.",
    },
  ],
  ctaTitle: CTA_TITLE,
}
