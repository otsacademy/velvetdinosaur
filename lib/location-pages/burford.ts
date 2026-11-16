import { CTA_TITLE, PRICE_FAQ, TIMING_FAQ } from "./shared"
import type { LocationPageContent } from "./types"

export const BURFORD_PAGE: LocationPageContent = {
  slug: "web-design-burford",
  focus: "Burford",
  title: "Web design in Burford, built before you pay | Velvet Dinosaur",
  description:
    "Web designer in Minster Lovell, a few miles down the Windrush from Burford. Your new website is built first, so you see it before you pay. Support included.",
  greeting: "Hello, Burford,",
  headline: ["Web design in Burford,", "built before you pay."],
  lead: "I’m Ian. I run Velvet Dinosaur from Minster Lovell, a few miles down the Windrush valley from Burford. I build websites for shops, pubs, cafés, places to stay and galleries, and you see your finished site working before you pay anything.",
  photoCaption: "Just down the Windrush.",
  reasons: {
    kicker: "Why it suits Burford",
    title: "Made for a town that welcomes visitors.",
    cards: [
      {
        title: "Visitors plan on their phones",
        body: "Most people choose where to eat, shop or stay before they arrive. A fast site with your opening times, directions and good photographs helps them choose you.",
      },
      {
        title: "As well made as the high street",
        body: "Burford trades on its honey-coloured stone and its independent shops. Your website should feel the same: well made, unhurried and easy to browse.",
      },
      {
        title: "Bookings without phone tag",
        body: "Online booking syncs with your Google Calendar, and enquiry forms come straight to you, so people can book a time or ask about dates without ringing.",
      },
    ],
  },
  area: {
    kicker: "Where I am",
    title: "Minster Lovell, a few miles from Burford.",
    paragraphs: [
      "I live in Minster Lovell, a few miles east of Burford along the River Windrush. I can come into town to go through your preview with you at a quiet moment in your day.",
      "Many Burford businesses depend on people who find them online. I build every site to load quickly, show off your photographs and make it obvious how to book, call or find you.",
    ],
    placesLabel: "Around Burford",
    places: [
      "Burford",
      "Fulbrook",
      "Taynton",
      "Swinbrook",
      "Asthall",
      "Shipton-under-Wychwood",
      "Filkins",
      "Minster Lovell",
    ],
  },
  reviewNames: ["Faye Taylor", "Vikram Katoch", "Michal Apollo"],
  faqs: [
    {
      question: "Can you come to me in Burford?",
      answer:
        "Yes. Burford is a few miles from Minster Lovell, so I can come to you to go through your preview. If you are busy, we can do it by phone, WhatsApp, email or video call instead.",
    },
    PRICE_FAQ,
    TIMING_FAQ,
    {
      question: "Can I change opening times, menus and prices myself?",
      answer:
        "Yes. Sauro CMS lets you change text, prices and photos yourself, and version history lets you undo a mistake. If you are busy, send me the changes and I will make them for you.",
    },
    {
      question: "Do you only work with businesses in Burford?",
      answer:
        "No. I am based near Witney and work with businesses across the Cotswolds and the rest of the UK. Being close by simply means we can meet in person when it helps.",
    },
  ],
  ctaTitle: CTA_TITLE,
}
