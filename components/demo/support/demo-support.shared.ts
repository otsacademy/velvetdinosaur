'use client';

export const SUPPORT_WAITING_ON = ['support', 'customer'] as const;
export type SupportWaitingOn = (typeof SUPPORT_WAITING_ON)[number];

export const SUPPORT_PRIORITIES = ['1-critical', '2-high', '3-medium', '4-low', '5-standard'] as const;
export type SupportPriority = (typeof SUPPORT_PRIORITIES)[number];

export const SUPPORT_TICKET_OPEN_STATUSES = [
  'open',
  'in_progress',
  'monitor',
  'in_configuration',
  'on_hold',
  'wish_list',
  'pre_development',
  'development_list',
  'report_new_update',
  'second_line_support',
  'uat',
  'setup',
  'future_release',
  'onboarding'
] as const;

export const SUPPORT_TICKET_CLOSED_STATUSES = ['resolved', 'closed'] as const;

export const SUPPORT_TICKET_STATUSES = [...SUPPORT_TICKET_OPEN_STATUSES, ...SUPPORT_TICKET_CLOSED_STATUSES] as const;
export type SupportTicketStatus = (typeof SUPPORT_TICKET_STATUSES)[number];

export const SUPPORT_TICKET_CATEGORIES = [
  {
    key: 'support_request',
    label: 'General Support',
    description: 'I have a question or need help with something.',
    customerVisible: true
  },
  {
    key: 'content_update',
    label: 'Content Update',
    description: 'I need text, images, or information changed on the website.',
    customerVisible: true
  },
  {
    key: 'technical_issue',
    label: 'Technical Issue',
    description: "Something isn't working properly or looks broken.",
    customerVisible: true
  },
  {
    key: 'feature_request',
    label: 'Feature Request',
    description: "I'd like something new added to the website. This may require a quote.",
    customerVisible: true
  },
  {
    key: 'access_permissions',
    label: 'Access & Permissions',
    description: 'Login, role, and account access support.',
    customerVisible: false
  }
] as const;
export type SupportTicketCategory = (typeof SUPPORT_TICKET_CATEGORIES)[number]['key'];

export const SUPPORT_TICKET_MODULES = [
  { key: 'homepage', label: 'Homepage' },
  { key: 'services', label: 'Services & About Pages' },
  { key: 'portfolio', label: 'Portfolio & Case Studies' },
  { key: 'cms', label: 'Sauro CMS Workspace' },
  { key: 'booking', label: 'Booking & Enquiries' },
  { key: 'global_content', label: 'Header / Footer / Shared Content' },
  { key: 'automation', label: 'Automation & Notifications' },
  { key: 'other', label: "Other / I'm not sure" }
] as const;
export type SupportTicketModule = (typeof SUPPORT_TICKET_MODULES)[number]['key'];

export type SupportTicketSummary = {
  id: string;
  ticketRef: string;
  createdByUserId: string;
  createdByEmail: string;
  createdByName?: string;
  createdByAvatarUrl?: string;
  organization: string;
  category: SupportTicketCategory;
  categoryLabel: string;
  module: string;
  priority: SupportPriority;
  priorityLabel: string;
  requestedDate: string | null;
  caseRefs: string[];
  pageUrl: string;
  subject: string;
  status: SupportTicketStatus;
  statusLabel: string;
  waitingOn: SupportWaitingOn;
  notes: string;
  assignedToUserId: string;
  assignedToEmail: string;
  assignedToName?: string;
  assignedToAvatarUrl?: string;
  messageCount: number;
  lastActivityAt: string | null;
  closedAt: string | null;
  satisfactionRating: number | null;
  satisfactionComment: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type SupportTicketDetail = SupportTicketSummary & {
  descriptionHtml: string;
  descriptionText: string;
};

export type SupportTicketMessage = {
  id: string;
  ticketId: string;
  authorUserId: string;
  authorEmail: string;
  authorName: string;
  authorRole: 'admin-requester' | 'support-agent' | 'system';
  authorDisplayName?: string;
  authorAvatarUrl?: string;
  authorType?: 'requester' | 'staff' | 'automation';
  bodyHtml: string;
  bodyText: string;
  attachments: Array<{ key: string; name: string; url: string; mime: string; size: number | null }>;
  isInternal: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type SupportTicketEvent = {
  id: string;
  ticketId: string;
  eventType: 'ticket_created' | 'message_added' | 'status_changed' | 'reopened' | 'closed' | 'updated';
  actorUserId: string;
  actorEmail: string;
  actorName: string;
  actorRole: 'admin-requester' | 'support-agent' | 'system';
  fromStatus: SupportTicketStatus | '';
  toStatus: SupportTicketStatus | '';
  fromWaitingOn: SupportWaitingOn | '';
  toWaitingOn: SupportWaitingOn | '';
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string | null;
  updatedAt: string | null;
};

export type SupportTicketRating = {
  id: string;
  ticketId: string;
  rating: number;
  comment: string;
  submittedByUserId: string;
  submittedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type SupportTicketThread = {
  ticket: SupportTicketDetail;
  messages: SupportTicketMessage[];
  events: SupportTicketEvent[];
  ratings: SupportTicketRating[];
};

export type SupportOverview = {
  totals: {
    total: number;
    requiringOurInput: number;
    requiringYourInput: number;
    open: number;
    closed: number;
  };
  monthly: Array<{ month: number; label: string; count: number }>;
  categories: Array<{ key: SupportTicketCategory; label: string; count: number }>;
  recentTickets: SupportTicketSummary[];
};

export type SupportSystemCheck = {
  key: string;
  label: string;
  status: 'operational' | 'degraded' | 'outage' | 'unknown';
  detail: string;
  updatedAt: string | null;
};

export type SupportSystemIncident = {
  id: string;
  title: string;
  status: string;
  detail: string;
  startedAt: string | null;
  resolvedAt: string | null;
};

export type SupportSystemStatusPayload = {
  configured: boolean;
  source: 'live' | 'snapshot' | 'unavailable';
  fetchedAt: string | null;
  summary: {
    totalChecks: number;
    operational: number;
    degraded: number;
    outage: number;
    unknown: number;
    incidents: number;
  };
  checks: SupportSystemCheck[];
  incidents: SupportSystemIncident[];
  error?: string;
};

export type SupportDevelopmentHourItem = {
  module: string;
  planned: number;
  used: number;
  remaining: number;
  updatedAt: string | null;
};

export type SupportDevelopmentHoursPayload = {
  configured: boolean;
  source: 'live' | 'snapshot' | 'unavailable';
  fetchedAt: string | null;
  totals: {
    planned: number;
    used: number;
    remaining: number;
    period: string;
  };
  items: SupportDevelopmentHourItem[];
  error?: string;
};

export type SupportDocSummary = {
  id: string;
  title: string;
  description: string;
  module: string;
  category: string;
  tags: string[];
  linkType: 'download' | 'view';
  url: string;
  searchable: boolean;
  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type SupportArticleSummary = {
  id: string;
  title: string;
  slug: string;
  type: 'knowledge' | 'announcement' | 'feature';
  category: string;
  module: string;
  tags: string[];
  summary: string;
  bodyText: string;
  searchable: boolean;
  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type SupportGlobalSearchResult = {
  kind: 'ticket' | 'doc' | 'article';
  id: string;
  title: string;
  subtitle: string;
  link: string;
  updatedAt: string | null;
  status: string;
};

export type TicketCreateState = {
  subject: string;
  category: SupportTicketCategory;
  module: SupportTicketModule;
  priority: SupportPriority;
  requestedDate: string;
  pageUrl: string;
  descriptionText: string;
};

export type SupportWorkspaceTab = 'my-requests' | 'report-problem' | 'request-feature' | 'support-tools' | 'past-requests';

export const SUPPORT_WORKSPACE_TABS: Array<{ value: SupportWorkspaceTab; label: string }> = [
  { value: 'my-requests', label: 'My Requests' },
  { value: 'report-problem', label: 'Report a Problem' },
  { value: 'request-feature', label: 'Request a Feature' },
  { value: 'support-tools', label: 'Support Toolkit' },
  { value: 'past-requests', label: 'Past Requests' }
];

const CATEGORY_LABEL_BY_KEY = new Map(SUPPORT_TICKET_CATEGORIES.map((item) => [item.key, item.label]));
const MODULE_LABEL_BY_KEY = new Map(SUPPORT_TICKET_MODULES.map((item) => [item.key, item.label]));
const STATUS_LABEL_BY_KEY = new Map<SupportTicketStatus, string>([
  ['open', 'Open'],
  ['in_progress', 'In Progress'],
  ['monitor', 'Monitor'],
  ['in_configuration', 'In Configuration'],
  ['on_hold', 'On Hold'],
  ['wish_list', 'Wish List'],
  ['pre_development', 'Pre Development'],
  ['development_list', 'Development List'],
  ['report_new_update', 'New/Update to Report'],
  ['second_line_support', '2nd Line Support'],
  ['uat', 'UAT'],
  ['setup', 'Setup'],
  ['future_release', 'Future Release'],
  ['onboarding', 'Onboarding'],
  ['resolved', 'Resolved'],
  ['closed', 'Closed']
]);
const PRIORITY_LABEL_BY_KEY = new Map<SupportPriority, string>([
  ['1-critical', 'Urgent'],
  ['2-high', 'Soon'],
  ['3-medium', 'Soon'],
  ['4-low', 'When you can'],
  ['5-standard', 'When you can']
]);
const WAITING_ON_LABEL_BY_KEY = new Map<SupportWaitingOn, string>([
  ['support', "We're working on this"],
  ['customer', 'Needs your response']
]);

const DEMO_ORGANISATION = 'Harbour & Pine Demo';
const DEMO_SUPPORT_NAME = 'Velvet Dinosaur Support';
const DEMO_SUPPORT_EMAIL = 'support@velvetdinosaur.com';
const DEMO_SUPPORT_USER_ID = 'vd-support';
const DEMO_SUPPORT_AVATAR = '/logo.webp';

const MONTHLY_VOLUME = [
  { month: 1, label: 'Jan', count: 2 },
  { month: 2, label: 'Feb', count: 3 },
  { month: 3, label: 'Mar', count: 5 },
  { month: 4, label: 'Apr', count: 4 },
  { month: 5, label: 'May', count: 3 },
  { month: 6, label: 'Jun', count: 4 },
  { month: 7, label: 'Jul', count: 2 },
  { month: 8, label: 'Aug', count: 3 },
  { month: 9, label: 'Sep', count: 4 },
  { month: 10, label: 'Oct', count: 2 },
  { month: 11, label: 'Nov', count: 1 },
  { month: 12, label: 'Dec', count: 2 }
] as const;

export const EMPTY_OVERVIEW: SupportOverview = {
  totals: {
    total: 0,
    requiringOurInput: 0,
    requiringYourInput: 0,
    open: 0,
    closed: 0
  },
  monthly: [],
  categories: [],
  recentTickets: []
};

export function initialTicketCreateState(): TicketCreateState {
  return {
    subject: '',
    category: 'support_request',
    module: 'other',
    priority: '5-standard',
    requestedDate: '',
    pageUrl: '',
    descriptionText: ''
  };
}

export function initialProblemCreateState(): TicketCreateState {
  return {
    ...initialTicketCreateState(),
    category: 'technical_issue',
    priority: '3-medium'
  };
}

export function initialFeatureCreateState(): TicketCreateState {
  return {
    ...initialTicketCreateState(),
    category: 'feature_request',
    priority: '5-standard'
  };
}

export function supportStatusIsOpen(status: SupportTicketStatus) {
  return SUPPORT_TICKET_OPEN_STATUSES.includes(status as (typeof SUPPORT_TICKET_OPEN_STATUSES)[number]);
}

export function supportCategoryLabel(category: SupportTicketCategory | string) {
  return CATEGORY_LABEL_BY_KEY.get(category as SupportTicketCategory) || 'General Support';
}

export function supportStatusLabel(status: SupportTicketStatus | string) {
  return STATUS_LABEL_BY_KEY.get(status as SupportTicketStatus) || 'Open';
}

export function supportPriorityLabel(priority: SupportPriority | string) {
  return PRIORITY_LABEL_BY_KEY.get(priority as SupportPriority) || 'When you can';
}

export function supportModuleLabel(module: string) {
  return MODULE_LABEL_BY_KEY.get(module as SupportTicketModule) || "Other / I'm not sure";
}

export function supportWaitingOnLabel(waitingOn: SupportWaitingOn | string) {
  return WAITING_ON_LABEL_BY_KEY.get(waitingOn as SupportWaitingOn) || "We're working on this";
}

export function formatDateTime(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';
}

function textToHtml(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${line}</p>`)
    .join('');
}

function buildThread({
  id,
  ticketRef,
  requesterName,
  requesterEmail,
  category,
  module,
  priority,
  status,
  waitingOn,
  subject,
  descriptionText,
  pageUrl,
  requestedDate,
  caseRefs,
  createdAt,
  updatedAt,
  closedAt,
  notes,
  messages,
  events,
  ratings
}: {
  id: string;
  ticketRef: string;
  requesterName: string;
  requesterEmail: string;
  category: SupportTicketCategory;
  module: SupportTicketModule;
  priority: SupportPriority;
  status: SupportTicketStatus;
  waitingOn: SupportWaitingOn;
  subject: string;
  descriptionText: string;
  pageUrl: string;
  requestedDate: string | null;
  caseRefs: string[];
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  notes: string;
  messages: SupportTicketMessage[];
  events?: SupportTicketEvent[];
  ratings?: SupportTicketRating[];
}): SupportTicketThread {
  const lastActivityAt = messages[0]?.createdAt || updatedAt;
  const rating = ratings?.[0] ?? null;

  return {
    ticket: {
      id,
      ticketRef,
      createdByUserId: `${id}-requester`,
      createdByEmail: requesterEmail,
      createdByName: requesterName,
      createdByAvatarUrl: '',
      organization: DEMO_ORGANISATION,
      category,
      categoryLabel: supportCategoryLabel(category),
      module,
      priority,
      priorityLabel: supportPriorityLabel(priority),
      requestedDate,
      caseRefs,
      pageUrl,
      subject,
      status,
      statusLabel: supportStatusLabel(status),
      waitingOn,
      notes,
      assignedToUserId: DEMO_SUPPORT_USER_ID,
      assignedToEmail: DEMO_SUPPORT_EMAIL,
      assignedToName: DEMO_SUPPORT_NAME,
      assignedToAvatarUrl: DEMO_SUPPORT_AVATAR,
      messageCount: messages.length,
      lastActivityAt,
      closedAt,
      satisfactionRating: rating?.rating ?? null,
      satisfactionComment: rating?.comment ?? '',
      createdAt,
      updatedAt,
      descriptionText,
      descriptionHtml: textToHtml(descriptionText)
    },
    messages,
    events: events ?? [],
    ratings: ratings ?? []
  };
}

export function deriveTicketSummaries(threads: SupportTicketThread[]) {
  return [...threads]
    .map((thread) => ({
      ...thread.ticket,
      messageCount: thread.messages.length,
      lastActivityAt: thread.messages[0]?.createdAt || thread.ticket.updatedAt
    }))
    .sort((left, right) => {
      const leftTime = left.lastActivityAt ? new Date(left.lastActivityAt).getTime() : 0;
      const rightTime = right.lastActivityAt ? new Date(right.lastActivityAt).getTime() : 0;
      return rightTime - leftTime;
    });
}

export function createSupportOverview(tickets: SupportTicketSummary[]): SupportOverview {
  const categories = SUPPORT_TICKET_CATEGORIES.filter((item) => item.customerVisible !== false).map((item) => ({
    key: item.key,
    label: item.label,
    count: tickets.filter((ticket) => ticket.category === item.key).length
  }));

  const openTickets = tickets.filter((ticket) => supportStatusIsOpen(ticket.status));
  const closedTickets = tickets.filter((ticket) => !supportStatusIsOpen(ticket.status));

  return {
    totals: {
      total: tickets.length,
      requiringOurInput: tickets.filter((ticket) => supportStatusIsOpen(ticket.status) && ticket.waitingOn === 'support').length,
      requiringYourInput: tickets.filter((ticket) => supportStatusIsOpen(ticket.status) && ticket.waitingOn === 'customer').length,
      open: openTickets.length,
      closed: closedTickets.length
    },
    monthly: MONTHLY_VOLUME.map((item) => ({ ...item })),
    categories,
    recentTickets: tickets.slice(0, 5)
  };
}

export function deriveSupportSearchResults(
  query: string,
  tickets: SupportTicketSummary[],
  documents: SupportDocSummary[],
  articles: SupportArticleSummary[]
) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [] as SupportGlobalSearchResult[];

  const ticketResults = tickets
    .filter((ticket) =>
      [ticket.ticketRef, ticket.subject, ticket.createdByName, ticket.createdByEmail, ticket.categoryLabel, ticket.module]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
    )
    .map<SupportGlobalSearchResult>((ticket) => ({
      kind: 'ticket',
      id: ticket.id,
      title: `${ticket.ticketRef} · ${ticket.subject}`,
      subtitle: `${ticket.createdByName || ticket.createdByEmail} · ${ticket.categoryLabel}`,
      link: ticket.id,
      updatedAt: ticket.lastActivityAt,
      status: ticket.status
    }));

  const documentResults = documents
    .filter((item) =>
      [item.title, item.description, item.category, item.module, item.tags.join(' ')]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
    )
    .map<SupportGlobalSearchResult>((item) => ({
      kind: 'doc',
      id: item.id,
      title: item.title,
      subtitle: `${item.category || 'Document'} · ${item.module || 'General'}`,
      link: `support-doc-${item.id}`,
      updatedAt: item.updatedAt,
      status: item.linkType
    }));

  const articleResults = articles
    .filter((item) =>
      [item.title, item.summary, item.bodyText, item.category, item.module, item.tags.join(' ')]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
    )
    .map<SupportGlobalSearchResult>((item) => ({
      kind: 'article',
      id: item.id,
      title: item.title,
      subtitle: `${item.type} · ${item.category || 'Support'} · ${item.module || 'General'}`,
      link: `support-article-${item.slug}`,
      updatedAt: item.updatedAt,
      status: item.type
    }));

  return [...ticketResults, ...documentResults, ...articleResults]
    .sort((left, right) => {
      const leftTime = left.updatedAt ? new Date(left.updatedAt).getTime() : 0;
      const rightTime = right.updatedAt ? new Date(right.updatedAt).getTime() : 0;
      return rightTime - leftTime;
    })
    .slice(0, 18);
}

export function createDemoSupportSeed() {
  const threads = [
    buildThread({
      id: 'support-ticket-1048',
      ticketRef: 'HP-1048',
      requesterName: 'Martha Jones',
      requesterEmail: 'martha@harbour-pine-demo.co.uk',
      category: 'technical_issue',
      module: 'booking',
      priority: '2-high',
      status: 'in_progress',
      waitingOn: 'support',
      subject: 'Discovery call slots are showing twice on Friday mornings',
      descriptionText:
        'Two Friday morning discovery-call slots are being shown in the public booking flow.\n\nThe duplicate only appears on mobile and makes the diary feel less reliable when we share the link with new enquiries.',
      pageUrl: 'https://harbour-pine-demo.co.uk/book-a-call',
      requestedDate: '2026-03-25',
      caseRefs: ['BOOK-22'],
      createdAt: '2026-03-22T09:10:00.000Z',
      updatedAt: '2026-03-23T09:18:00.000Z',
      closedAt: null,
      notes: 'Check slot merge logic against mobile timezone offsets.',
      messages: [
        {
          id: 'support-message-1048-3',
          ticketId: 'support-ticket-1048',
          authorUserId: DEMO_SUPPORT_USER_ID,
          authorEmail: DEMO_SUPPORT_EMAIL,
          authorName: DEMO_SUPPORT_NAME,
          authorRole: 'support-agent',
          authorDisplayName: DEMO_SUPPORT_NAME,
          authorAvatarUrl: DEMO_SUPPORT_AVATAR,
          authorType: 'staff',
          bodyHtml: textToHtml('We have reproduced this in the demo booking flow and are checking the slot merge rule now.'),
          bodyText: 'We have reproduced this in the demo booking flow and are checking the slot merge rule now.',
          attachments: [],
          isInternal: false,
          createdAt: '2026-03-23T09:18:00.000Z',
          updatedAt: '2026-03-23T09:18:00.000Z'
        },
        {
          id: 'support-message-1048-2',
          ticketId: 'support-ticket-1048',
          authorUserId: 'support-ticket-1048-requester',
          authorEmail: 'martha@harbour-pine-demo.co.uk',
          authorName: 'Martha Jones',
          authorRole: 'admin-requester',
          authorType: 'requester',
          bodyHtml: textToHtml('It only seems to happen on the public page rather than inside the dashboard preview.'),
          bodyText: 'It only seems to happen on the public page rather than inside the dashboard preview.',
          attachments: [],
          isInternal: false,
          createdAt: '2026-03-23T08:54:00.000Z',
          updatedAt: '2026-03-23T08:54:00.000Z'
        },
        {
          id: 'support-message-1048-1',
          ticketId: 'support-ticket-1048',
          authorUserId: 'support-ticket-1048-requester',
          authorEmail: 'martha@harbour-pine-demo.co.uk',
          authorName: 'Martha Jones',
          authorRole: 'admin-requester',
          authorType: 'requester',
          bodyHtml: textToHtml('Two Friday morning discovery-call slots are being shown in the public booking flow.'),
          bodyText: 'Two Friday morning discovery-call slots are being shown in the public booking flow.',
          attachments: [],
          isInternal: false,
          createdAt: '2026-03-22T09:10:00.000Z',
          updatedAt: '2026-03-22T09:10:00.000Z'
        }
      ]
    }),
    buildThread({
      id: 'support-ticket-1046',
      ticketRef: 'HP-1046',
      requesterName: 'Ben Hall',
      requesterEmail: 'studio@harbour-pine-demo.co.uk',
      category: 'content_update',
      module: 'portfolio',
      priority: '3-medium',
      status: 'on_hold',
      waitingOn: 'customer',
      subject: 'Replace three project photos with the new spring interiors set',
      descriptionText:
        'We want to replace the project hero images on the Northbridge and Alder case studies.\n\nThe new image set is ready, but I still need to send over the final captions for the portfolio grid.',
      pageUrl: 'https://harbour-pine-demo.co.uk/work',
      requestedDate: '2026-03-28',
      caseRefs: ['PORT-14'],
      createdAt: '2026-03-21T15:10:00.000Z',
      updatedAt: '2026-03-22T14:20:00.000Z',
      closedAt: null,
      notes: 'Waiting on final captions and alt text from customer.',
      messages: [
        {
          id: 'support-message-1046-2',
          ticketId: 'support-ticket-1046',
          authorUserId: DEMO_SUPPORT_USER_ID,
          authorEmail: DEMO_SUPPORT_EMAIL,
          authorName: DEMO_SUPPORT_NAME,
          authorRole: 'support-agent',
          authorDisplayName: DEMO_SUPPORT_NAME,
          authorAvatarUrl: DEMO_SUPPORT_AVATAR,
          authorType: 'staff',
          bodyHtml: textToHtml('We can queue the image swap as soon as the captions and alt text are final.'),
          bodyText: 'We can queue the image swap as soon as the captions and alt text are final.',
          attachments: [],
          isInternal: false,
          createdAt: '2026-03-22T14:20:00.000Z',
          updatedAt: '2026-03-22T14:20:00.000Z'
        },
        {
          id: 'support-message-1046-1',
          ticketId: 'support-ticket-1046',
          authorUserId: 'support-ticket-1046-requester',
          authorEmail: 'studio@harbour-pine-demo.co.uk',
          authorName: 'Ben Hall',
          authorRole: 'admin-requester',
          authorType: 'requester',
          bodyHtml: textToHtml('We want to replace the project hero images on the Northbridge and Alder case studies.'),
          bodyText: 'We want to replace the project hero images on the Northbridge and Alder case studies.',
          attachments: [],
          isInternal: false,
          createdAt: '2026-03-21T15:10:00.000Z',
          updatedAt: '2026-03-21T15:10:00.000Z'
        }
      ]
    }),
    buildThread({
      id: 'support-ticket-1043',
      ticketRef: 'HP-1043',
      requesterName: 'Ivy Sharpe',
      requesterEmail: 'ivy@harbour-pine-demo.co.uk',
      category: 'feature_request',
      module: 'cms',
      priority: '5-standard',
      status: 'future_release',
      waitingOn: 'support',
      subject: 'Could the editor show a quick checklist before publishing?',
      descriptionText:
        'The team would find it useful if the page editor offered a simple checklist before publishing.\n\nThe main points would be image alt text, heading order, and whether the page has a CTA in the final section.',
      pageUrl: 'https://harbour-pine-demo.co.uk/demo/new',
      requestedDate: null,
      caseRefs: ['CMS-09'],
      createdAt: '2026-03-18T11:32:00.000Z',
      updatedAt: '2026-03-21T10:11:00.000Z',
      closedAt: null,
      notes: 'Captured for a future editor quality-of-life release.',
      messages: [
        {
          id: 'support-message-1043-2',
          ticketId: 'support-ticket-1043',
          authorUserId: DEMO_SUPPORT_USER_ID,
          authorEmail: DEMO_SUPPORT_EMAIL,
          authorName: DEMO_SUPPORT_NAME,
          authorRole: 'support-agent',
          authorDisplayName: DEMO_SUPPORT_NAME,
          authorAvatarUrl: DEMO_SUPPORT_AVATAR,
          authorType: 'staff',
          bodyHtml: textToHtml('This has been added to the future-release list so we can scope it properly with the editor work.'),
          bodyText: 'This has been added to the future-release list so we can scope it properly with the editor work.',
          attachments: [],
          isInternal: false,
          createdAt: '2026-03-21T10:11:00.000Z',
          updatedAt: '2026-03-21T10:11:00.000Z'
        },
        {
          id: 'support-message-1043-1',
          ticketId: 'support-ticket-1043',
          authorUserId: 'support-ticket-1043-requester',
          authorEmail: 'ivy@harbour-pine-demo.co.uk',
          authorName: 'Ivy Sharpe',
          authorRole: 'admin-requester',
          authorType: 'requester',
          bodyHtml: textToHtml('The team would find it useful if the page editor offered a simple checklist before publishing.'),
          bodyText: 'The team would find it useful if the page editor offered a simple checklist before publishing.',
          attachments: [],
          isInternal: false,
          createdAt: '2026-03-18T11:32:00.000Z',
          updatedAt: '2026-03-18T11:32:00.000Z'
        }
      ]
    }),
    buildThread({
      id: 'support-ticket-1039',
      ticketRef: 'HP-1039',
      requesterName: 'Martha Jones',
      requesterEmail: 'martha@harbour-pine-demo.co.uk',
      category: 'support_request',
      module: 'global_content',
      priority: '4-low',
      status: 'resolved',
      waitingOn: 'customer',
      subject: 'How do we update the footer opening hours ourselves?',
      descriptionText:
        'We need a quick reminder of where the studio opening hours live in Sauro CMS.\n\nThe team remembered how to change the navigation, but not the footer content area.',
      pageUrl: 'https://harbour-pine-demo.co.uk',
      requestedDate: null,
      caseRefs: ['DOC-03'],
      createdAt: '2026-03-16T10:30:00.000Z',
      updatedAt: '2026-03-17T16:02:00.000Z',
      closedAt: '2026-03-17T16:02:00.000Z',
      notes: 'Resolved with documentation link and short handover video.',
      messages: [
        {
          id: 'support-message-1039-2',
          ticketId: 'support-ticket-1039',
          authorUserId: DEMO_SUPPORT_USER_ID,
          authorEmail: DEMO_SUPPORT_EMAIL,
          authorName: DEMO_SUPPORT_NAME,
          authorRole: 'support-agent',
          authorDisplayName: DEMO_SUPPORT_NAME,
          authorAvatarUrl: DEMO_SUPPORT_AVATAR,
          authorType: 'staff',
          bodyHtml: textToHtml('The opening hours are in Shared Content under Footer details. I have attached the guide used in handover.'),
          bodyText: 'The opening hours are in Shared Content under Footer details. I have attached the guide used in handover.',
          attachments: [
            {
              key: 'support-doc-footer-guide',
              name: 'Footer editing guide',
              url: '#support-doc-footer-guide',
              mime: 'text/html',
              size: null
            }
          ],
          isInternal: false,
          createdAt: '2026-03-17T16:02:00.000Z',
          updatedAt: '2026-03-17T16:02:00.000Z'
        },
        {
          id: 'support-message-1039-1',
          ticketId: 'support-ticket-1039',
          authorUserId: 'support-ticket-1039-requester',
          authorEmail: 'martha@harbour-pine-demo.co.uk',
          authorName: 'Martha Jones',
          authorRole: 'admin-requester',
          authorType: 'requester',
          bodyHtml: textToHtml('We need a quick reminder of where the studio opening hours live in Sauro CMS.'),
          bodyText: 'We need a quick reminder of where the studio opening hours live in Sauro CMS.',
          attachments: [],
          isInternal: false,
          createdAt: '2026-03-16T10:30:00.000Z',
          updatedAt: '2026-03-16T10:30:00.000Z'
        }
      ],
      ratings: [
        {
          id: 'support-rating-1039',
          ticketId: 'support-ticket-1039',
          rating: 5,
          comment: 'Very clear. The guide was enough for the team to handle it themselves next time.',
          submittedByUserId: 'support-ticket-1039-requester',
          submittedAt: '2026-03-18T09:05:00.000Z',
          createdAt: '2026-03-18T09:05:00.000Z',
          updatedAt: '2026-03-18T09:05:00.000Z'
        }
      ]
    }),
    buildThread({
      id: 'support-ticket-1034',
      ticketRef: 'HP-1034',
      requesterName: 'Ben Hall',
      requesterEmail: 'studio@harbour-pine-demo.co.uk',
      category: 'technical_issue',
      module: 'homepage',
      priority: '3-medium',
      status: 'closed',
      waitingOn: 'support',
      subject: 'Homepage quote carousel was jumping on tablet widths',
      descriptionText:
        'The testimonial carousel was shifting too aggressively on medium-width tablets.\n\nIt has already been fixed, but we wanted to keep a record of the issue and the release note.',
      pageUrl: 'https://harbour-pine-demo.co.uk',
      requestedDate: null,
      caseRefs: ['FRONT-07'],
      createdAt: '2026-03-12T08:45:00.000Z',
      updatedAt: '2026-03-13T13:22:00.000Z',
      closedAt: '2026-03-13T13:22:00.000Z',
      notes: 'Fixed with spacing clamp adjustment on tablet breakpoints.',
      messages: [
        {
          id: 'support-message-1034-2',
          ticketId: 'support-ticket-1034',
          authorUserId: DEMO_SUPPORT_USER_ID,
          authorEmail: DEMO_SUPPORT_EMAIL,
          authorName: DEMO_SUPPORT_NAME,
          authorRole: 'support-agent',
          authorDisplayName: DEMO_SUPPORT_NAME,
          authorAvatarUrl: DEMO_SUPPORT_AVATAR,
          authorType: 'staff',
          bodyHtml: textToHtml('This has been fixed and deployed in the latest release window.'),
          bodyText: 'This has been fixed and deployed in the latest release window.',
          attachments: [],
          isInternal: false,
          createdAt: '2026-03-13T13:22:00.000Z',
          updatedAt: '2026-03-13T13:22:00.000Z'
        },
        {
          id: 'support-message-1034-1',
          ticketId: 'support-ticket-1034',
          authorUserId: 'support-ticket-1034-requester',
          authorEmail: 'studio@harbour-pine-demo.co.uk',
          authorName: 'Ben Hall',
          authorRole: 'admin-requester',
          authorType: 'requester',
          bodyHtml: textToHtml('The testimonial carousel was shifting too aggressively on medium-width tablets.'),
          bodyText: 'The testimonial carousel was shifting too aggressively on medium-width tablets.',
          attachments: [],
          isInternal: false,
          createdAt: '2026-03-12T08:45:00.000Z',
          updatedAt: '2026-03-12T08:45:00.000Z'
        }
      ]
    })
  ];

  const documents: SupportDocSummary[] = [
    {
      id: 'footer-guide',
      title: 'Footer editing guide',
      description: 'Short guide for changing opening hours, footer links, and contact details.',
      module: 'Sauro CMS',
      category: 'Handover',
      tags: ['footer', 'shared content'],
      linkType: 'view',
      url: '#support-doc-footer-guide',
      searchable: true,
      publishedAt: '2026-03-12T09:00:00.000Z',
      createdAt: '2026-03-12T09:00:00.000Z',
      updatedAt: '2026-03-12T09:00:00.000Z'
    },
    {
      id: 'editor-checklist',
      title: 'Publishing checklist for page editors',
      description: 'Internal checklist covering headings, imagery, metadata, and CTA placement.',
      module: 'Sauro CMS',
      category: 'Editorial',
      tags: ['puck', 'editor', 'qa'],
      linkType: 'view',
      url: '#support-doc-editor-checklist',
      searchable: true,
      publishedAt: '2026-03-10T11:30:00.000Z',
      createdAt: '2026-03-10T11:30:00.000Z',
      updatedAt: '2026-03-10T11:30:00.000Z'
    },
    {
      id: 'image-prep-pack',
      title: 'Image prep pack',
      description: 'Guidance on asset naming, crop ratios, alt text, and folder structure.',
      module: 'Media Library',
      category: 'Assets',
      tags: ['media', 'images'],
      linkType: 'download',
      url: '#support-doc-image-prep-pack',
      searchable: true,
      publishedAt: '2026-03-08T16:00:00.000Z',
      createdAt: '2026-03-08T16:00:00.000Z',
      updatedAt: '2026-03-08T16:00:00.000Z'
    },
    {
      id: 'launch-runbook',
      title: 'Launch day runbook',
      description: 'A simple launch sequence for content freeze, QA, redirects, and post-launch checks.',
      module: 'Operations',
      category: 'Launch',
      tags: ['launch', 'qa'],
      linkType: 'view',
      url: '#support-doc-launch-runbook',
      searchable: true,
      publishedAt: '2026-03-01T09:15:00.000Z',
      createdAt: '2026-03-01T09:15:00.000Z',
      updatedAt: '2026-03-01T09:15:00.000Z'
    }
  ];

  const articles: SupportArticleSummary[] = [
    {
      id: 'article-checklist',
      title: 'A practical pre-publish checklist for client teams',
      slug: 'pre-publish-checklist',
      type: 'knowledge',
      category: 'Editorial',
      module: 'Sauro CMS',
      tags: ['editor', 'workflow'],
      summary: 'A quick editorial pass before publishing prevents most avoidable mistakes.',
      bodyText: 'Check headings, image alt text, section order, and the final call to action before publishing.',
      searchable: true,
      publishedAt: '2026-03-14T10:00:00.000Z',
      createdAt: '2026-03-14T10:00:00.000Z',
      updatedAt: '2026-03-14T10:00:00.000Z'
    },
    {
      id: 'article-media-folders',
      title: 'How to keep the media library tidy over time',
      slug: 'keep-media-library-tidy',
      type: 'knowledge',
      category: 'Assets',
      module: 'Media Library',
      tags: ['folders', 'uploads'],
      summary: 'A folder strategy that keeps assets easy to find without over-engineering the structure.',
      bodyText: 'Use project-level folders, descriptive names, and clean alt text so future content edits stay fast.',
      searchable: true,
      publishedAt: '2026-03-11T08:30:00.000Z',
      createdAt: '2026-03-11T08:30:00.000Z',
      updatedAt: '2026-03-11T08:30:00.000Z'
    },
    {
      id: 'article-release-window',
      title: 'Next release window for workflow improvements',
      slug: 'next-release-window',
      type: 'announcement',
      category: 'Roadmap',
      module: 'Sauro CMS',
      tags: ['release'],
      summary: 'A small batch of editorial and scheduling improvements is planned for the next release window.',
      bodyText: 'The next release window includes editorial polish, improved media metadata prompts, and booking-flow fixes.',
      searchable: true,
      publishedAt: '2026-03-20T09:40:00.000Z',
      createdAt: '2026-03-20T09:40:00.000Z',
      updatedAt: '2026-03-20T09:40:00.000Z'
    },
    {
      id: 'article-support-hours',
      title: 'Support desk coverage during the spring launch period',
      slug: 'spring-launch-support-hours',
      type: 'announcement',
      category: 'Support',
      module: 'Operations',
      tags: ['support', 'hours'],
      summary: 'A note on response windows while several launch projects are live at once.',
      bodyText: 'Critical issues remain prioritised first, while lower-priority requests may run slightly slower during launch week.',
      searchable: true,
      publishedAt: '2026-03-18T12:15:00.000Z',
      createdAt: '2026-03-18T12:15:00.000Z',
      updatedAt: '2026-03-18T12:15:00.000Z'
    },
    {
      id: 'article-media-preview',
      title: 'Media preview improvements',
      slug: 'media-preview-improvements',
      type: 'feature',
      category: 'Release notes',
      module: 'Media Library',
      tags: ['release', 'media'],
      summary: 'Large image boards now preview more clearly in the asset browser.',
      bodyText: 'Preview handling for tall boards and wide moodboards has been tightened so selection is quicker.',
      searchable: true,
      publishedAt: '2026-03-09T14:45:00.000Z',
      createdAt: '2026-03-09T14:45:00.000Z',
      updatedAt: '2026-03-09T14:45:00.000Z'
    }
  ];

  const systemStatus: SupportSystemStatusPayload = {
    configured: true,
    source: 'snapshot',
    fetchedAt: '2026-03-23T09:20:00.000Z',
    summary: {
      totalChecks: 5,
      operational: 4,
      degraded: 1,
      outage: 0,
      unknown: 0,
      incidents: 1
    },
    checks: [
      {
        key: 'site-cdn',
        label: 'Public site delivery',
        status: 'operational',
        detail: 'Page delivery is healthy across the primary regions.',
        updatedAt: '2026-03-23T09:20:00.000Z'
      },
      {
        key: 'cms-editor',
        label: 'Editor workspace',
        status: 'operational',
        detail: 'Editing and preview surfaces are responding normally.',
        updatedAt: '2026-03-23T09:18:00.000Z'
      },
      {
        key: 'media-sync',
        label: 'Media processing',
        status: 'operational',
        detail: 'Uploads and previews are processing within normal range.',
        updatedAt: '2026-03-23T09:15:00.000Z'
      },
      {
        key: 'inbound-email',
        label: 'Inbound email relay',
        status: 'degraded',
        detail: 'A few incoming messages are reaching the inbox a few minutes late.',
        updatedAt: '2026-03-23T09:12:00.000Z'
      },
      {
        key: 'booking-webhooks',
        label: 'Booking notifications',
        status: 'operational',
        detail: 'Booking notifications and follow-up automations are healthy.',
        updatedAt: '2026-03-23T09:19:00.000Z'
      }
    ],
    incidents: [
      {
        id: 'incident-email-delay',
        title: 'Minor delay on inbound email routing',
        status: 'Monitoring',
        detail: 'A small number of enquiries are arriving with a short delay while we monitor the email relay.',
        startedAt: '2026-03-23T08:35:00.000Z',
        resolvedAt: null
      }
    ]
  };

  const developmentHours: SupportDevelopmentHoursPayload = {
    configured: true,
    source: 'snapshot',
    fetchedAt: '2026-03-23T09:10:00.000Z',
    totals: {
      planned: 24,
      used: 13.5,
      remaining: 10.5,
      period: 'March 2026 support window'
    },
    items: [
      { module: 'Booking & Enquiries', planned: 8, used: 4.5, remaining: 3.5, updatedAt: '2026-03-23T09:10:00.000Z' },
      { module: 'Sauro CMS', planned: 6, used: 3, remaining: 3, updatedAt: '2026-03-22T16:40:00.000Z' },
      { module: 'Portfolio content', planned: 4, used: 2, remaining: 2, updatedAt: '2026-03-21T13:10:00.000Z' },
      { module: 'Shared content & launch', planned: 6, used: 4, remaining: 2, updatedAt: '2026-03-20T10:25:00.000Z' }
    ]
  };

  return { threads, documents, articles, systemStatus, developmentHours };
}
