export type InviteRole = 'user' | 'admin';
export type InviteView = 'active' | 'accepted' | 'past' | 'all';
export type InviteStatus = 'pending' | 'used' | 'revoked' | 'expired';

export type InviteRow = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  orcidId: string;
  primaryChapterSlug: string;
  primaryChapterName: string;
  chapterSlugs: string[];
  role: InviteRole;
  expiresAt: string | null;
  usedAt: string | null;
  revokedAt: string | null;
  createdAt: string | null;
  createdByUserId: string | null;
};

export type CreateInviteResponse = {
  invite: InviteRow;
  inviteUrl: string;
  emailSent: boolean;
};

export type ActiveUserRow = {
  id: string;
  name: string;
  email: string;
  role: InviteRole;
  orcidId: string;
  primaryChapterSlug: string;
  primaryChapterName: string;
  chapterSlugs: string[];
  createdAt: string | null;
  lastLoginAt: string | null;
};

export type ActiveUsersSummary = {
  total: number;
  admins: number;
  users: number;
  recentlyActive: number;
};

export type ActiveUsersResponse = {
  users: ActiveUserRow[];
  summary: ActiveUsersSummary;
};

export function formatDate(value?: string | null) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleString();
}

export function getInviteStatus(invite: InviteRow, currentTime: number): InviteStatus {
  if (invite.usedAt) return 'used';
  if (invite.revokedAt) return 'revoked';
  const expiresAt = new Date(invite.expiresAt || 0).getTime();
  if (expiresAt > 0 && expiresAt < currentTime) return 'expired';
  return 'pending';
}

export function displayInviteName(invite: InviteRow) {
  const combined = `${invite.firstName || ''} ${invite.lastName || ''}`.replace(/\s+/g, ' ').trim();
  if (combined) return combined;
  const email = invite.email || '';
  const local = email.split('@')[0] || '';
  return local.replace(/[._-]+/g, ' ') || email || 'Unknown invitee';
}
