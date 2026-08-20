import {
  SUPPORT_PRIORITIES,
  SUPPORT_TICKET_CATEGORIES,
  SUPPORT_TICKET_STATUSES,
  SUPPORT_WAITING_ON,
  supportCategoryLabel,
  supportPriorityLabel,
  supportStatusLabel,
  type SupportPriority,
  type SupportTicketCategory,
  type SupportTicketStatus,
  type SupportWaitingOn
} from '@/lib/support/constants';

export type SupportActorRole = 'admin-requester' | 'support-agent' | 'system';

export type TicketDoc = {
  _id?: unknown;
  ticketRef?: unknown;
  createdByUserId?: unknown;
  createdByEmail?: unknown;
  organization?: unknown;
  category?: unknown;
  module?: unknown;
  priority?: unknown;
  requestedDate?: unknown;
  caseRefs?: unknown;
  pageUrl?: unknown;
  subject?: unknown;
  descriptionHtml?: unknown;
  descriptionText?: unknown;
  status?: unknown;
  waitingOn?: unknown;
  notes?: unknown;
  assignedToUserId?: unknown;
  assignedToEmail?: unknown;
  messageCount?: unknown;
  lastActivityAt?: unknown;
  closedAt?: unknown;
  satisfactionRating?: unknown;
  satisfactionComment?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

type MessageAttachmentDoc = {
  key?: unknown;
  name?: unknown;
  url?: unknown;
  mime?: unknown;
  size?: unknown;
};

export type MessageDoc = {
  _id?: unknown;
  ticketId?: unknown;
  authorUserId?: unknown;
  authorEmail?: unknown;
  authorName?: unknown;
  authorRole?: unknown;
  bodyHtml?: unknown;
  bodyText?: unknown;
  attachments?: unknown;
  isInternal?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type EventDoc = {
  _id?: unknown;
  ticketId?: unknown;
  eventType?: unknown;
  actorUserId?: unknown;
  actorEmail?: unknown;
  actorName?: unknown;
  actorRole?: unknown;
  fromStatus?: unknown;
  toStatus?: unknown;
  fromWaitingOn?: unknown;
  toWaitingOn?: unknown;
  message?: unknown;
  metadata?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type CounterDoc = {
  seq?: unknown;
};

export type RatingDoc = {
  _id?: unknown;
  ticketId?: unknown;
  rating?: unknown;
  comment?: unknown;
  submittedByUserId?: unknown;
  submittedAt?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type SupportTicketSummary = {
  id: string;
  ticketRef: string;
  createdByUserId: string;
  createdByEmail: string;
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

export type SupportMessageAttachment = {
  key: string;
  name: string;
  url: string;
  mime: string;
  size: number | null;
};

export type SupportTicketMessageSummary = {
  id: string;
  ticketId: string;
  authorUserId: string;
  authorEmail: string;
  authorName: string;
  authorRole: SupportActorRole;
  bodyHtml: string;
  bodyText: string;
  attachments: SupportMessageAttachment[];
  isInternal: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type SupportTicketEventSummary = {
  id: string;
  ticketId: string;
  eventType: 'ticket_created' | 'message_added' | 'status_changed' | 'reopened' | 'closed' | 'updated';
  actorUserId: string;
  actorEmail: string;
  actorName: string;
  actorRole: SupportActorRole;
  fromStatus: SupportTicketStatus | '';
  toStatus: SupportTicketStatus | '';
  fromWaitingOn: SupportWaitingOn | '';
  toWaitingOn: SupportWaitingOn | '';
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string | null;
  updatedAt: string | null;
};

export type SupportTicketRatingSummary = {
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
  messages: SupportTicketMessageSummary[];
  events: SupportTicketEventSummary[];
  ratings: SupportTicketRatingSummary[];
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

export function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeEmail(value: unknown) {
  return clean(value).toLowerCase();
}

export function toIdString(value: unknown) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object' && value && 'toString' in value) {
    const toString = (value as { toString?: () => string }).toString;
    if (typeof toString === 'function') {
      const result = toString.call(value);
      return typeof result === 'string' ? result : '';
    }
  }
  return '';
}

export function toDateIsoOrNull(value: unknown) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function asObject(value: unknown) {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

export function normalizeStatus(value: unknown): SupportTicketStatus {
  return SUPPORT_TICKET_STATUSES.includes(value as SupportTicketStatus)
    ? (value as SupportTicketStatus)
    : 'open';
}

export function normalizeCategory(value: unknown): SupportTicketCategory {
  const fallback: SupportTicketCategory = 'support_request';
  const category = clean(value) as SupportTicketCategory;
  if (!category) return fallback;
  const allowed = SUPPORT_TICKET_CATEGORIES.some((item) => item.key === category);
  return allowed ? category : fallback;
}

export function normalizePriority(value: unknown): SupportPriority {
  const fallback: SupportPriority = '5-standard';
  const priority = clean(value) as SupportPriority;
  if (!priority) return fallback;
  return SUPPORT_PRIORITIES.includes(priority) ? priority : fallback;
}

export function normalizeWaitingOn(value: unknown): SupportWaitingOn {
  const waitingOn = clean(value) as SupportWaitingOn;
  if (!waitingOn) return 'support';
  return SUPPORT_WAITING_ON.includes(waitingOn) ? waitingOn : 'support';
}

function normalizeActorRole(value: unknown): SupportActorRole {
  if (value === 'support-agent') return 'support-agent';
  if (value === 'system') return 'system';
  return 'admin-requester';
}

export function normalizeCaseRefs(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  const unique = new Set<string>();
  for (const value of raw) {
    const item = clean(value);
    if (item) unique.add(item);
  }
  return Array.from(unique);
}

export function normalizeAttachments(raw: unknown): SupportMessageAttachment[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => asObject(entry) as MessageAttachmentDoc)
    .map((entry) => ({
      key: clean(entry.key),
      name: clean(entry.name),
      url: clean(entry.url),
      mime: clean(entry.mime),
      size: Number.isFinite(Number(entry.size)) ? Number(entry.size) : null
    }))
    .filter((entry) => entry.url || entry.key || entry.name);
}

export function stripHtml(input: string) {
  return input.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function mapTicketSummary(doc: TicketDoc): SupportTicketSummary {
  const category = normalizeCategory(doc.category);
  const priority = normalizePriority(doc.priority);
  const status = normalizeStatus(doc.status);
  const ratingRaw = Number(doc.satisfactionRating);
  return {
    id: toIdString(doc._id),
    ticketRef: clean(doc.ticketRef),
    createdByUserId: clean(doc.createdByUserId),
    createdByEmail: normalizeEmail(doc.createdByEmail),
    organization: clean(doc.organization),
    category,
    categoryLabel: supportCategoryLabel(category),
    module: clean(doc.module),
    priority,
    priorityLabel: supportPriorityLabel(priority),
    requestedDate: toDateIsoOrNull(doc.requestedDate),
    caseRefs: normalizeCaseRefs(doc.caseRefs),
    pageUrl: clean(doc.pageUrl),
    subject: clean(doc.subject),
    status,
    statusLabel: supportStatusLabel(status),
    waitingOn: normalizeWaitingOn(doc.waitingOn),
    notes: clean(doc.notes),
    assignedToUserId: clean(doc.assignedToUserId),
    assignedToEmail: normalizeEmail(doc.assignedToEmail),
    messageCount: Math.max(0, Math.round(Number(doc.messageCount || 0))),
    lastActivityAt: toDateIsoOrNull(doc.lastActivityAt),
    closedAt: toDateIsoOrNull(doc.closedAt),
    satisfactionRating: Number.isFinite(ratingRaw) ? Math.min(5, Math.max(1, Math.round(ratingRaw))) : null,
    satisfactionComment: clean(doc.satisfactionComment),
    createdAt: toDateIsoOrNull(doc.createdAt),
    updatedAt: toDateIsoOrNull(doc.updatedAt)
  };
}

export function mapTicketDetail(doc: TicketDoc): SupportTicketDetail {
  const summary = mapTicketSummary(doc);
  const descriptionHtml = clean(doc.descriptionHtml);
  const descriptionText = clean(doc.descriptionText);
  return {
    ...summary,
    descriptionHtml,
    descriptionText,
    satisfactionRating: summary.satisfactionRating,
    satisfactionComment: summary.satisfactionComment
  };
}

export function mapMessage(doc: MessageDoc): SupportTicketMessageSummary {
  return {
    id: toIdString(doc._id),
    ticketId: clean(doc.ticketId),
    authorUserId: clean(doc.authorUserId),
    authorEmail: normalizeEmail(doc.authorEmail),
    authorName: clean(doc.authorName),
    authorRole: normalizeActorRole(doc.authorRole),
    bodyHtml: clean(doc.bodyHtml),
    bodyText: clean(doc.bodyText),
    attachments: normalizeAttachments(doc.attachments),
    isInternal: Boolean(doc.isInternal),
    createdAt: toDateIsoOrNull(doc.createdAt),
    updatedAt: toDateIsoOrNull(doc.updatedAt)
  };
}

export function mapEvent(doc: EventDoc): SupportTicketEventSummary {
  const rawType = clean(doc.eventType);
  const eventType = (
    ['ticket_created', 'message_added', 'status_changed', 'reopened', 'closed', 'updated'].includes(rawType)
      ? rawType
      : 'updated'
  ) as SupportTicketEventSummary['eventType'];
  const fromStatus = clean(doc.fromStatus);
  const toStatus = clean(doc.toStatus);
  const fromWaitingOn = clean(doc.fromWaitingOn);
  const toWaitingOn = clean(doc.toWaitingOn);
  return {
    id: toIdString(doc._id),
    ticketId: clean(doc.ticketId),
    eventType,
    actorUserId: clean(doc.actorUserId),
    actorEmail: normalizeEmail(doc.actorEmail),
    actorName: clean(doc.actorName),
    actorRole: normalizeActorRole(doc.actorRole),
    fromStatus: (SUPPORT_TICKET_STATUSES.includes(fromStatus as SupportTicketStatus)
      ? fromStatus
      : '') as SupportTicketStatus | '',
    toStatus: (SUPPORT_TICKET_STATUSES.includes(toStatus as SupportTicketStatus)
      ? toStatus
      : '') as SupportTicketStatus | '',
    fromWaitingOn: (SUPPORT_WAITING_ON.includes(fromWaitingOn as SupportWaitingOn)
      ? fromWaitingOn
      : '') as SupportWaitingOn | '',
    toWaitingOn: (SUPPORT_WAITING_ON.includes(toWaitingOn as SupportWaitingOn)
      ? toWaitingOn
      : '') as SupportWaitingOn | '',
    message: clean(doc.message),
    metadata: asObject(doc.metadata),
    createdAt: toDateIsoOrNull(doc.createdAt),
    updatedAt: toDateIsoOrNull(doc.updatedAt)
  };
}

export function mapRating(doc: RatingDoc): SupportTicketRatingSummary {
  const ratingValue = Math.round(Number(doc.rating || 0));
  return {
    id: toIdString(doc._id),
    ticketId: clean(doc.ticketId),
    rating: Math.min(5, Math.max(1, Number.isFinite(ratingValue) ? ratingValue : 1)),
    comment: clean(doc.comment),
    submittedByUserId: clean(doc.submittedByUserId),
    submittedAt: toDateIsoOrNull(doc.submittedAt),
    createdAt: toDateIsoOrNull(doc.createdAt),
    updatedAt: toDateIsoOrNull(doc.updatedAt)
  };
}
