// Reference content for the Velvet Dinosaur editable blocks.
// These values are intentionally generic placeholders so installs/builds don't fail when
// store blocks reference `siteContent` at module scope.

export const siteContent: any = {
  brand: {
    name: 'Velvet Dinosaur',
    tagline: 'Design and build, shipped fast.',
    logo: '/placeholder.jpg'
  },
  nav: {
    cta: 'Book a call',
    links: [
      { label: 'Home', href: '/' },
      { label: 'About', href: '/about' }
    ]
  },
  hero: {
    headline: 'A site that loads instantly.',
    subheadline: 'A clean, accessible baseline for your next build.',
    primaryCta: 'Get started',
    secondaryCta: 'See pricing',
    qualifier: 'Response within 1 business day',
    reassurance: ['Reply within 1 business day', 'Typical start in 2-3 weeks'],
    image: '/placeholder.jpg',
    imageAlt: 'Hero image',
    proof: {
      heading: 'Trusted by founders',
      items: [
        {
          quote: 'Fast, thoughtful, and reliable.',
          name: 'Alex',
          role: 'Founder',
          org: 'Acme Co',
          outcome: 'Launch in weeks'
        }
      ]
    }
  },
  stickyCta: {
    message: 'Tell me about your project.'
  },
  booking: {
    heading: 'Book a call',
    subheading: 'A quick chat to scope the work.',
    headline: 'Let’s build something great.',
    intro: 'Share what you need and we will reply with next steps.',
    trustLine: 'No spam. One reply.'
  },
  trustedBy: {
    items: [{ name: 'Acme Co', logo: '/placeholder.jpg' }]
  },
  whyVd: {
    heading: 'Why Velvet Dinosaur',
    subheading: 'A small set of strong defaults.',
    badges: [{ label: 'Accessible', description: 'Built with contrast and semantics.', icon: 'Sparkles' }]
  },
  services: {
    heading: 'Services',
    items: [{ title: 'Websites', body: 'Design, build, and ship.', builtWith: 'Next.js' }]
  },
  pricing: {
    heading: 'Pricing',
    subheading: 'Transparent starting points.',
    baseline: {
      label: 'Baseline',
      price: '$2,500',
      includesSummary: 'A fast, responsive site.',
      includesNote: 'Tailored to your content.'
    },
    inclusions: ['Custom theme', 'CMS pages', 'Performance budget'],
    includesHeading: 'Includes',
    clarifiers: [
      { heading: 'What affects price', bullets: ['Content volume', 'Integrations', 'Custom components'] },
      { heading: 'Notes', bullets: ['We will scope together.'] }
    ],
    vatNote: 'Taxes may apply.',
    hostingHeading: 'Hosting',
    hostingItems: ['Fast CDN', 'Secure uploads'],
    complexityNote: 'Complex features may increase cost.',
    ctas: {
      primary: { label: 'Book a call', href: '#booking' },
      secondary: { label: 'Email', href: 'mailto:hello@example.com' }
    }
  },
  caseStudies: {
    heading: 'Case studies',
    subheading: 'A few recent builds.',
    cards: [
      {
        title: 'Launch site',
        eyebrow: 'Acme Co',
        description: 'A fast marketing site with CMS.',
        result: 'Improved conversions',
        images: ['/placeholder.jpg'],
        cta: { label: 'View build', href: '#' },
        metrics: [{ label: 'Speed', value: '100' }]
      }
    ]
  },
  process: {
    eyebrow: 'Process',
    heading: 'How we work',
    subheading: 'Clear steps, no surprises.',
    note: 'We keep scope and timelines explicit.',
    steps: [
      { title: 'Kickoff', body: 'Align on goals and constraints.' },
      { title: 'Build', body: 'Ship in small, reviewable pieces.' },
      { title: 'Launch', body: 'Deploy and validate.' }
    ]
  },
  editing: {
    heading: 'Editing',
    subheading: 'Update content without touching code.',
    editableItems: ['Text', 'Images', 'Links'],
    safetyNet: { title: 'Safety net', description: 'Drafts and backups keep you safe.' }
  },
  faq: {
    heading: 'FAQ',
    subheading: 'Quick answers to common questions.',
    items: [{ question: 'How long does it take?', answer: 'Typically 2-3 weeks.' }]
  },
  testimonials: {
    heading: 'Testimonials',
    items: [
      {
        quote: 'Exactly what we needed.',
        name: 'Jamie',
        roleOrContext: 'CEO',
        org: 'Acme Co',
        outcome: 'Faster launches'
      }
    ]
  },
  footer: {
    links: [{ label: 'Privacy', href: '/legal' }],
    copyright: 'Velvet Dinosaur'
  }
};
