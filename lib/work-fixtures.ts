import type { Article } from '@/lib/articles'

const DEFAULT_AUTHOR = {
  name: 'Ian Wickens',
  img: '/dinosaur.webp',
}

export const WORK_FIXTURES: Article[] = [
  {
    slug: 'academics-stand-against-poverty',
    title: 'Academics Stand Against Poverty',
    subtitle: 'International academic network fighting poverty',
    tag: 'Case Study',
    tags: ['Case Study', 'Charity'],
    desc: 'Academic journal and WordPress rebuild after three years without core updates.',
    website: 'https://academicsstand.org',
    outcome: 'Non-technical staff can publish articles and manage communications without external support.',
    img: '/portfolio/asap.png',
    imageCaption: 'Academics Stand Against Poverty homepage after redesign and CMS migration.',
    date: 'Posted on 15 Jan 2026',
    readTime: '4 min read',
    author: DEFAULT_AUTHOR,
    status: 'published',
    sections: [
      {
        id: 'challenge',
        heading: 'Challenge',
        paragraphs: [
          'ASAP approached Velvet Dinosaur to resolve technical issues with its academic journal and a WordPress installation that had become difficult to manage. Conflicting plugins and an outdated theme had blocked core updates for three years. The site was insecure. The mobile performance score was 32.',
          'The first phase focused on stabilization. Velvet Dinosaur audited the existing architecture and optimized asset delivery. The mobile performance score rose to 67. The team had a working platform while the transition was planned.',
        ],
      },
      {
        id: 'approach',
        heading: 'Approach',
        paragraphs: [
          'The site was rebuilt on a Next.js stack to move away from the limits of the previous setup. The new platform covered four functions. It provided a news editor with a word-processing interface. It included a version of Sauro CMS for page management. It added a newsletter system with double opt-in and a media library for asset organization.',
          'The work focused on reducing technical friction for the academic team. Legacy data was migrated to the new system, including user profiles, newsletter subscribers, and archival content. Administrators and the public could keep using the site on the new platform.',
        ],
      },
      {
        id: 'result',
        heading: 'Result',
        paragraphs: [
          'The new site launched with a new interface. The administrative workflow was simplified. Non-technical staff could publish articles and manage communications without external support.',
          'Velvet Dinosaur continues to host and maintain the platform for ASAP. Sauro CMS provides ongoing platform updates. ASAP can keep the platform updated through the same setup.',
        ],
      },
    ],
    content: {
      intro:
        'Conflicting plugins and an outdated theme had blocked core updates for three years.',
      heroImg: '/portfolio/asap.png',
      sections: [
        {
          id: 'challenge',
          title: 'Challenge',
          body:
            'ASAP approached Velvet Dinosaur to resolve technical issues with its academic journal and a WordPress installation that had become difficult to manage. Conflicting plugins and an outdated theme had blocked core updates for three years. The site was insecure. The mobile performance score was 32.\n\nThe first phase focused on stabilization. Velvet Dinosaur audited the existing architecture and optimized asset delivery. The mobile performance score rose to 67. The team had a working platform while the transition was planned.',
        },
        {
          id: 'approach',
          title: 'Approach',
          body:
            'The site was rebuilt on a Next.js stack to move away from the limits of the previous setup. The new platform covered four functions. It provided a news editor with a word-processing interface. It included a version of Sauro CMS for page management. It added a newsletter system with double opt-in and a media library for asset organization.\n\nThe work focused on reducing technical friction for the academic team. Legacy data was migrated to the new system, including user profiles, newsletter subscribers, and archival content. Administrators and the public could keep using the site on the new platform.',
        },
        {
          id: 'result',
          title: 'Result',
          body:
            'The new site launched with a new interface. The administrative workflow was simplified. Non-technical staff could publish articles and manage communications without external support.\n\nVelvet Dinosaur continues to host and maintain the platform for ASAP. Sauro CMS provides ongoing platform updates. ASAP can keep the platform updated through the same setup.',
        },
      ],
    },
  },
  {
    slug: 'the-brave',
    title: 'The Brave',
    subtitle: 'Values-led ethical tourism platform',
    tag: 'Case Study',
    tags: ['Case Study', 'Travel'],
    desc: 'Values-led ethical travel platform with integrated advocacy and media storytelling.',
    website: 'https://thebrave.online',
    outcome: 'Stronger brand differentiation and clearer user pathways.',
    img: '/portfolio/the-brave.png',
    imageCaption: 'The Brave homepage presenting the brand and travel offer.',
    date: 'Posted on 2 Feb 2026',
    readTime: '3 min read',
    author: DEFAULT_AUTHOR,
    status: 'published',
    sections: [
      {
        id: 'challenge',
        heading: 'Challenge',
        paragraphs: [
          'The Brave needed a polished digital presence that communicated both premium travel experiences and the founder’s values-led approach.',
          'It also needed space for rich media and storytelling without losing clarity around the actual offer.',
        ],
      },
      {
        id: 'approach',
        heading: 'Approach',
        paragraphs: [
          'Velvet Dinosaur designed and built a tailored website backed by a bespoke travel management system.',
          'The project combined structured content with embedded TikTok and YouTube material so the brand voice and advocacy work could live alongside the commercial journey.',
        ],
      },
      {
        id: 'result',
        heading: 'Result',
        paragraphs: [
          'The final site feels more distinctive and more intentional, with clearer pathways for visitors to understand what makes the brand different.',
          'The result is a professional, elegant platform that reflects the founder’s vision while supporting future growth.',
        ],
      },
    ],
    content: {
      intro:
        'The Brave needed a website that could feel premium and personal at the same time, combining ethical travel positioning with strong founder-led storytelling.',
      heroImg: '/portfolio/the-brave.png',
      sections: [
        {
          id: 'challenge',
          title: 'Challenge',
          body:
            'The Brave needed a polished digital presence that communicated both premium travel experiences and the founder’s values-led approach.\n\nIt also needed space for rich media and storytelling without losing clarity around the actual offer.',
        },
        {
          id: 'approach',
          title: 'Approach',
          body:
            'Velvet Dinosaur designed and built a tailored website backed by a bespoke travel management system.\n\nThe project combined structured content with embedded TikTok and YouTube material so the brand voice and advocacy work could live alongside the commercial journey.',
        },
        {
          id: 'result',
          title: 'Result',
          body:
            'The final site feels more distinctive and more intentional, with clearer pathways for visitors to understand what makes the brand different.\n\nThe result is a professional, elegant platform that reflects the founder’s vision while supporting future growth.',
        },
      ],
    },
  },
  {
    slug: 'rising-dust-adventures',
    title: 'Rising Dust Adventures',
    subtitle: 'Premium motorcycle expedition company',
    tag: 'Case Study',
    tags: ['Case Study', 'Adventure Travel'],
    desc: 'Premium motorcycle expedition experience focused on route clarity and trust-building.',
    website: 'https://risingdustadventures.com',
    outcome: 'Higher-quality visual storytelling and better route conversion flow.',
    img: '/portfolio/rising-dust.png',
    imageCaption: 'Rising Dust Adventures route and expedition storytelling interface.',
    date: 'Posted on 10 Feb 2026',
    readTime: '3 min read',
    author: DEFAULT_AUTHOR,
    status: 'published',
    sections: [
      {
        id: 'challenge',
        heading: 'Challenge',
        paragraphs: [
          'Rising Dust Adventures needed a site that felt credible and aspirational without becoming hard to navigate.',
          'Potential riders had to understand the routes, the experience, and the company’s safety-first ethos quickly.',
        ],
      },
      {
        id: 'approach',
        heading: 'Approach',
        paragraphs: [
          'The website was designed around strong route storytelling, trustworthy presentation, and clear expedition detail.',
          'Testimonials, route information, and brand cues were structured to support confidence and decision-making rather than just visual impact.',
        ],
      },
      {
        id: 'result',
        heading: 'Result',
        paragraphs: [
          'The finished site gives the business a stronger digital presence for a niche adventure audience.',
          'Visual storytelling improved, route exploration became clearer, and the conversion path from interest to enquiry became more direct.',
        ],
      },
    ],
    content: {
      intro:
        'Rising Dust Adventures needed a digital presence that balanced aspiration with trust, helping prospective riders understand the experience and the practical details in the same journey.',
      heroImg: '/portfolio/rising-dust.png',
      sections: [
        {
          id: 'challenge',
          title: 'Challenge',
          body:
            'Rising Dust Adventures needed a site that felt credible and aspirational without becoming hard to navigate.\n\nPotential riders had to understand the routes, the experience, and the company’s safety-first ethos quickly.',
        },
        {
          id: 'approach',
          title: 'Approach',
          body:
            'The website was designed around strong route storytelling, trustworthy presentation, and clear expedition detail.\n\nTestimonials, route information, and brand cues were structured to support confidence and decision-making rather than just visual impact.',
        },
        {
          id: 'result',
          title: 'Result',
          body:
            'The finished site gives the business a stronger digital presence for a niche adventure audience.\n\nVisual storytelling improved, route exploration became clearer, and the conversion path from interest to enquiry became more direct.',
        },
      ],
    },
  },
  {
    slug: 'scholardemia',
    title: 'Scholardemia',
    subtitle: 'Academic social networking and research management platform',
    tag: 'Case Study',
    tags: ['Case Study', 'Product'],
    desc: 'Academic networking and publishing product with secure auth and scalable architecture.',
    website: 'https://scholardemia.com',
    outcome: 'Unified product direction across community, collaboration, and publishing tools.',
    img: '/portfolio/scholardemia.png',
    imageCaption: 'Scholardemia product interface and sign-in flow.',
    date: 'Posted on 18 Feb 2026',
    readTime: '4 min read',
    author: DEFAULT_AUTHOR,
    status: 'published',
    sections: [
      {
        id: 'challenge',
        heading: 'Challenge',
        paragraphs: [
          'Scholardemia combines community, collaboration, and publishing workflows, which creates product complexity quickly.',
          'The platform needed a coherent direction across those overlapping jobs without sacrificing reliability or security.',
        ],
      },
      {
        id: 'approach',
        heading: 'Approach',
        paragraphs: [
          'Velvet Dinosaur supported the platform with product shaping, secure authentication, and scalable technical architecture.',
          'The work focused on bringing separate user journeys into a more unified system so the product felt intentional rather than fragmented.',
        ],
      },
      {
        id: 'result',
        heading: 'Result',
        paragraphs: [
          'The outcome was a clearer product direction spanning networking, collaboration, and publishing.',
          'That coherence gives the platform a stronger base for future development and a more understandable experience for users.',
        ],
      },
    ],
    content: {
      intro:
        'Scholardemia needed product and platform work that could connect several academic workflows into a clearer, more scalable whole.',
      heroImg: '/portfolio/scholardemia.png',
      sections: [
        {
          id: 'challenge',
          title: 'Challenge',
          body:
            'Scholardemia combines community, collaboration, and publishing workflows, which creates product complexity quickly.\n\nThe platform needed a coherent direction across those overlapping jobs without sacrificing reliability or security.',
        },
        {
          id: 'approach',
          title: 'Approach',
          body:
            'Velvet Dinosaur supported the platform with product shaping, secure authentication, and scalable technical architecture.\n\nThe work focused on bringing separate user journeys into a more unified system so the product felt intentional rather than fragmented.',
        },
        {
          id: 'result',
          title: 'Result',
          body:
            'The outcome was a clearer product direction spanning networking, collaboration, and publishing.\n\nThat coherence gives the platform a stronger base for future development and a more understandable experience for users.',
        },
      ],
    },
  },
]

export function getWorkFixtureBySlug(slug: string) {
  return WORK_FIXTURES.find((article) => article.slug === slug) || null
}
