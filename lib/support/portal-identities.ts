import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/support/portal-identities.ts');

import { connectDB } from '@/lib/db';
import type { SupportActorRole, SupportTicketSummary, SupportTicketThread } from '@/lib/support/tickets-shared';
import { UserProfile } from '@/models/UserProfile';

export type SupportPortalMessageKind = 'requester' | 'staff' | 'automation';

type UserProfileLeanRow = {
  userId?: string;
  displayName?: string;
  avatarUrl?: string;
};

type ResolvedIdentity = {
  displayName: string;
  avatarUrl: string;
};

const VELVET_DINOSAUR_NAME = 'Velvet Dinosaur';
const VELVET_DINOSAUR_AVATAR = '/dinosaur.webp';
const CUSTOMER_NAME = 'Customer';
const AUTOMATION_NAME = 'System Automation';

const AUTOMATION_MARKER = /sync|automation|automated|bot|cron|daemon|smoke|test/i;
const NON_PHOTO_AVATAR_MARKER = [
  '/placeholder.svg',
  '/images/placeholder.svg',
  '/images/asap-logo-trimmed.webp',
  '/images/asap-logo.png',
  '/images/asap-admin-logo.jpg',
  'default-avatar',
  'avatar-default'
];

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function lower(value: unknown) {
  return clean(value).toLowerCase();
}

function titleize(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1).toLowerCase())
    .join(' ')
    .trim();
}

function inferNameFromEmail(email: string, fallback: string) {
  const localPart = (email.split('@')[0] || '').replace(/[._-]+/g, ' ').trim();
  return localPart ? titleize(localPart) : fallback;
}

function isMeaningfulAvatar(url: string) {
  const normalized = lower(url);
  if (!normalized) return false;
  return !NON_PHOTO_AVATAR_MARKER.some((marker) => normalized.includes(marker));
}

function normalizeAvatar(url: string) {
  return isMeaningfulAvatar(url) ? url : '';
}

function resolveMessageKind(input: {
  authorRole: SupportActorRole;
  authorUserId: string;
  authorEmail: string;
  authorName: string;
  bodyText: string;
}): SupportPortalMessageKind {
  if (input.authorRole === 'admin-requester') return 'requester';
  if (input.authorRole === 'support-agent') return 'staff';

  const signature = [input.authorUserId, input.authorEmail, input.authorName, input.bodyText].join(' ').toLowerCase();
  const hasHumanName = input.authorName.includes(' ') && !AUTOMATION_MARKER.test(input.authorName);

  if (hasHumanName) return 'staff';
  return AUTOMATION_MARKER.test(signature) ? 'automation' : 'staff';
}

async function loadProfilesByUserId(userIds: string[]) {
  if (userIds.length === 0) return new Map<string, ResolvedIdentity>();

  await connectDB();
  const rows = (await UserProfile.find(
    { userId: { $in: userIds } },
    { userId: 1, displayName: 1, avatarUrl: 1 }
  ).lean()) as UserProfileLeanRow[];

  const map = new Map<string, ResolvedIdentity>();
  for (const row of rows) {
    const userId = clean(row.userId);
    if (!userId) continue;
    const displayName = clean(row.displayName);
    const avatarUrl = normalizeAvatar(clean(row.avatarUrl));
    map.set(userId, {
      displayName: displayName || CUSTOMER_NAME,
      avatarUrl
    });
  }
  return map;
}

function resolveIdentity(input: {
  userId: string;
  email: string;
  name: string;
  role: SupportActorRole;
  kind?: SupportPortalMessageKind;
  profileMap: Map<string, ResolvedIdentity>;
}): ResolvedIdentity {
  const profile = input.userId ? input.profileMap.get(input.userId) : null;
  const normalizedEmail = lower(input.email);
  const profileName = clean(profile?.displayName);
  const inputName = clean(input.name);

  if (input.kind === 'automation') {
    return {
      displayName: AUTOMATION_NAME,
      avatarUrl: ''
    };
  }

  if (input.role === 'admin-requester') {
    const displayName = profileName || inputName || inferNameFromEmail(normalizedEmail, CUSTOMER_NAME);
    return {
      displayName,
      avatarUrl: clean(profile?.avatarUrl)
    };
  }

  const displayName = profileName || inputName || inferNameFromEmail(normalizedEmail, VELVET_DINOSAUR_NAME);
  return {
    displayName,
    avatarUrl: clean(profile?.avatarUrl) || VELVET_DINOSAUR_AVATAR
  };
}

function collectUserIds(items: Array<{ userId?: string }>) {
  const unique = new Set<string>();
  for (const item of items) {
    const userId = clean(item.userId);
    if (userId) unique.add(userId);
  }
  return Array.from(unique);
}

export async function enrichSupportTicketsWithIdentities<T extends SupportTicketSummary>(tickets: T[]) {
  const profileMap = await loadProfilesByUserId(
    collectUserIds(
      tickets.flatMap((ticket) => [
        { userId: ticket.createdByUserId },
        { userId: ticket.assignedToUserId }
      ])
    )
  );

  return tickets.map((ticket) => {
    const requesterIdentity = resolveIdentity({
      userId: clean(ticket.createdByUserId),
      email: clean(ticket.createdByEmail),
      name: '',
      role: 'admin-requester',
      profileMap
    });

    const assigneeIdentity = clean(ticket.assignedToUserId) || clean(ticket.assignedToEmail)
      ? resolveIdentity({
          userId: clean(ticket.assignedToUserId),
          email: clean(ticket.assignedToEmail),
          name: '',
          role: 'support-agent',
          profileMap
        })
      : { displayName: '', avatarUrl: '' };

    return {
      ...ticket,
      createdByName: requesterIdentity.displayName,
      createdByAvatarUrl: requesterIdentity.avatarUrl,
      assignedToName: assigneeIdentity.displayName,
      assignedToAvatarUrl: assigneeIdentity.avatarUrl
    };
  });
}

export async function enrichSupportThreadWithIdentities<T extends SupportTicketThread>(thread: T) {
  const profileMap = await loadProfilesByUserId(
    collectUserIds([
      { userId: thread.ticket.createdByUserId },
      { userId: thread.ticket.assignedToUserId },
      ...thread.messages.map((message) => ({ userId: message.authorUserId }))
    ])
  );

  const requesterIdentity = resolveIdentity({
    userId: clean(thread.ticket.createdByUserId),
    email: clean(thread.ticket.createdByEmail),
    name: '',
    role: 'admin-requester',
    profileMap
  });

  const assigneeIdentity = clean(thread.ticket.assignedToUserId) || clean(thread.ticket.assignedToEmail)
    ? resolveIdentity({
        userId: clean(thread.ticket.assignedToUserId),
        email: clean(thread.ticket.assignedToEmail),
        name: '',
        role: 'support-agent',
        profileMap
      })
    : { displayName: '', avatarUrl: '' };

  const messages = thread.messages.map((message) => {
    const kind = resolveMessageKind({
      authorRole: message.authorRole,
      authorUserId: clean(message.authorUserId),
      authorEmail: clean(message.authorEmail),
      authorName: clean(message.authorName),
      bodyText: clean(message.bodyText)
    });

    const sameRequester =
      clean(message.authorUserId) &&
      clean(thread.ticket.createdByUserId) &&
      clean(message.authorUserId) === clean(thread.ticket.createdByUserId);
    const requesterEmailMatch =
      lower(message.authorEmail) &&
      lower(thread.ticket.createdByEmail) &&
      lower(message.authorEmail) === lower(thread.ticket.createdByEmail);

    const identity =
      kind === 'requester' && (sameRequester || requesterEmailMatch)
        ? requesterIdentity
        : resolveIdentity({
            userId: clean(message.authorUserId),
            email: clean(message.authorEmail),
            name: clean(message.authorName),
            role: message.authorRole,
            kind,
            profileMap
          });

    return {
      ...message,
      authorDisplayName: identity.displayName,
      authorAvatarUrl: identity.avatarUrl,
      authorType: kind
    };
  });

  return {
    ...thread,
    ticket: {
      ...thread.ticket,
      createdByName: requesterIdentity.displayName,
      createdByAvatarUrl: requesterIdentity.avatarUrl,
      assignedToName: assigneeIdentity.displayName,
      assignedToAvatarUrl: assigneeIdentity.avatarUrl
    },
    messages
  };
}
