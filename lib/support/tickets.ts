import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/support/tickets.ts');
import { connectDB } from '@/lib/db';
import {
  SUPPORT_TICKET_CLOSED_STATUSES,
  SUPPORT_TICKET_OPEN_STATUSES,
  SUPPORT_TICKET_STATUSES,
  SUPPORT_WAITING_ON,
  supportCategoryLabel,
  supportStatusIsOpen,
  supportStatusLabel,
  type SupportTicketCategory,
  type SupportTicketStatus,
  type SupportWaitingOn
} from '@/lib/support/constants';
import { SupportTicket } from '@/models/SupportTicket';
import { SupportTicketCounter } from '@/models/SupportTicketCounter';
import { SupportTicketEvent } from '@/models/SupportTicketEvent';
import { SupportTicketMessage } from '@/models/SupportTicketMessage';
import { SupportTicketRating } from '@/models/SupportTicketRating';
import {
  clean,
  mapEvent,
  mapMessage,
  mapRating,
  mapTicketDetail,
  mapTicketSummary,
  normalizeCaseRefs,
  normalizeCategory,
  normalizeEmail,
  normalizePriority,
  normalizeStatus,
  normalizeWaitingOn,
  stripHtml,
  toIdString,
  type CounterDoc,
  type EventDoc,
  type MessageDoc,
  type RatingDoc,
  type SupportActorRole,
  type SupportMessageAttachment,
  type SupportOverview,
  type SupportTicketDetail,
  type SupportTicketEventSummary,
  type SupportTicketMessageSummary,
  type SupportTicketRatingSummary,
  type SupportTicketSummary,
  type SupportTicketThread,
  type TicketDoc
} from '@/lib/support/tickets-shared';
function regexSafe(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function parseRequestedDate(value: string | null | undefined) {
  const raw = clean(value);
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

async function nextTicketRef(now = new Date()) {
  const year = now.getUTCFullYear();
  const key = `support-ticket-${year}`;
  const counter = (await SupportTicketCounter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 }, $setOnInsert: { key } },
    { new: true, upsert: true }
  ).lean()) as CounterDoc | null;
  const seq = Math.max(1, Math.round(Number(counter?.seq || 1)));
  return `SUP-${year}-${String(seq).padStart(6, '0')}`;
}

async function appendTicketEvent(input: {
  ticketId: string;
  eventType: SupportTicketEventSummary['eventType'];
  actorUserId?: string;
  actorEmail?: string;
  actorName?: string;
  actorRole?: SupportActorRole;
  fromStatus?: SupportTicketStatus | '';
  toStatus?: SupportTicketStatus | '';
  fromWaitingOn?: SupportWaitingOn | '';
  toWaitingOn?: SupportWaitingOn | '';
  message?: string;
  metadata?: Record<string, unknown>;
}) {
  await SupportTicketEvent.create({
    ticketId: clean(input.ticketId),
    eventType: input.eventType,
    actorUserId: clean(input.actorUserId),
    actorEmail: normalizeEmail(input.actorEmail),
    actorName: clean(input.actorName),
    actorRole: input.actorRole || 'system',
    fromStatus: input.fromStatus || '',
    toStatus: input.toStatus || '',
    fromWaitingOn: input.fromWaitingOn || '',
    toWaitingOn: input.toWaitingOn || '',
    message: clean(input.message),
    metadata: input.metadata || {}
  });
}

export async function listSupportTickets(options?: {
  statusGroup?: 'all' | 'open' | 'closed';
  status?: SupportTicketStatus | 'all';
  category?: SupportTicketCategory | 'all';
  waitingOn?: SupportWaitingOn | 'all';
  requesterUserId?: string | null;
  q?: string | null;
  limit?: number;
}) {
  await connectDB();
  const statusGroup = options?.statusGroup || 'open';
  const status = options?.status || 'all';
  const category = options?.category || 'all';
  const waitingOn = options?.waitingOn || 'all';
  const requesterUserId = clean(options?.requesterUserId);
  const q = clean(options?.q);
  const limit = Math.max(1, Math.min(500, Math.round(options?.limit || 120)));

  const query: Record<string, unknown> = {};
  if (requesterUserId) query.createdByUserId = requesterUserId;
  if (statusGroup === 'open') query.status = { $in: SUPPORT_TICKET_OPEN_STATUSES };
  if (statusGroup === 'closed') query.status = { $in: SUPPORT_TICKET_CLOSED_STATUSES };
  if (status !== 'all') query.status = normalizeStatus(status);
  if (category !== 'all') query.category = normalizeCategory(category);
  if (waitingOn !== 'all') query.waitingOn = normalizeWaitingOn(waitingOn);
  if (q) {
    const safe = regexSafe(q);
    query.$or = [
      { ticketRef: { $regex: safe, $options: 'i' } },
      { subject: { $regex: safe, $options: 'i' } },
      { organization: { $regex: safe, $options: 'i' } },
      { createdByEmail: { $regex: safe, $options: 'i' } },
      { module: { $regex: safe, $options: 'i' } }
    ];
  }

  const rows = (await SupportTicket.find(query)
    .sort({ lastActivityAt: -1, createdAt: -1, _id: -1 })
    .limit(limit)
    .lean()) as TicketDoc[];
  return rows.map(mapTicketSummary);
}

export async function getSupportTicketById(ticketId: string): Promise<SupportTicketDetail | null> {
  await connectDB();
  const row = (await SupportTicket.findById(clean(ticketId)).lean()) as TicketDoc | null;
  return row ? mapTicketDetail(row) : null;
}

export async function listSupportTicketMessages(
  ticketId: string,
  limit = 400
): Promise<SupportTicketMessageSummary[]> {
  await connectDB();
  const rows = (await SupportTicketMessage.find({ ticketId: clean(ticketId) })
    .sort({ createdAt: 1, _id: 1 })
    .limit(Math.max(1, Math.min(2000, Math.round(limit))))
    .lean()) as MessageDoc[];
  return rows.map(mapMessage);
}

export async function listSupportTicketEvents(
  ticketId: string,
  limit = 400
): Promise<SupportTicketEventSummary[]> {
  await connectDB();
  const rows = (await SupportTicketEvent.find({ ticketId: clean(ticketId) })
    .sort({ createdAt: 1, _id: 1 })
    .limit(Math.max(1, Math.min(2000, Math.round(limit))))
    .lean()) as EventDoc[];
  return rows.map(mapEvent);
}

export async function listSupportTicketRatings(
  ticketId: string,
  limit = 100
): Promise<SupportTicketRatingSummary[]> {
  await connectDB();
  const rows = (await SupportTicketRating.find({ ticketId: clean(ticketId) })
    .sort({ submittedAt: -1, createdAt: -1, _id: -1 })
    .limit(Math.max(1, Math.min(1000, Math.round(limit))))
    .lean()) as RatingDoc[];
  return rows.map(mapRating);
}

export async function getSupportTicketThread(ticketId: string): Promise<SupportTicketThread | null> {
  const normalizedId = clean(ticketId);
  if (!normalizedId) return null;
  const [ticket, messages, events, ratings] = await Promise.all([
    getSupportTicketById(normalizedId),
    listSupportTicketMessages(normalizedId, 600),
    listSupportTicketEvents(normalizedId, 600),
    listSupportTicketRatings(normalizedId, 120)
  ]);
  if (!ticket) return null;
  return { ticket, messages, events, ratings };
}

export async function createSupportTicket(input: {
  createdByUserId: string;
  createdByEmail: string;
  createdByName?: string;
  actorRole?: SupportActorRole;
  organization: string;
  subject: string;
  category: SupportTicketCategory;
  module?: string;
  priority?: string;
  requestedDate?: string | null;
  caseRefs?: string[];
  pageUrl?: string;
  descriptionHtml?: string;
  descriptionText?: string;
  attachments?: SupportMessageAttachment[];
}) {
  await connectDB();
  const now = new Date();
  const ticketRef = await nextTicketRef(now);
  const descriptionHtml = clean(input.descriptionHtml);
  const descriptionText = clean(input.descriptionText) || stripHtml(descriptionHtml);
  const created = await SupportTicket.create({
    ticketRef,
    createdByUserId: clean(input.createdByUserId),
    createdByEmail: normalizeEmail(input.createdByEmail),
    organization: clean(input.organization),
    category: normalizeCategory(input.category),
    module: clean(input.module),
    priority: normalizePriority(input.priority),
    requestedDate: parseRequestedDate(input.requestedDate),
    caseRefs: normalizeCaseRefs(input.caseRefs),
    pageUrl: clean(input.pageUrl),
    subject: clean(input.subject),
    descriptionHtml,
    descriptionText,
    status: 'open',
    waitingOn: 'support',
    messageCount: 1,
    lastActivityAt: now
  });

  const ticketId = toIdString((created.toObject() as TicketDoc)._id);
  await SupportTicketMessage.create({
    ticketId,
    authorUserId: clean(input.createdByUserId),
    authorEmail: normalizeEmail(input.createdByEmail),
    authorName: clean(input.createdByName),
    authorRole: input.actorRole || 'admin-requester',
    bodyHtml: descriptionHtml,
    bodyText: descriptionText,
    attachments: Array.isArray(input.attachments) ? input.attachments : [],
    isInternal: false
  });

  await appendTicketEvent({
    ticketId,
    eventType: 'ticket_created',
    actorUserId: clean(input.createdByUserId),
    actorEmail: normalizeEmail(input.createdByEmail),
    actorName: clean(input.createdByName),
    actorRole: input.actorRole || 'admin-requester',
    toStatus: 'open',
    toWaitingOn: 'support',
    message: 'Ticket created'
  });

  return getSupportTicketById(ticketId);
}

export async function addSupportTicketMessage(input: {
  ticketId: string;
  actorUserId: string;
  actorEmail: string;
  actorName?: string;
  actorRole: SupportActorRole;
  bodyHtml?: string;
  bodyText: string;
  attachments?: SupportMessageAttachment[];
  isInternal?: boolean;
}) {
  await connectDB();
  const ticketId = clean(input.ticketId);
  const existing = (await SupportTicket.findById(ticketId).lean()) as TicketDoc | null;
  if (!existing) return null;

  const now = new Date();
  const bodyHtml = clean(input.bodyHtml);
  const bodyText = clean(input.bodyText) || stripHtml(bodyHtml);
  if (!bodyText) return null;
  const attachments = Array.isArray(input.attachments) ? input.attachments : [];
  const nextWaitingOn: SupportWaitingOn = input.actorRole === 'support-agent' ? 'customer' : 'support';

  const created = (await SupportTicketMessage.create({
    ticketId,
    authorUserId: clean(input.actorUserId),
    authorEmail: normalizeEmail(input.actorEmail),
    authorName: clean(input.actorName),
    authorRole: input.actorRole,
    bodyHtml,
    bodyText,
    attachments,
    isInternal: Boolean(input.isInternal)
  })) as MessageDoc;

  await SupportTicket.findByIdAndUpdate(ticketId, {
    $set: { waitingOn: nextWaitingOn, lastActivityAt: now },
    $inc: { messageCount: 1 }
  });

  await appendTicketEvent({
    ticketId,
    eventType: 'message_added',
    actorUserId: clean(input.actorUserId),
    actorEmail: normalizeEmail(input.actorEmail),
    actorName: clean(input.actorName),
    actorRole: input.actorRole,
    fromStatus: normalizeStatus(existing.status),
    toStatus: normalizeStatus(existing.status),
    fromWaitingOn: normalizeWaitingOn(existing.waitingOn),
    toWaitingOn: nextWaitingOn,
    message: 'Reply added'
  });

  return mapMessage(created);
}

export async function updateSupportTicketStatus(input: {
  ticketId: string;
  actorUserId: string;
  actorEmail: string;
  actorName?: string;
  actorRole: SupportActorRole;
  status: SupportTicketStatus;
  waitingOn?: SupportWaitingOn | null;
  note?: string;
}) {
  await connectDB();
  const ticketId = clean(input.ticketId);
  const existing = (await SupportTicket.findById(ticketId).lean()) as TicketDoc | null;
  if (!existing) return null;

  const currentStatus = normalizeStatus(existing.status);
  const nextStatus = normalizeStatus(input.status);
  const now = new Date();
  const currentWaitingOn = normalizeWaitingOn(existing.waitingOn);
  let nextWaitingOn = normalizeWaitingOn(input.waitingOn || currentWaitingOn);
  if (!supportStatusIsOpen(nextStatus)) nextWaitingOn = 'support';

  const update: Record<string, unknown> = {
    status: nextStatus,
    waitingOn: nextWaitingOn,
    lastActivityAt: now,
    closedAt: supportStatusIsOpen(nextStatus) ? null : now
  };
  const note = clean(input.note);
  if (note) update.notes = note;

  const updated = (await SupportTicket.findByIdAndUpdate(ticketId, { $set: update }, { new: true }).lean()) as
    | TicketDoc
    | null;
  if (!updated) return null;

  const eventType =
    nextStatus === 'closed' || nextStatus === 'resolved'
      ? 'closed'
      : currentStatus === 'closed' || currentStatus === 'resolved'
        ? 'reopened'
        : 'status_changed';
  await appendTicketEvent({
    ticketId,
    eventType,
    actorUserId: clean(input.actorUserId),
    actorEmail: normalizeEmail(input.actorEmail),
    actorName: clean(input.actorName),
    actorRole: input.actorRole,
    fromStatus: currentStatus,
    toStatus: nextStatus,
    fromWaitingOn: currentWaitingOn,
    toWaitingOn: nextWaitingOn,
    message: note || `${supportStatusLabel(currentStatus)} → ${supportStatusLabel(nextStatus)}`
  });

  return mapTicketDetail(updated);
}

export async function submitSupportTicketRating(input: {
  ticketId: string;
  actorUserId: string;
  actorEmail: string;
  actorName?: string;
  actorRole: SupportActorRole;
  rating: number;
  comment?: string;
}) {
  await connectDB();
  const ticketId = clean(input.ticketId);
  const existing = (await SupportTicket.findById(ticketId).lean()) as TicketDoc | null;
  if (!existing) return null;

  const normalizedRating = Math.min(5, Math.max(1, Math.round(Number(input.rating || 0))));
  const normalizedComment = clean(input.comment);
  const now = new Date();

  await SupportTicketRating.create({
    ticketId,
    rating: normalizedRating,
    comment: normalizedComment,
    submittedByUserId: clean(input.actorUserId),
    submittedAt: now
  });

  const updated = (await SupportTicket.findByIdAndUpdate(
    ticketId,
    {
      $set: {
        satisfactionRating: normalizedRating,
        satisfactionComment: normalizedComment,
        lastActivityAt: now
      }
    },
    { new: true }
  ).lean()) as TicketDoc | null;

  if (!updated) return null;

  await appendTicketEvent({
    ticketId,
    eventType: 'updated',
    actorUserId: clean(input.actorUserId),
    actorEmail: normalizeEmail(input.actorEmail),
    actorName: clean(input.actorName),
    actorRole: input.actorRole,
    fromStatus: normalizeStatus(existing.status),
    toStatus: normalizeStatus(updated.status),
    fromWaitingOn: normalizeWaitingOn(existing.waitingOn),
    toWaitingOn: normalizeWaitingOn(updated.waitingOn),
    message: 'Satisfaction rating submitted',
    metadata: {
      rating: normalizedRating,
      hasComment: Boolean(normalizedComment)
    }
  });

  return mapTicketDetail(updated);
}

export async function updateSupportTicketMetadata(input: {
  ticketId: string;
  actorUserId: string;
  actorEmail: string;
  actorName?: string;
  actorRole: SupportActorRole;
  organization?: string;
  subject?: string;
  category?: SupportTicketCategory;
  module?: string;
  priority?: string;
  requestedDate?: string | null;
  caseRefs?: string[];
  pageUrl?: string;
}) {
  await connectDB();
  const ticketId = clean(input.ticketId);
  const existing = (await SupportTicket.findById(ticketId).lean()) as TicketDoc | null;
  if (!existing) return null;

  const update: Record<string, unknown> = {};
  const changedFields: string[] = [];

  if (typeof input.organization === 'string') {
    update.organization = clean(input.organization);
    changedFields.push('organization');
  }
  if (typeof input.subject === 'string') {
    update.subject = clean(input.subject);
    changedFields.push('subject');
  }
  if (typeof input.category === 'string') {
    update.category = normalizeCategory(input.category);
    changedFields.push('category');
  }
  if (typeof input.module === 'string') {
    update.module = clean(input.module);
    changedFields.push('module');
  }
  if (typeof input.priority === 'string') {
    update.priority = normalizePriority(input.priority);
    changedFields.push('priority');
  }
  if (input.requestedDate !== undefined) {
    update.requestedDate = parseRequestedDate(input.requestedDate);
    changedFields.push('requestedDate');
  }
  if (Array.isArray(input.caseRefs)) {
    update.caseRefs = normalizeCaseRefs(input.caseRefs);
    changedFields.push('caseRefs');
  }
  if (typeof input.pageUrl === 'string') {
    update.pageUrl = clean(input.pageUrl);
    changedFields.push('pageUrl');
  }

  if (changedFields.length === 0) {
    return mapTicketDetail(existing);
  }

  update.lastActivityAt = new Date();
  const updated = (await SupportTicket.findByIdAndUpdate(ticketId, { $set: update }, { new: true }).lean()) as
    | TicketDoc
    | null;
  if (!updated) return null;

  await appendTicketEvent({
    ticketId,
    eventType: 'updated',
    actorUserId: clean(input.actorUserId),
    actorEmail: normalizeEmail(input.actorEmail),
    actorName: clean(input.actorName),
    actorRole: input.actorRole,
    fromStatus: normalizeStatus(existing.status),
    toStatus: normalizeStatus(updated.status),
    fromWaitingOn: normalizeWaitingOn(existing.waitingOn),
    toWaitingOn: normalizeWaitingOn(updated.waitingOn),
    message: 'Ticket metadata updated',
    metadata: {
      changedFields
    }
  });

  return mapTicketDetail(updated);
}

export async function getSupportOverview(options?: { requesterUserId?: string | null }): Promise<SupportOverview> {
  await connectDB();
  const requesterUserId = clean(options?.requesterUserId);
  const baseQuery: Record<string, unknown> = requesterUserId ? { createdByUserId: requesterUserId } : {};
  const now = new Date();
  const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const startOfNextYear = new Date(Date.UTC(now.getUTCFullYear() + 1, 0, 1));

  const [total, open, closed, requiringOurInput, requiringYourInput, monthlyRaw, categoryRaw, recentRaw] =
    await Promise.all([
      SupportTicket.countDocuments(baseQuery),
      SupportTicket.countDocuments({ ...baseQuery, status: { $in: SUPPORT_TICKET_OPEN_STATUSES } }),
      SupportTicket.countDocuments({ ...baseQuery, status: { $in: SUPPORT_TICKET_CLOSED_STATUSES } }),
      SupportTicket.countDocuments({ ...baseQuery, status: { $in: SUPPORT_TICKET_OPEN_STATUSES }, waitingOn: 'support' }),
      SupportTicket.countDocuments({ ...baseQuery, status: { $in: SUPPORT_TICKET_OPEN_STATUSES }, waitingOn: 'customer' }),
      SupportTicket.aggregate<{ _id: number; count: number }>([
        { $match: { ...baseQuery, createdAt: { $gte: startOfYear, $lt: startOfNextYear } } },
        { $group: { _id: { $month: '$createdAt' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      SupportTicket.aggregate<{ _id: string; count: number }>([
        { $match: baseQuery },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      SupportTicket.find(baseQuery).sort({ lastActivityAt: -1, createdAt: -1 }).limit(12).lean<TicketDoc[]>()
    ]);

  const monthlyMap = new Map<number, number>();
  for (const item of monthlyRaw) {
    monthlyMap.set(Number(item._id), Math.max(0, Math.round(Number(item.count || 0))));
  }
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthly = monthLabels.map((label, index) => {
    const month = index + 1;
    return { month, label, count: monthlyMap.get(month) || 0 };
  });

  const categories = categoryRaw
    .map((item) => {
      const key = normalizeCategory(item._id);
      return {
        key,
        label: supportCategoryLabel(key),
        count: Math.max(0, Math.round(Number(item.count || 0)))
      };
    })
    .filter((item) => item.count > 0);

  return {
    totals: {
      total: Math.max(0, Math.round(Number(total || 0))),
      requiringOurInput: Math.max(0, Math.round(Number(requiringOurInput || 0))),
      requiringYourInput: Math.max(0, Math.round(Number(requiringYourInput || 0))),
      open: Math.max(0, Math.round(Number(open || 0))),
      closed: Math.max(0, Math.round(Number(closed || 0)))
    },
    monthly,
    categories,
    recentTickets: recentRaw.map(mapTicketSummary)
  };
}

export type {
  SupportOverview,
  SupportTicketDetail,
  SupportTicketEventSummary,
  SupportTicketMessageSummary,
  SupportTicketRatingSummary,
  SupportTicketSummary,
  SupportTicketThread
};
