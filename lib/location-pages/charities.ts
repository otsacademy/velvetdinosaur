import { CTA_TITLE, PRICE_FAQ, TIMING_FAQ } from "./shared"
import type { LocationPageContent } from "./types"

// The proof here is Academics Stand Against Poverty: every claim about it comes
// from its case study (lib/work-fixtures.ts) or its Google review.
export const CHARITIES_PAGE: LocationPageContent = {
  slug: "websites-for-charities",
  focus: "charities",
  title: "Websites for charities, built before you pay | Velvet Dinosaur",
  description:
    "Websites for charities from a web designer near Witney, Oxfordshire. Built first, so your trustees see it before you pay. £99 a month with hosting and support.",
  greeting: "Dear trustees,",
  headline: ["Websites for charities,", "built before you pay."],
  lead: "I’m Ian. From Minster Lovell, near Witney, I build and look after websites for charities and community groups. You see your finished site working before you pay anything, so your trustees can decide on the real thing.",
  photoCaption: "Here for the long run.",
  reasons: {
    kicker: "What it means for a charity",
    title: "A website your team can run without a developer.",
    cards: [
      {
        title: "Your team can update it",
        body: "Staff and volunteers edit pages, publish news and change photos themselves. At Academics Stand Against Poverty, non-technical staff now publish articles and manage communications without outside help.",
      },
      {
        title: "A fixed cost you can plan for",
        body: "£99 a month covers the design, hosting, updates and support, with no setup fee. It is the same every month, so there is no large bill to find or justify up front.",
      },
      {
        title: "Trustees see it first",
        body: "I build a working preview, so trustees, staff and volunteers can all try the real site before you decide. If it isn’t right, it is deleted and you pay nothing.",
      },
    ],
  },
  area: {
    kicker: "Where I am",
    title: "West Oxfordshire, working with charities anywhere.",
    paragraphs: [
      "I work from my home in Minster Lovell, near Witney. If your charity is in Oxfordshire, I can come and meet your staff or trustees and go through the preview together.",
      "Most of the work happens online, which is how I look after the website for Academics Stand Against Poverty, a global academic network. Wherever your charity is based, you deal directly with me.",
    ],
    placesLabel: "Easy for me to visit",
    places: [
      "Witney",
      "Carterton",
      "Burford",
      "Chipping Norton",
      "Woodstock",
      "Eynsham",
      "Oxford",
      "Abingdon",
    ],
  },
  reviewNames: ["Michal Apollo", "Lynn Casey", "Faye Taylor"],
  faqs: [
    {
      question: "Can you move our content and subscribers across?",
      answer:
        "Yes. When I rebuilt the website for Academics Stand Against Poverty, I moved its user profiles, newsletter subscribers and archive into the new system, so the team and the public could carry on as before.",
    },
    {
      question: "Our old site is on WordPress and hard to update. Can you help?",
      answer:
        "Yes. That is where Academics Stand Against Poverty started: conflicting plugins had blocked its WordPress updates for three years. I stabilised the old site first, so the team kept a working website while I built the new one.",
    },
    PRICE_FAQ,
    TIMING_FAQ,
    {
      question: "Can people donate or sign up through the site?",
      answer:
        "Yes. Your site can take online payments or link clearly to the donation page you already use. It can also include an email newsletter with double opt-in, so supporters confirm they want to hear from you.",
    },
  ],
  ctaTitle: CTA_TITLE,
}
