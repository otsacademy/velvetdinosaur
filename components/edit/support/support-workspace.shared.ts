import {
  SUPPORT_PRIORITIES,
  SUPPORT_TICKET_CATEGORIES,
  SUPPORT_TICKET_MODULES,
  SUPPORT_TICKET_STATUSES,
  SUPPORT_WAITING_ON
} from '@/lib/support/constants';

export type SupportPriority = (typeof SUPPORT_PRIORITIES)[number];
export type SupportTicketCategory = (typeof SUPPORT_TICKET_CATEGORIES)[number]['key'];
export type SupportTicketModule = (typeof SUPPORT_TICKET_MODULES)[number]['key'];
export type SupportTicketStatus = (typeof SUPPORT_TICKET_STATUSES)[number];
export type SupportWaitingOn = (typeof SUPPORT_WAITING_ON)[number];

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
  satisfactionRating: number | null;
  satisfactionComment: string;
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

export function formatDateTime(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}

export async function readJson(response: Response) {
  return response.json().catch(() => ({}));
}
