import { COUNCIL_OFFER } from "../price-offers"
import { COUNCIL_PRICE_ANSWER, CTA_TITLE } from "./shared"
import type { LocationPageContent } from "./types"

// The proof here is Froxfield Parish Council (its Google review and Work card).
// The rules named in the first answer were checked on 16 November 2026: the
// Transparency Code for Smaller Authorities covers councils with a turnover of
// up to £25,000, and the 2018 public sector accessibility regulations cover
// parish and town councils. Do not promise that a site makes a council
// compliant; the council stays responsible for that.
// Assertion 10 (checked 17 November 2026): new in the 2025/26 annual
// governance return, Practitioners' Guide 2025 paragraphs 5.117 to 5.128.
// Councils' own papers quote it as an accessible website (WCAG 2.2 AA), a
// council-owned domain for website and email, an IT policy and data
// protection.
// Price: councils pay £480 a year, invoiced yearly (Ian agreed on 17 November
// 2026). Specialist council website providers charged £300 to £600 a year at
// the time, and councils set their budgets a year at a time.
export const PARISH_COUNCILS_PAGE: LocationPageContent = {
  slug: "websites-for-parish-councils",
  focus: "parish",
  title: "Parish council websites, built before you pay | Velvet Dinosaur",
  description:
    "Websites for parish and town councils, from a web designer near Witney, Oxfordshire. Built first, so councillors see it before you decide. Support included.",
  greeting: "Dear clerk,",
  headline: ["Parish council websites,", "built before you pay."],
  lead: "I’m Ian, a web designer in Minster Lovell, near Witney. I build and look after websites for parish and town councils, and you see your finished site working before you pay, so councillors can decide on the real thing.",
  photoCaption: "Agendas, minutes and all.",
  reasons: {
    kicker: "What a council needs",
    title: "Everything residents look for, easy to find.",
    cards: [
      {
        title: "A proper home for every document",
        body: "Agendas, minutes, accounts, policies and spending records each have a clear place, so residents can find them and the clerk can add new ones quickly.",
      },
      {
        title: "Easy for the clerk to keep up",
        body: "Upload a PDF, post a notice or update a councillor’s details without technical help. Or email it to me and I’ll put it up for you.",
      },
      {
        title: "Councillors see it before you decide",
        body: "I build a working preview first, so the council can look at the real site before it votes. If it isn’t right, the preview is deleted and you pay nothing.",
      },
    ],
  },
  area: {
    kicker: "Where I work",
    title: "Near Witney, working with councils across England.",
    paragraphs: [
      "I work from my home in Minster Lovell, West Oxfordshire. If your council is nearby I can come and go through the preview with you; if not, we work by phone, email or video call.",
      "For Froxfield Parish Council, I turned a single homepage into a structured site that residents can rely on for information. You can read what the council said about it below.",
    ],
    placesLabel: "Easy for me to visit",
    places: [
      "Witney",
      "Carterton",
      "Burford",
      "Chipping Norton",
      "Woodstock",
      "Eynsham",
      "Bampton",
      "Charlbury",
    ],
  },
  offer: COUNCIL_OFFER,
  reviewNames: ["Lynn Casey", "Michal Apollo", "Faye Taylor"],
  faqs: [
    {
      question: "Can the site help us meet the transparency and accessibility rules?",
      answer:
        "Yes. The documents the Transparency Code asks smaller councils to publish, such as agendas, minutes, accounts and spending over £100, each get a clear place, and the clerk can upload them as PDFs. Pages are built to be accessible, with a page for the accessibility statement the regulations require. The council stays responsible for its own compliance, but the site makes it straightforward.",
    },
    {
      question: "Will the site help with Assertion 10 in the annual return?",
      answer:
        "It covers the website side. Assertion 10, new in the 2025/26 annual return, asks councils to show that their website meets the WCAG 2.2 AA accessibility standard and runs on a domain the council owns, ideally a .gov.uk one. Your site uses the council’s own address, is built to be accessible and has a page for the accessibility statement. The IT policy, data protection and the clerk’s email stay with the council, which answers the assertion itself.",
    },
    {
      question: "Can the clerk update the site without help?",
      answer:
        "Yes. The clerk can upload agendas and minutes, post notices and edit pages in Sauro CMS, with version history to undo mistakes. Small content changes are included too, so you can simply email them to me.",
    },
    {
      question: "How much does a council website cost?",
      answer: COUNCIL_PRICE_ANSWER,
    },
    {
      question: "How does the council decide?",
      answer:
        "Request your preview two or three weeks before a meeting. Previews are usually ready within one to two weeks and you then have fourteen days to try yours, so councillors can see the real site before they vote.",
    },
    {
      question: "Can we keep our current web address?",
      answer:
        "Yes. You keep your domain name, including a .gov.uk address if the council has one, and you always own your content. I build the new site first, so nothing changes until you are ready.",
    },
  ],
  ctaTitle: CTA_TITLE,
}
