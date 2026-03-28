import {
  visualValueToBodyHtml,
  visualValueToPlainText,
  type DemoEmailTemplateVisualNode
} from '@/lib/demo-email-template-visual';

export type DemoNewsletterStatus = 'not_consented' | 'pending' | 'subscribed' | 'unsubscribed';
export type DemoNewsletterCampaignStatus = 'draft' | 'queued' | 'sending' | 'completed' | 'cancelled';
export type DemoNewsletterDeliveryStatus =
  | 'pending'
  | 'sent'
  | 'failed'
  | 'skipped_no_consent'
  | 'skipped_unsubscribed'
  | 'skipped_suppressed';

export type DemoNewsletterSubscriber = {
  id: string;
  email: string;
  firstName: string;
  status: DemoNewsletterStatus;
  updatedAt: string | null;
};

export type DemoNewsletterCampaign = {
  id: string;
  name: string;
  subject: string;
  preheader: string;
  htmlBody: string;
  textBody: string;
  visualBody: unknown[];
  status: DemoNewsletterCampaignStatus;
  scheduledAt: string | null;
  recipientSnapshotCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  createdAt: string | null;
};

export type DemoNewsletterDelivery = {
  id: string;
  campaignId: string;
  email: string;
  firstName: string;
  status: DemoNewsletterDeliveryStatus;
  postmarkMessageId: string;
  sentAt: string | null;
  error: string;
  attempts: number;
  createdAt: string | null;
};

export type DemoNewsletterSettings = {
  requireDoubleOptIn: boolean;
  enableHoneypot: boolean;
  minSecondsToSubmit: number;
  rateLimitPerIpPerMinute: number;
  rateLimitPerIpPerHour: number;
  rateLimitPerEmailPerDay: number;
  requireCaptcha: boolean;
  captchaProvider: 'none' | 'turnstile';
  turnstileSiteKey: string;
  turnstileSecretKey: string;
  pendingTokenTtlMinutes: number;
  resendConfirmationCooldownMinutes: number;
  blockSuppressedAddresses: boolean;
};

export type DemoNewsletterContentItem = {
  slug: string;
  title: string;
  dateLabel: string;
};

export type DemoNewsletterFormState = {
  campaignId: string;
  name: string;
  subject: string;
  preheader: string;
  htmlBody: string;
  textBody: string;
  visualBody: unknown[];
  scheduledAt: string;
};

export type DemoNewsletterSeed = {
  campaigns: DemoNewsletterCampaign[];
  subscribers: DemoNewsletterSubscriber[];
  deliveries: DemoNewsletterDelivery[];
  settings: DemoNewsletterSettings;
  defaults: {
    visualBody: DemoEmailTemplateVisualNode[];
    htmlBody: string;
    textBody: string;
  };
  newsOptions: DemoNewsletterContentItem[];
  eventOptions: DemoNewsletterContentItem[];
};

export const DEFAULT_DEMO_NEWSLETTER_SETTINGS: DemoNewsletterSettings = {
  requireDoubleOptIn: true,
  enableHoneypot: true,
  minSecondsToSubmit: 3,
  rateLimitPerIpPerMinute: 20,
  rateLimitPerIpPerHour: 120,
  rateLimitPerEmailPerDay: 8,
  requireCaptcha: false,
  captchaProvider: 'none',
  turnstileSiteKey: '',
  turnstileSecretKey: '',
  pendingTokenTtlMinutes: 4320,
  resendConfirmationCooldownMinutes: 15,
  blockSuppressedAddresses: true
};

function cloneVisualNodes(value: DemoEmailTemplateVisualNode[]): DemoEmailTemplateVisualNode[] {
  return value.map((node) => ({
    ...node,
    children: Array.isArray(node.children) ? cloneVisualNodes(node.children) : undefined
  }));
}

function createParagraph(text: string): DemoEmailTemplateVisualNode {
  return { type: 'p', children: [{ text }] };
}

function createHeading(level: 'h2' | 'h3', text: string): DemoEmailTemplateVisualNode {
  return { type: level, children: [{ text }] };
}

function createBlockquote(text: string): DemoEmailTemplateVisualNode {
  return { type: 'blockquote', children: [{ text }] };
}

function createList(items: string[]): DemoEmailTemplateVisualNode {
  return {
    type: 'ul',
    children: items.map((item) => ({
      type: 'li',
      children: [{ type: 'p', children: [{ text: item }] }]
    }))
  };
}

function createNewsletterVisualBody(input: {
  intro: string;
  newsDirective: string;
  quote: string;
  eventsDirective: string;
  checklist: string[];
  signoff: string;
}) {
  return [
    createParagraph('Hello {{firstName}},'),
    createParagraph(input.intro),
    createHeading('h2', 'What changed this month'),
    createParagraph(input.newsDirective),
    createBlockquote(input.quote),
    createHeading('h2', 'Dates to keep'),
    createParagraph(input.eventsDirective),
    createHeading('h3', 'Before you join us'),
    createList(input.checklist),
    createParagraph('Warmly,'),
    createParagraph(input.signoff)
  ];
}

function createCampaignContent(visualBody: DemoEmailTemplateVisualNode[]) {
  const visual = cloneVisualNodes(visualBody);
  return {
    visualBody: visual,
    htmlBody: visualValueToBodyHtml(visual),
    textBody: visualValueToPlainText(visual)
  };
}

export function toDateTimeLocalInput(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function fromDateTimeLocalInput(value: string) {
  if (!value.trim()) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString();
}

export function formatNewsletterDate(value: string | null) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleString();
}

export function buildDemoNewsletterForm(defaults: DemoNewsletterSeed['defaults']): DemoNewsletterFormState {
  return {
    campaignId: '',
    name: 'Harbour & Pine Monthly',
    subject: 'New studio work, launch notes, and upcoming sessions',
    preheader: 'A calmer monthly round-up from Harbour & Pine.',
    htmlBody: defaults.htmlBody,
    textBody: defaults.textBody,
    visualBody: cloneVisualNodes(defaults.visualBody),
    scheduledAt: ''
  };
}

export function createDemoNewsletterSeed(): DemoNewsletterSeed {
  const defaultContent = createCampaignContent(
    createNewsletterVisualBody({
      intro: 'Here is the latest round-up from {{siteName}}, including new studio work, the latest launch notes, and the next round of sessions.',
      newsDirective: '{{newsHighlights}}',
      quote: 'Quiet decisions, warmer materials, and a much calmer booking flow.',
      eventsDirective: '{{eventHighlights}}',
      checklist: [
        'Bring one live brief if you want direct feedback during the demo session.',
        'Reply directly to this draft if you would like the studio checklist sent over afterwards.'
      ],
      signoff: 'The Harbour & Pine team'
    })
  );
  const aprilContent = createCampaignContent(
    createNewsletterVisualBody({
      intro: 'April is shaping up around lighter launch prep, a cleaner booking journey, and a few useful working sessions for hospitality founders.',
      newsDirective: '{{newsHighlights:journal-refresh,studio-notes}}',
      quote: 'The goal is not louder publishing. It is calmer operations once the site is live.',
      eventsDirective: '{{eventHighlights:april-salon,content-clinic}}',
      checklist: [
        'Hold two image selects back for launch week so the newsletter still feels current.',
        'Use the content clinic to test the next issue before it goes into a real schedule.'
      ],
      signoff: 'Harbour & Pine Studio'
    })
  );
  const draftContent = createCampaignContent(
    createNewsletterVisualBody({
      intro: 'This draft is being shaped for partners who want a quieter progress note before the next studio cycle opens.',
      newsDirective: '{{newsHighlights}}',
      quote: 'A good partner note should feel composed, clear, and genuinely useful in under a minute.',
      eventsDirective: '{{eventHighlights}}',
      checklist: [
        'Lead with one clear update rather than a stack of minor announcements.',
        'Keep the sign-off personal so the message still feels like studio correspondence.'
      ],
      signoff: 'Amelia at Harbour & Pine'
    })
  );
  const defaults = defaultContent;

  return {
    defaults,
    campaigns: [
      {
        id: 'cmp-harbour-march',
        name: 'March Studio Notes',
        subject: 'A quieter booking flow and a new studio journal',
        preheader: 'The latest design notes, launch planning, and April sessions.',
        htmlBody: defaultContent.htmlBody,
        textBody: defaultContent.textBody,
        visualBody: cloneVisualNodes(defaultContent.visualBody),
        status: 'completed',
        scheduledAt: '2026-03-10T09:00:00.000Z',
        recipientSnapshotCount: 6,
        sentCount: 4,
        failedCount: 0,
        skippedCount: 2,
        createdAt: '2026-03-07T10:10:00.000Z'
      },
      {
        id: 'cmp-harbour-april',
        name: 'April Booking Update',
        subject: 'April availability, studio sessions, and a booking refresh',
        preheader: 'A preview of the next release and the latest client work.',
        htmlBody: aprilContent.htmlBody,
        textBody: aprilContent.textBody,
        visualBody: cloneVisualNodes(aprilContent.visualBody),
        status: 'queued',
        scheduledAt: '2026-04-04T08:30:00.000Z',
        recipientSnapshotCount: 5,
        sentCount: 0,
        failedCount: 0,
        skippedCount: 0,
        createdAt: '2026-03-22T14:00:00.000Z'
      },
      {
        id: 'cmp-harbour-draft',
        name: 'May Partner Note',
        subject: 'A draft partner note for the next studio cycle',
        preheader: 'Still being shaped inside the demo.',
        htmlBody: draftContent.htmlBody,
        textBody: draftContent.textBody,
        visualBody: cloneVisualNodes(draftContent.visualBody),
        status: 'draft',
        scheduledAt: null,
        recipientSnapshotCount: 0,
        sentCount: 0,
        failedCount: 0,
        skippedCount: 0,
        createdAt: '2026-03-23T08:20:00.000Z'
      }
    ],
    subscribers: [
      { id: 'sub-1', email: 'amelia@harbourandpine.example', firstName: 'Amelia', status: 'subscribed', updatedAt: '2026-03-20T08:00:00.000Z' },
      { id: 'sub-2', email: 'leo@shorelinepartner.example', firstName: 'Leo', status: 'subscribed', updatedAt: '2026-03-18T12:15:00.000Z' },
      { id: 'sub-3', email: 'nina@studiowatch.example', firstName: 'Nina', status: 'pending', updatedAt: '2026-03-22T10:45:00.000Z' },
      { id: 'sub-4', email: 'evan@ateliernorth.example', firstName: 'Evan', status: 'subscribed', updatedAt: '2026-03-17T09:10:00.000Z' },
      { id: 'sub-5', email: 'zoe@quiettype.example', firstName: 'Zoe', status: 'unsubscribed', updatedAt: '2026-03-09T16:00:00.000Z' },
      { id: 'sub-6', email: 'marta@storylight.example', firstName: 'Marta', status: 'not_consented', updatedAt: '2026-03-21T11:20:00.000Z' },
      { id: 'sub-7', email: 'isaac@oakharbour.example', firstName: 'Isaac', status: 'subscribed', updatedAt: '2026-03-14T14:30:00.000Z' }
    ],
    deliveries: [
      {
        id: 'del-1',
        campaignId: 'cmp-harbour-march',
        email: 'amelia@harbourandpine.example',
        firstName: 'Amelia',
        status: 'sent',
        postmarkMessageId: 'pm_00081',
        sentAt: '2026-03-10T09:01:00.000Z',
        error: '',
        attempts: 1,
        createdAt: '2026-03-10T09:00:00.000Z'
      },
      {
        id: 'del-2',
        campaignId: 'cmp-harbour-march',
        email: 'leo@shorelinepartner.example',
        firstName: 'Leo',
        status: 'sent',
        postmarkMessageId: 'pm_00082',
        sentAt: '2026-03-10T09:02:00.000Z',
        error: '',
        attempts: 1,
        createdAt: '2026-03-10T09:00:00.000Z'
      },
      {
        id: 'del-3',
        campaignId: 'cmp-harbour-march',
        email: 'zoe@quiettype.example',
        firstName: 'Zoe',
        status: 'skipped_unsubscribed',
        postmarkMessageId: '',
        sentAt: null,
        error: '',
        attempts: 0,
        createdAt: '2026-03-10T09:00:00.000Z'
      },
      {
        id: 'del-4',
        campaignId: 'cmp-harbour-march',
        email: 'marta@storylight.example',
        firstName: 'Marta',
        status: 'skipped_no_consent',
        postmarkMessageId: '',
        sentAt: null,
        error: '',
        attempts: 0,
        createdAt: '2026-03-10T09:00:00.000Z'
      }
    ],
    settings: DEFAULT_DEMO_NEWSLETTER_SETTINGS,
    newsOptions: [
      { slug: 'journal-refresh', title: 'The studio journal now mirrors launch status automatically', dateLabel: '19 Mar 2026' },
      { slug: 'studio-notes', title: 'How the booking flow was simplified for calmer handovers', dateLabel: '14 Mar 2026' },
      { slug: 'asset-cadence', title: 'Building a media library your clients actually keep tidy', dateLabel: '02 Mar 2026' }
    ],
    eventOptions: [
      { slug: 'april-salon', title: 'April design salon for hospitality founders', dateLabel: '04 Apr 2026' },
      { slug: 'content-clinic', title: 'Content clinic: shaping calmer editorial workflows', dateLabel: '11 Apr 2026' },
      { slug: 'launch-day', title: 'Launch-day rehearsal session', dateLabel: '24 Apr 2026' }
    ]
  };
}
