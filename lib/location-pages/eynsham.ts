import { CTA_TITLE, PRICE_FAQ, TIMING_FAQ } from "./shared"
import type { LocationPageContent } from "./types"

export const EYNSHAM_PAGE: LocationPageContent = {
  slug: "web-design-eynsham",
  focus: "Eynsham",
  title: "Web design in Eynsham, built before you pay | Velvet Dinosaur",
  description:
    "Web designer in Minster Lovell, along the A40 from Eynsham. I build your new website first, so you see it working before you pay. Hosting and support included.",
  greeting: "Hello, Eynsham,",
  headline: ["Web design in Eynsham,", "built before you pay."],
  lead: "I’m Ian. I run Velvet Dinosaur from Minster Lovell, on the far side of Witney from Eynsham along the A40. I build websites for local businesses, clubs and community groups, and you see your finished site working before you pay anything.",
  photoCaption: "Just along the A40.",
  reasons: {
    kicker: "Why it suits Eynsham",
    title: "A busy village needs a site that keeps up.",
    cards: [
      {
        title: "Room for news and events",
        body: "Publish news, events and notices yourself, so customers and members always know what is coming up. Older posts are filed neatly instead of piling up on the homepage.",
      },
      {
        title: "Found from both directions",
        body: "Your customers may live in the village or pass through between Witney and Oxford. A clear, fast website lets both find you, see what you offer and get in touch.",
      },
      {
        title: "Changes without a quote",
        body: "Small content changes are included. If something needs updating, you message me and I sort it, so you are never waiting on a quote for a new photo.",
      },
    ],
  },
  area: {
    kicker: "Where I am",
    title: "Minster Lovell, along the A40 from Eynsham.",
    paragraphs: [
      "I work from home in Minster Lovell, on the other side of Witney from Eynsham. I can come over to go through your preview with you, or we can talk it through by phone, WhatsApp, email or video call.",
      "I also build for groups that run on volunteers: clubs, societies and community organisations that need a site several people can keep up to date.",
    ],
    placesLabel: "Around Eynsham",
    places: [
      "Eynsham",
      "Stanton Harcourt",
      "Cassington",
      "Freeland",
      "Long Hanborough",
      "Swinford",
      "Witney",
      "Oxford",
    ],
  },
  reviewNames: ["Lynn Casey", "Faye Taylor", "Michal Apollo"],
  faqs: [
    {
      question: "Can we meet in Eynsham?",
      answer:
        "Yes. Eynsham is an easy drive from Minster Lovell, so I can meet you at your business or somewhere in the village. If it is easier, we can work by phone, WhatsApp, email or video call.",
    },
    PRICE_FAQ,
    TIMING_FAQ,
    {
      question: "Can several of us update the site?",
      answer:
        "Yes. You can have logins for more than one person in Sauro CMS, so several of you can publish news or update pages. Version history lets you undo a mistake.",
    },
    {
      question: "Do I keep my domain name?",
      answer:
        "Yes. You always own your domain name and your content. If you already have a website, I build the new one first, so you can compare the two before anything changes.",
    },
  ],
  ctaTitle: CTA_TITLE,
}
