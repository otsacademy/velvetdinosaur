import { CTA_TITLE, PRICE_FAQ, TIMING_FAQ } from "./shared"
import type { LocationPageContent } from "./types"

export const WOODSTOCK_PAGE: LocationPageContent = {
  slug: "web-design-woodstock",
  focus: "Woodstock",
  title: "Web design in Woodstock, built before you pay | Velvet Dinosaur",
  description:
    "Web designer near Witney, a short drive from Woodstock. I build your new website first, so you see it working before you pay. Hosting, updates and support included.",
  greeting: "Hello, Woodstock,",
  headline: ["Web design in Woodstock,", "built before you pay."],
  lead: "I’m Ian. I run Velvet Dinosaur from Minster Lovell, near Witney, a short drive from Woodstock. I build websites for independent shops, galleries, pubs and places to stay, and you see your finished site working before you pay anything.",
  photoCaption: "A short drive away.",
  reasons: {
    kicker: "Why it suits Woodstock",
    title: "For a town that visitors already know.",
    cards: [
      {
        title: "Reach the visitors already here",
        body: "Blenheim Palace brings a steady stream of visitors to Woodstock. A clear site with your opening times, a map and good photographs turns some of them into your customers.",
      },
      {
        title: "As considered as your shop",
        body: "Woodstock’s shops and galleries are carefully presented. Your website should be too, with room for your products, your story and your photographs.",
      },
      {
        title: "Sell and take bookings online",
        body: "Your site can include online payments or a small shop, alongside booking that syncs with your Google Calendar and forms that send enquiries straight to you.",
      },
    ],
  },
  area: {
    kicker: "Where I am",
    title: "Near Witney, a short drive from Woodstock.",
    paragraphs: [
      "I work from home in Minster Lovell, west of Witney. I’m happy to drive over to Woodstock and go through your preview with you in person, or we can talk it through by phone or video call.",
      "You deal with one person from the first conversation to launch, and I stay on afterwards to host and look after the site, so you always know who to ask.",
    ],
    placesLabel: "Around Woodstock",
    places: [
      "Woodstock",
      "Bladon",
      "Long Hanborough",
      "Wootton",
      "Stonesfield",
      "Tackley",
      "Kidlington",
      "Charlbury",
    ],
  },
  reviewNames: ["Vikram Katoch", "Faye Taylor", "Lynn Casey"],
  faqs: [
    {
      question: "Will you come to Woodstock to meet?",
      answer:
        "Yes. Woodstock is a short drive from Minster Lovell, so I can come to you to go through your preview. If you prefer, we can do everything by phone, WhatsApp, email or video call.",
    },
    PRICE_FAQ,
    TIMING_FAQ,
    {
      question: "Can I sell online through the site?",
      answer:
        "Yes. Your site can include online payments or a small shop. Tick it when you request your preview, and we can talk through what you sell and how you want to take payment.",
    },
    {
      question: "What happens after the site launches?",
      answer:
        "I host it, keep the software up to date, take daily backups and make small content changes for you. If something goes wrong, you contact me directly. There is no support queue.",
    },
  ],
  ctaTitle: CTA_TITLE,
}
