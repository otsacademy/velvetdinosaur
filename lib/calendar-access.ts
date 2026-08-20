import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/calendar-access.ts');

import { CalendarDefinition, type CalendarColor } from '@/models/CalendarDefinition';
import { CalendarEvent } from '@/models/CalendarEvent';
import { CalendarShare, type CalendarShareRole } from '@/models/CalendarShare';

export type CalendarScope = {
  ownerUserId: string;
  calendarId: string;
  label: string;
  color: CalendarColor;
  owned: boolean;
  role: CalendarShareRole;
};

type CalendarDefinitionLean = {
  ownerUserId?: unknown;
  calendarId?: unknown;
  label?: unknown;
  color?: unknown;
  archived?: unknown;
};

type CalendarShareLean = {
  ownerUserId?: unknown;
  calendarId?: unknown;
  recipientEmail?: unknown;
  role?: unknown;
};

const DEFAULT_CALENDARS: Array<{ calendarId: string; label: string; color: CalendarColor }> = [
  { calendarId: 'personal', label: 'Personal', color: 'primary' },
  { calendarId: 'team', label: 'Team', color: 'accent' },
  { calendarId: 'tasks', label: 'Tasks', color: 'destructive' }
];

function normalizeColor(raw: unknown): CalendarColor {
  if (raw === 'accent' || raw === 'destructive' || raw === 'muted') return raw;
  return 'primary';
}

function sanitizeCalendarId(raw: string) {
  const cleaned = raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return cleaned || 'calendar';
}

function scopeKey(ownerUserId: string, calendarId: string) {
  return `${ownerUserId}::${calendarId}`;
}

export async function ensureDefaultCalendars(ownerUserId: string) {
  await Promise.all(
    DEFAULT_CALENDARS.map((entry) =>
      CalendarDefinition.updateOne(
        { ownerUserId, calendarId: entry.calendarId },
        {
          $setOnInsert: {
            ownerUserId,
            calendarId: entry.calendarId,
            label: entry.label,
            color: entry.color,
            archived: false
          }
        },
        { upsert: true }
      )
    )
  );
}

export async function createCalendarDefinition(input: {
  ownerUserId: string;
  label: string;
  color: CalendarColor;
}) {
  const base = sanitizeCalendarId(input.label);
  let calendarId = base;
  let suffix = 1;

  while (true) {
    const exists = await CalendarDefinition.exists({ ownerUserId: input.ownerUserId, calendarId });
    if (!exists) break;
    suffix += 1;
    calendarId = `${base}-${suffix}`;
  }

  const doc = await CalendarDefinition.create({
    ownerUserId: input.ownerUserId,
    calendarId,
    label: input.label.trim(),
    color: input.color,
    archived: false
  });

  return {
    ownerUserId: String((doc as { ownerUserId?: string }).ownerUserId || input.ownerUserId),
    calendarId: String((doc as { calendarId?: string }).calendarId || calendarId),
    label: String((doc as { label?: string }).label || input.label.trim()),
    color: normalizeColor((doc as { color?: unknown }).color),
    owned: true as const,
    role: 'edit' as const
  };
}

export async function shareCalendarDefinition(input: {
  ownerUserId: string;
  calendarId: string;
  recipientEmail: string;
  role: CalendarShareRole;
  createdByUserId: string;
}) {
  const recipientEmail = input.recipientEmail.trim().toLowerCase();
  await CalendarShare.updateOne(
    {
      ownerUserId: input.ownerUserId,
      calendarId: input.calendarId,
      recipientEmail
    },
    {
      $set: {
        ownerUserId: input.ownerUserId,
        calendarId: input.calendarId,
        recipientEmail,
        role: input.role,
        createdByUserId: input.createdByUserId
      }
    },
    { upsert: true }
  );
}

export async function listCalendarShares(input: {
  ownerUserId: string;
  calendarId: string;
}) {
  const docs = (await CalendarShare.find({
    ownerUserId: input.ownerUserId,
    calendarId: input.calendarId
  })
    .sort({ recipientEmail: 1, _id: 1 })
    .lean()) as CalendarShareLean[];

  return docs
    .map((doc) => {
      const recipientEmail = String(doc.recipientEmail || '').trim().toLowerCase();
      if (!recipientEmail) return null;
      return {
        recipientEmail,
        role: doc.role === 'view' ? 'view' : ('edit' as CalendarShareRole)
      };
    })
    .filter((entry): entry is { recipientEmail: string; role: CalendarShareRole } => Boolean(entry));
}

export async function listAccessibleCalendars(input: {
  userId: string;
  email: string | null | undefined;
}) {
  const userId = input.userId;
  const email = String(input.email || '').trim().toLowerCase();

  await ensureDefaultCalendars(userId);

  const [ownedDocs, shareDocs] = await Promise.all([
    CalendarDefinition.find({ ownerUserId: userId, archived: { $ne: true } })
      .sort({ label: 1, calendarId: 1, _id: 1 })
      .lean<CalendarDefinitionLean[]>(),
    email
      ? CalendarShare.find({ recipientEmail: email })
          .sort({ ownerUserId: 1, calendarId: 1, _id: 1 })
          .lean<CalendarShareLean[]>()
      : Promise.resolve([] as CalendarShareLean[])
  ]);

  const sharedLookup = new Map<string, CalendarShareRole>();
  for (const shareDoc of shareDocs) {
    const ownerUserId = String(shareDoc.ownerUserId || '').trim();
    const calendarId = String(shareDoc.calendarId || '').trim();
    if (!ownerUserId || !calendarId) continue;
    sharedLookup.set(scopeKey(ownerUserId, calendarId), shareDoc.role === 'view' ? 'view' : 'edit');
  }

  let sharedDefinitionDocs: CalendarDefinitionLean[] = [];
  if (sharedLookup.size) {
    const scopeFilters = Array.from(sharedLookup.keys()).map((key) => {
      const [ownerUserId, calendarId] = key.split('::');
      return { ownerUserId, calendarId };
    });

    sharedDefinitionDocs = (await CalendarDefinition.find({
      archived: { $ne: true },
      $or: scopeFilters
    }).lean()) as CalendarDefinitionLean[];
  }

  const map = new Map<string, CalendarScope>();

  for (const doc of ownedDocs) {
    const ownerUserId = String(doc.ownerUserId || '').trim();
    const calendarId = String(doc.calendarId || '').trim();
    const label = String(doc.label || '').trim() || calendarId;
    if (!ownerUserId || !calendarId) continue;

    map.set(scopeKey(ownerUserId, calendarId), {
      ownerUserId,
      calendarId,
      label,
      color: normalizeColor(doc.color),
      owned: true,
      role: 'edit'
    });
  }

  for (const doc of sharedDefinitionDocs) {
    const ownerUserId = String(doc.ownerUserId || '').trim();
    const calendarId = String(doc.calendarId || '').trim();
    if (!ownerUserId || !calendarId || ownerUserId === userId) continue;
    const key = scopeKey(ownerUserId, calendarId);
    const role = sharedLookup.get(key);
    if (!role) continue;

    map.set(key, {
      ownerUserId,
      calendarId,
      label: String(doc.label || '').trim() || calendarId,
      color: normalizeColor(doc.color),
      owned: false,
      role
    });
  }

  // Fallback: if definitions are missing, infer scopes from events.
  if (map.size === 0) {
    const inferred = (await CalendarEvent.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: { userId: '$userId', calendarId: '$calendarId' },
          calendarName: { $first: '$calendarName' },
          calendarColor: { $first: '$calendarColor' }
        }
      }
    ])) as Array<{
      _id?: { userId?: string; calendarId?: string };
      calendarName?: string;
      calendarColor?: unknown;
    }>;

    for (const item of inferred) {
      const ownerUserId = String(item._id?.userId || '').trim();
      const calendarId = String(item._id?.calendarId || '').trim();
      if (!ownerUserId || !calendarId) continue;
      map.set(scopeKey(ownerUserId, calendarId), {
        ownerUserId,
        calendarId,
        label: String(item.calendarName || '').trim() || calendarId,
        color: normalizeColor(item.calendarColor),
        owned: ownerUserId === userId,
        role: 'edit'
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.owned !== b.owned) return a.owned ? -1 : 1;
    return a.label.localeCompare(b.label);
  });
}
