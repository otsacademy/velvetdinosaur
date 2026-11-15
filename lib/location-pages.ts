// Copy for the two local landing pages, /web-design-witney and
// /web-design-oxfordshire. Everything here has to stay true of the business:
// where Ian is, how he works and what the offer is. Do not add client names or
// local track record that the Work page and the Google reviews cannot back up.

export type LocationFaq = { question: string; answer: string }

export type LocationPageContent = {
  slug: string
  /** Search-facing title and description. */
  title: string
  description: string
  /** Handwritten greeting above the headline. */
  greeting: string
  /** Headline in two halves: plain, then emphasised in the pen colour. */
  headline: [string, string]
  lead: string
  /** Handwritten caption under Ian's photograph. */
  photoCaption: string
  reasons: {
    kicker: string
    title: string
    cards: Array<{ title: string; body: string }>
  }
  area: {
    kicker: string
    title: string
    paragraphs: string[]
    /** Shown as a row of place names, with a line saying what they are. */
    placesLabel: string
    places: string[]
  }
  /** Keys of the reviews to show (names in components/home/site-data.ts). */
  reviewNames: string[]
  faqs: LocationFaq[]
  ctaTitle: string
}

const PRICE_ANSWER =
  "£99 a month with everything included: design, build, hosting, updates, support and small content changes. There is no setup fee. The minimum term is twelve months, paid monthly, and after that it rolls on with thirty days’ notice."

const TIMING_ANSWER =
  "Most previews are ready within one to two weeks. You then have fourteen days to try yours. If you go ahead, the site is ready to launch within seven days, provided I have your feedback, content and domain access."

export const WITNEY_PAGE: LocationPageContent = {
  slug: "web-design-witney",
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
    {
      question: "How much does a website cost?",
      answer: PRICE_ANSWER,
    },
    {
      question: "How long does it take?",
      answer: TIMING_ANSWER,
    },
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
  ctaTitle: "Shall I make a start on yours?",
}

export const OXFORDSHIRE_PAGE: LocationPageContent = {
  slug: "web-design-oxfordshire",
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
        body: "I turned Froxfield Parish Council’s single homepage into a modern, structured site that residents can rely on as a source of information.",
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
    {
      question: "How much does a website cost?",
      answer: PRICE_ANSWER,
    },
    {
      question: "How long does it take?",
      answer: TIMING_ANSWER,
    },
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
  ctaTitle: "Shall I make a start on yours?",
}
