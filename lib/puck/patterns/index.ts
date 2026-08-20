import type { ComponentData } from '@puckeditor/core';

type PatternBlock = Pick<ComponentData, 'type' | 'props'>;

export type PatternPayload = {
  id: string;
  name: string;
  description: string;
  blocksPayload: PatternBlock[];
};

const TEAM_GRID_MEMBERS = [
  {
    id: 'team-member-1',
    name: 'Maya Chen',
    title: 'Program Director',
    bio: 'Builds editorial calendars and makes launch days actually happen.',
    imageSrc: '/images/placeholder.svg',
    imageAlt: 'Maya Chen',
    href: '/team'
  },
  {
    id: 'team-member-2',
    name: 'Samuel Ortega',
    title: 'Research Lead',
    bio: 'Turns complex research into practical policy recommendations.',
    imageSrc: '/images/placeholder.svg',
    imageAlt: 'Samuel Ortega',
    href: '/team'
  },
  {
    id: 'team-member-3',
    name: 'Leila Okoro',
    title: 'Community Strategist',
    bio: 'Connects chapters and supports local teams with practical playbooks.',
    imageSrc: '/images/placeholder.svg',
    imageAlt: 'Leila Okoro',
    href: '/team'
  }
];

const FAQ_ITEMS = [
  {
    question: 'How do I update all pages at once?',
    answer:
      'Use global sections for header and footer updates, then save once. Changes apply across all pages.'
  },
  {
    question: 'Can I preview a change before publish?',
    answer: 'Save the draft, then open the preview from the page list and validate in the draft viewport.'
  },
  {
    question: 'How do I keep content consistent across pages?',
    answer: 'Use shared components and reusable sections to keep tone and structure aligned.'
  }
];

const LOGO_STRIP = [
  { id: 'logo-partner-1', label: 'UNDP', imageSrc: '/images/placeholder.svg', imageAlt: 'UNDP' },
  { id: 'logo-partner-2', label: 'WIDER', imageSrc: '/images/placeholder.svg', imageAlt: 'WIDER' },
  { id: 'logo-partner-3', label: 'UNCTAD', imageSrc: '/images/placeholder.svg', imageAlt: 'UNCTAD' },
  { id: 'logo-partner-4', label: 'ODI', imageSrc: '/images/placeholder.svg', imageAlt: 'ODI' }
];

export const PUCK_PATTERNS: PatternPayload[] = [
  {
    id: 'team-section',
    name: 'People grid',
    description: 'Add a 3-person profile section with names, bios, and photos.',
    blocksPayload: [
      {
        type: 'PersonGrid',
        props: {
          id: 'pattern-team-section',
          heading: 'Meet the team',
          subtitle: 'People leading the work with practical support and global perspective.',
          columns: 3,
          people: TEAM_GRID_MEMBERS
        }
      }
    ]
  },
  {
    id: 'feature-grid',
    name: 'Feature grid',
    description: 'Insert a 3-card benefits grid with editable copy and icons.',
    blocksPayload: [
      {
        type: 'FeatureGrid',
        props: {
          id: 'pattern-feature-grid',
          heading: 'How this page works',
          items: [
            {
              title: 'Design system first',
              description: 'Token-driven primitives keep style updates consistent across components.',
              icon: 'sparkles'
            },
            {
              title: 'Reusable blocks',
              description: 'Compose repeated layouts from shared blocks for speed and consistency.',
              icon: 'layers'
            },
            {
              title: 'Global chrome safety',
              description: 'Protect shared header/footer areas unless you explicitly unlock edits.',
              icon: 'shield'
            }
          ]
        }
      }
    ]
  },
  {
    id: 'hero-banner',
    name: 'Hero banner',
    description: 'Add a hero block with headline, summary, and two CTAs.',
    blocksPayload: [
      {
        type: 'Hero59',
        props: {
          id: 'pattern-hero-banner',
          badge: 'Ready to launch',
          title: 'Build a polished section in one step',
          subtitle:
            'Insert a clear call-to-action section with headline, body copy, and supporting links.',
          primaryCta: { label: 'Start editing', href: '/edit' },
          secondaryCta: { label: 'Browse templates', href: '/edit' },
          videoSrc: ''
        }
      }
    ]
  },
  {
    id: 'faq',
    name: 'FAQ section',
    description: 'Insert a complete FAQ accordion with starter questions.',
    blocksPayload: [
      {
        type: 'FAQAccordion',
        props: {
          id: 'pattern-faq',
          title: 'Frequently asked questions',
          description: 'Common editor and content questions.',
          faqs: FAQ_ITEMS
        }
      }
    ]
  },
  {
    id: 'logos-strip',
    name: 'Partners strip',
    description: 'Insert a partner logo strip with title and four logos.',
    blocksPayload: [
      {
        type: 'Logos13',
        props: {
          id: 'pattern-logos-strip',
          title: 'Trusted by organizations worldwide',
          logos: LOGO_STRIP
        }
      }
    ]
  },
  {
    id: 'about-story',
    name: 'About story',
    description: 'Insert a mission statement section with an image and supporting copy.',
    blocksPayload: [
      {
        type: 'AboutBoldStatement',
        props: {
          id: 'pattern-about-story',
          eyebrow: 'About',
          heading: 'Who we are',
          description:
            'Share your mission and context with a concise narrative and supporting visual.',
          primaryCtaLabel: 'Read more',
          primaryCtaHref: '/about',
          secondaryCtaLabel: 'Contact',
          secondaryCtaHref: '/contact'
        }
      }
    ]
  },
  {
    id: 'impact-metrics',
    name: 'Impact metrics',
    description: 'Insert an editable 4-up statistics section.',
    blocksPayload: [
      {
        type: 'Stats19',
        props: {
          id: 'pattern-impact-metrics',
          eyebrow: 'Impact',
          title: 'By the numbers',
          items: [
            { number: '30+', description: 'Programs delivered globally' },
            { number: '12', description: 'Countries with active partnerships' },
            { number: '500+', description: 'Community members engaged' },
            { number: '20+', description: 'Years of measurable progress' }
          ]
        }
      }
    ]
  },
  {
    id: 'news-grid',
    name: 'News cards',
    description: 'Insert a three-card updates section for announcements and stories.',
    blocksPayload: [
      {
        type: 'BlogCardsSimple',
        props: {
          id: 'pattern-news-grid',
          title: 'Latest updates',
          subtitle: 'Highlight important announcements and stories.',
          posts: [
            {
              id: 'pattern-post-1',
              title: 'Program update title',
              href: '/news',
              excerpt: 'Add a short summary for this update.',
              dateLabel: 'Feb 2026',
              category: 'Update',
              imageSrc: '/images/placeholder.svg',
              imageAlt: 'Placeholder image',
              author: { name: 'Editorial team', avatarSrc: '' },
              tags: [{ value: 'Program' }]
            },
            {
              id: 'pattern-post-2',
              title: 'Partnership announcement',
              href: '/news',
              excerpt: 'Add another short summary for this card.',
              dateLabel: 'Feb 2026',
              category: 'Announcement',
              imageSrc: '/images/placeholder.svg',
              imageAlt: 'Placeholder image',
              author: { name: 'Communications', avatarSrc: '' },
              tags: [{ value: 'Partnership' }]
            },
            {
              id: 'pattern-post-3',
              title: 'Event recap',
              href: '/news',
              excerpt: 'Summarize outcomes, key moments, and next steps.',
              dateLabel: 'Feb 2026',
              category: 'Event',
              imageSrc: '/images/placeholder.svg',
              imageAlt: 'Placeholder image',
              author: { name: 'Program office', avatarSrc: '' },
              tags: [{ value: 'Events' }]
            }
          ]
        }
      }
    ]
  },
  {
    id: 'people-and-cta',
    name: 'People + CTA',
    description: 'Add a team section followed by a conversion banner.',
    blocksPayload: [
      {
        type: 'PersonGrid',
        props: {
          id: 'pattern-people-and-cta-grid',
          heading: 'Meet the team',
          subtitle: 'The people behind this program and its impact.',
          columns: 3,
          people: TEAM_GRID_MEMBERS
        }
      },
      {
        type: 'Cta31',
        props: {
          id: 'pattern-people-and-cta-banner',
          title: 'Ready to get involved?',
          subtitle: 'Join the network and collaborate with peers worldwide.',
          ctaLabel: 'Join now',
          ctaHref: '/connect'
        }
      }
    ]
  },
  {
    id: 'newsletter-signup',
    name: 'Newsletter signup',
    description: 'Insert an email sign-up callout with a short supporting message.',
    blocksPayload: [
      {
        type: 'ContactNewsletter',
        props: {
          id: 'pattern-newsletter-signup',
          title: 'Stay informed',
          subtitle: 'Get updates on research, events, and chapter activity.',
          newsletterTitle: 'Newsletter',
          newsletterHint: 'Monthly highlights from the network delivered to your inbox.',
          contactTitle: 'Need help?',
          contactHint: 'Reach out for partnerships, chapter support, or speaking opportunities.'
        }
      }
    ]
  }
];
