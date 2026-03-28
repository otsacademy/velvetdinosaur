import type { NewsEditorDocumentSettings } from '@/lib/news-editor-document-settings';

export const DEMO_NEWS_STORAGE_KEY = 'vd:demo-news-editor:v1';
export const DEMO_NEWS_SEED_SLUG = 'why-story-led-sites-turn-interest-into-enquiries';

export type DemoNewsStatus = 'draft' | 'scheduled' | 'published';

export type DemoNewsDocument = {
  title: string;
  slug: string;
  tag: string;
  tags: string[];
  desc: string;
  heroImage: string;
  imageCaption: string;
  authorName: string;
  authorImage: string;
  publishDate: string;
  publishAt: string;
  status: DemoNewsStatus;
  openGraphTitle: string;
  openGraphDescription: string;
  openGraphImage: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  seoTitle: string;
  seoDescription: string;
  seoSource: 'manual' | 'auto' | null;
  seoNeedsReview: boolean;
  editorSettings: NewsEditorDocumentSettings;
  content: unknown[];
};

export type DemoNewsHistoryItem = {
  id: string;
  createdAt: string;
  status: DemoNewsStatus;
  title: string;
  slug: string;
  snapshot: DemoNewsDocument;
};

const HERO_IMAGE = '/assets/demo-media/news/hero-shoot/cover-story-board.svg';
const AUTHOR_IMAGE = '/assets/demo-media/news/interviews/founder-portrait.svg';

export function createDemoNewsSeedDocument(): DemoNewsDocument {
  return {
    title: 'Why Story-Led Sites Turn Interest Into Enquiries',
    slug: DEMO_NEWS_SEED_SLUG,
    tag: 'Editorial Strategy',
    tags: ['Content Design', 'Sales Enablement', 'Hospitality'],
    desc: 'A fictional long-form article showing how structured stories, proof, and useful next steps can make a service-led website convert more calmly.',
    heroImage: HERO_IMAGE,
    imageCaption: 'Demo editorial artwork created for the Sauro CMS sandbox.',
    authorName: 'Martha Vale',
    authorImage: AUTHOR_IMAGE,
    publishDate: '2026-03-23',
    publishAt: '',
    status: 'draft',
    openGraphTitle: 'Why Story-Led Sites Turn Interest Into Enquiries',
    openGraphDescription:
      'A fictional Sauro CMS article exploring why narrative-led websites help visitors qualify themselves before they make contact.',
    openGraphImage: HERO_IMAGE,
    twitterTitle: 'Why Story-Led Sites Turn Interest Into Enquiries',
    twitterDescription:
      'A fictional Sauro CMS article about narrative structure, proof, and clearer enquiry paths.',
    twitterImage: HERO_IMAGE,
    seoTitle: 'Why Story-Led Sites Turn Interest Into Enquiries',
    seoDescription:
      'A demo article about editorial website structure, proof-led content, and calmer conversion paths.',
    seoSource: 'manual',
    seoNeedsReview: false,
    editorSettings: {
      fontFamily: 'serif',
      fullWidth: false,
      smallText: false,
      lockPage: false,
    },
    content: [
      {
        type: 'img',
        url: HERO_IMAGE,
        alt: 'Editorial cover artwork for the fictional article',
        caption: 'A fictional cover visual used only inside the demo editor.',
        children: [{ text: '' }],
      },
      {
        type: 'p',
        children: [
          {
            text: 'Most service websites explain what they do, but the strongest ones also guide the visitor through why it matters, what proof looks like, and what the next step should be.'
          }
        ]
      },
      {
        type: 'p',
        children: [
          {
            text: 'That shift from brochure copy to story-led structure does not require more noise. It requires better sequencing: a clear tension, a practical point of view, and enough evidence for the right client to recognise themselves.'
          }
        ]
      },
      {
        type: 'h2',
        children: [{ text: 'Where brochure-style pages fall short' }],
      },
      {
        type: 'p',
        children: [
          {
            text: 'Brochure pages tend to flatten everything into a list of services. Visitors see capabilities, but they do not always understand the process, the fit, or the business value behind the work.'
          }
        ]
      },
      {
        type: 'ul',
        children: [
          { type: 'li', children: [{ text: 'They answer “what” before they answer “why now”.' }] },
          { type: 'li', children: [{ text: 'They hide proof deep in the page instead of using it as momentum.' }] },
          { type: 'li', children: [{ text: 'They ask for contact before a visitor feels oriented.' }] },
        ],
      },
      {
        type: 'h2',
        children: [{ text: 'What a narrative structure changes' }],
      },
      {
        type: 'p',
        children: [
          {
            text: 'A better editorial rhythm gives each section one job. One section frames the problem, another gives proof, another shows the method, and another makes the next step feel obvious.'
          }
        ]
      },
      {
        type: 'blockquote',
        children: [
          {
            type: 'p',
            children: [
              {
                text: 'The best enquiry pages do not shout louder. They reduce the amount of guessing a good client has to do.'
              }
            ]
          }
        ]
      },
      {
        type: 'h2',
        children: [{ text: 'A practical editing rhythm for smaller teams' }],
      },
      {
        type: 'p',
        children: [
          {
            text: 'Teams rarely need a newsroom-sized process. They need a steady cadence, a useful template, and the confidence to refresh examples, proof points, and calls to action without asking a developer every time.'
          }
        ]
      },
      {
        type: 'table',
        children: [
          {
            type: 'tr',
            children: [
              { type: 'th', children: [{ text: 'Editorial task' }] },
              { type: 'th', children: [{ text: 'Purpose on the page' }] },
            ],
          },
          {
            type: 'tr',
            children: [
              { type: 'td', children: [{ text: 'Refresh lead example' }] },
              { type: 'td', children: [{ text: 'Keeps proof recent and believable' }] },
            ],
          },
          {
            type: 'tr',
            children: [
              { type: 'td', children: [{ text: 'Tighten summary and metadata' }] },
              { type: 'td', children: [{ text: 'Improves search snippets and sharing context' }] },
            ],
          },
          {
            type: 'tr',
            children: [
              { type: 'td', children: [{ text: 'Swap imagery for a more specific example' }] },
              { type: 'td', children: [{ text: 'Builds trust faster than generic stock visuals' }] },
            ],
          },
        ],
      },
      {
        type: 'h2',
        children: [{ text: 'What this demo is showing' }],
      },
      {
        type: 'p',
        children: [
          {
            text: 'This sample article exists purely to demonstrate the Sauro CMS editorial workspace. Every title change, upload, save, preview, and publish action stays inside the demo and resets when the session ends.'
          }
        ]
      },
    ],
  };
}
