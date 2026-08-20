import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/user-profile.ts');

import { normalizeChapterSlug, normalizeChapterSlugs } from '@/lib/chapters';
import { connectDB } from '@/lib/db';
import { UserProfile } from '@/models/UserProfile';

export const DEFAULT_PROFILE_NAME = 'ASAP Staff';
export const DEFAULT_PROFILE_AVATAR = '/images/asap-logo-trimmed.webp';

type SessionUserInput = {
  id?: unknown;
  email?: unknown;
  name?: unknown;
  image?: unknown;
};

type SessionShape = {
  user?: SessionUserInput;
};

export type SessionUser = {
  id: string | null;
  email: string | null;
  name: string | null;
  image: string | null;
};

export type UserProfileRecord = {
  userId: string;
  displayName: string;
  firstName: string;
  lastName: string;
  academicTitle: string;
  showInMembersDirectory: boolean;
  primaryChapterSlug: string;
  chapterSlugs: string[];
  institution: string;
  department: string;
  country: string;
  location: string;
  avatarUrl: string;
  bio: string;
  orcidId: string;
  orcidUrl: string;
  scholarId: string;
  scholarUrl: string;
};

export type AuthorIdentity = {
  userId: string | null;
  name: string;
  image: string;
};

function toCleanString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeName(value: string) {
  const compact = value.replace(/\s+/g, ' ').trim();
  return compact || DEFAULT_PROFILE_NAME;
}

function inferNameFromEmail(email: string) {
  if (!email) return DEFAULT_PROFILE_NAME;
  const localPart = email.split('@')[0] || '';
  const cleaned = localPart.replace(/[._-]+/g, ' ').trim();
  return normalizeName(cleaned || DEFAULT_PROFILE_NAME);
}

function splitNameParts(value: string) {
  const cleaned = value
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) {
    return { firstName: '', lastName: '' };
  }

  const parts = cleaned.split(' ').filter(Boolean);
  if (parts.length === 1) {
    return { firstName: parts[0] || '', lastName: '' };
  }

  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ')
  };
}

function normalizeAvatar(value: string) {
  if (!value) return DEFAULT_PROFILE_AVATAR;
  if (
    value === '/placeholder.svg' ||
    value === '/images/placeholder.svg' ||
    value.toLowerCase() === 'placeholder.svg'
  ) {
    return DEFAULT_PROFILE_AVATAR;
  }
  return value;
}

function toCleanStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => toCleanString(entry)).filter(Boolean);
}

function sameStringArray(left: readonly string[], right: readonly string[]) {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function resolveNextField(inputValue: string | undefined, currentValue: string) {
  return inputValue === undefined ? currentValue : toCleanString(inputValue);
}

function buildProfileFromSources(input: {
  existing?: {
    displayName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    academicTitle?: string | null;
    showInMembersDirectory?: boolean | null;
    primaryChapterSlug?: string | null;
    chapterSlugs?: string[] | null;
    institution?: string | null;
    department?: string | null;
    country?: string | null;
    location?: string | null;
    avatarUrl?: string | null;
    bio?: string | null;
    orcidId?: string | null;
    orcidUrl?: string | null;
    scholarId?: string | null;
    scholarUrl?: string | null;
  } | null;
  sessionUser?: SessionUser | null;
}) {
  const existing = input.existing || null;
  const sessionUser = input.sessionUser || null;
  const fromExistingName = normalizeName(toCleanString(existing?.displayName));
  const fromSessionName = normalizeName(toCleanString(sessionUser?.name));
  const fromEmail = inferNameFromEmail(toCleanString(sessionUser?.email));
  const parsedSessionName = splitNameParts(toCleanString(sessionUser?.name));

  const displayName = toCleanString(existing?.displayName)
    ? fromExistingName
    : toCleanString(sessionUser?.name)
      ? fromSessionName
      : fromEmail;

  const firstName = toCleanString(existing?.firstName) || parsedSessionName.firstName;
  const lastName = toCleanString(existing?.lastName) || parsedSessionName.lastName;
  const existingAvatar = normalizeAvatar(toCleanString(existing?.avatarUrl));
  const sessionAvatar = normalizeAvatar(toCleanString(sessionUser?.image));
  const avatarUrl = toCleanString(existing?.avatarUrl) ? existingAvatar : sessionAvatar;
  const country = toCleanString(existing?.country) || toCleanString(existing?.location);
  const location = toCleanString(existing?.location) || country;
  const primaryChapterSlug = normalizeChapterSlug(existing?.primaryChapterSlug);
  const chapterSlugs = normalizeChapterSlugs(existing?.chapterSlugs, primaryChapterSlug);

  return {
    displayName: normalizeName(displayName),
    firstName,
    lastName,
    academicTitle: toCleanString(existing?.academicTitle),
    showInMembersDirectory: existing?.showInMembersDirectory === true,
    primaryChapterSlug,
    chapterSlugs,
    institution: toCleanString(existing?.institution),
    department: toCleanString(existing?.department),
    country,
    location,
    avatarUrl: normalizeAvatar(avatarUrl),
    bio: toCleanString(existing?.bio),
    orcidId: toCleanString(existing?.orcidId),
    orcidUrl: toCleanString(existing?.orcidUrl),
    scholarId: toCleanString(existing?.scholarId),
    scholarUrl: toCleanString(existing?.scholarUrl)
  };
}

export function readSessionUser(session: unknown): SessionUser | null {
  const user = (session as SessionShape | null)?.user;
  if (!user || typeof user !== 'object') return null;

  const id = toCleanString(user.id) || null;
  const email = toCleanString(user.email).toLowerCase() || null;
  const name = toCleanString(user.name) || null;
  const image = toCleanString(user.image) || null;

  return { id, email, name, image };
}

export async function getUserProfileByUserId(userId?: string | null) {
  const normalizedUserId = toCleanString(userId);
  if (!normalizedUserId) return null;

  const conn = await connectDB();
  if (!conn) {
    return null;
  }
  const row = await UserProfile.findOne({ userId: normalizedUserId }).lean();
  if (!row || Array.isArray(row)) return null;

  const normalized = buildProfileFromSources({
    existing: {
      displayName: (row as { displayName?: string }).displayName,
      firstName: (row as { firstName?: string }).firstName,
      lastName: (row as { lastName?: string }).lastName,
      academicTitle: (row as { academicTitle?: string }).academicTitle,
      showInMembersDirectory: (row as { showInMembersDirectory?: boolean }).showInMembersDirectory,
      primaryChapterSlug: (row as { primaryChapterSlug?: string }).primaryChapterSlug,
      chapterSlugs: (row as { chapterSlugs?: string[] }).chapterSlugs,
      institution: (row as { institution?: string }).institution,
      department: (row as { department?: string }).department,
      country: (row as { country?: string }).country,
      location: (row as { location?: string }).location,
      avatarUrl: (row as { avatarUrl?: string }).avatarUrl,
      bio: (row as { bio?: string }).bio,
      orcidId: (row as { orcidId?: string }).orcidId,
      orcidUrl: (row as { orcidUrl?: string }).orcidUrl,
      scholarId: (row as { scholarId?: string }).scholarId,
      scholarUrl: (row as { scholarUrl?: string }).scholarUrl
    }
  });

  return {
    userId: normalizedUserId,
    displayName: normalized.displayName,
    firstName: normalized.firstName,
    lastName: normalized.lastName,
    academicTitle: normalized.academicTitle,
    showInMembersDirectory: normalized.showInMembersDirectory,
    primaryChapterSlug: normalized.primaryChapterSlug,
    chapterSlugs: normalized.chapterSlugs,
    institution: normalized.institution,
    department: normalized.department,
    country: normalized.country,
    location: normalized.location,
    avatarUrl: normalized.avatarUrl,
    bio: normalized.bio,
    orcidId: normalized.orcidId,
    orcidUrl: normalized.orcidUrl,
    scholarId: normalized.scholarId,
    scholarUrl: normalized.scholarUrl
  } as UserProfileRecord;
}

export async function ensureUserProfileForSessionUser(sessionUser: SessionUser | null) {
  const userId = toCleanString(sessionUser?.id);
  if (!userId) {
    return null;
  }

  const conn = await connectDB();
  if (!conn) {
    const normalized = buildProfileFromSources({ sessionUser });
    return {
      userId,
      displayName: normalized.displayName,
      firstName: normalized.firstName,
      lastName: normalized.lastName,
      academicTitle: normalized.academicTitle,
      showInMembersDirectory: false,
      primaryChapterSlug: '',
      chapterSlugs: [],
      institution: normalized.institution,
      department: normalized.department,
      country: normalized.country,
      location: normalized.location,
      avatarUrl: normalized.avatarUrl,
      bio: '',
      orcidId: '',
      orcidUrl: '',
      scholarId: '',
      scholarUrl: ''
    } as UserProfileRecord;
  }
  const existing = await UserProfile.findOne({ userId });
  const normalized = buildProfileFromSources({
    existing: existing
      ? {
          displayName: existing.displayName,
          firstName: existing.firstName,
          lastName: existing.lastName,
          academicTitle: existing.academicTitle,
          showInMembersDirectory: existing.showInMembersDirectory,
          primaryChapterSlug: existing.primaryChapterSlug,
          chapterSlugs: toCleanStringArray(existing.chapterSlugs),
          institution: existing.institution,
          department: existing.department,
          country: existing.country,
          location: existing.location,
          avatarUrl: existing.avatarUrl,
          bio: existing.bio,
          orcidId: existing.orcidId,
          orcidUrl: existing.orcidUrl,
          scholarId: existing.scholarId,
          scholarUrl: existing.scholarUrl
        }
      : null,
    sessionUser
  });

  if (!existing) {
    const created = await UserProfile.create({
      userId,
      displayName: normalized.displayName,
      firstName: normalized.firstName,
      lastName: normalized.lastName,
      academicTitle: normalized.academicTitle,
      showInMembersDirectory: normalized.showInMembersDirectory,
      primaryChapterSlug: normalized.primaryChapterSlug,
      chapterSlugs: normalized.chapterSlugs,
      institution: normalized.institution,
      department: normalized.department,
      country: normalized.country,
      location: normalized.location,
      avatarUrl: normalized.avatarUrl,
      bio: '',
      orcidId: '',
      orcidUrl: '',
      scholarId: '',
      scholarUrl: ''
    });
    return {
      userId,
      displayName: created.displayName,
      firstName: toCleanString(created.firstName),
      lastName: toCleanString(created.lastName),
      academicTitle: toCleanString(created.academicTitle),
      primaryChapterSlug: normalizeChapterSlug(created.primaryChapterSlug),
      chapterSlugs: normalizeChapterSlugs(created.chapterSlugs, created.primaryChapterSlug),
      institution: toCleanString(created.institution),
      department: toCleanString(created.department),
      country: toCleanString(created.country) || toCleanString(created.location),
      location: toCleanString(created.location) || toCleanString(created.country),
      avatarUrl: normalizeAvatar(created.avatarUrl),
      bio: toCleanString(created.bio),
      orcidId: toCleanString(created.orcidId),
      orcidUrl: toCleanString(created.orcidUrl),
      scholarId: toCleanString(created.scholarId),
      scholarUrl: toCleanString(created.scholarUrl)
    } as UserProfileRecord;
  }

  let dirty = false;
  if (!toCleanString(existing.displayName)) {
    existing.displayName = normalized.displayName;
    dirty = true;
  }
  if (!toCleanString(existing.avatarUrl)) {
    existing.avatarUrl = normalized.avatarUrl;
    dirty = true;
  }
  if (toCleanString(existing.primaryChapterSlug) !== normalized.primaryChapterSlug) {
    existing.primaryChapterSlug = normalized.primaryChapterSlug;
    dirty = true;
  }
  if (!sameStringArray(toCleanStringArray(existing.chapterSlugs), normalized.chapterSlugs)) {
    existing.chapterSlugs = normalized.chapterSlugs;
    dirty = true;
  }
  if (dirty) {
    await existing.save();
  }

  return {
    userId,
    displayName: normalizeName(toCleanString(existing.displayName)),
    firstName: toCleanString(existing.firstName),
    lastName: toCleanString(existing.lastName),
    academicTitle: toCleanString(existing.academicTitle),
    showInMembersDirectory: existing.showInMembersDirectory === true,
    primaryChapterSlug: normalizeChapterSlug(existing.primaryChapterSlug),
    chapterSlugs: normalizeChapterSlugs(existing.chapterSlugs, existing.primaryChapterSlug),
    institution: toCleanString(existing.institution),
    department: toCleanString(existing.department),
    country: toCleanString(existing.country) || toCleanString(existing.location),
    location: toCleanString(existing.location) || toCleanString(existing.country),
    avatarUrl: normalizeAvatar(toCleanString(existing.avatarUrl)),
    bio: toCleanString(existing.bio),
    orcidId: toCleanString(existing.orcidId),
    orcidUrl: toCleanString(existing.orcidUrl),
    scholarId: toCleanString(existing.scholarId),
    scholarUrl: toCleanString(existing.scholarUrl)
  } as UserProfileRecord;
}

export async function updateUserProfileForUser(
  userId: string,
  input: {
    displayName?: string;
    firstName?: string;
    lastName?: string;
    academicTitle?: string;
    showInMembersDirectory?: boolean;
    primaryChapterSlug?: string;
    chapterSlugs?: string[];
    institution?: string;
    department?: string;
    country?: string;
    location?: string;
    avatarUrl?: string;
    bio?: string;
    orcidId?: string;
    orcidUrl?: string;
    scholarId?: string;
    scholarUrl?: string;
  },
  sessionUser?: SessionUser | null
) {
  const normalizedUserId = toCleanString(userId);
  if (!normalizedUserId) {
    throw new Error('Invalid user id');
  }

  const existing = await ensureUserProfileForSessionUser(sessionUser || { id: normalizedUserId, email: null, name: null, image: null });
  const current = existing || {
    userId: normalizedUserId,
    displayName: DEFAULT_PROFILE_NAME,
    firstName: '',
    lastName: '',
    academicTitle: '',
    showInMembersDirectory: false,
    primaryChapterSlug: '',
    chapterSlugs: [],
    institution: '',
    department: '',
    country: '',
    location: '',
    avatarUrl: DEFAULT_PROFILE_AVATAR,
    bio: '',
    orcidId: '',
    orcidUrl: '',
    scholarId: '',
    scholarUrl: ''
  };

  const nextDisplayName = normalizeName(resolveNextField(input.displayName, current.displayName));
  const nextFirstName = resolveNextField(input.firstName, current.firstName);
  const nextLastName = resolveNextField(input.lastName, current.lastName);
  const nextAcademicTitle = resolveNextField(input.academicTitle, current.academicTitle);
  const nextShowInMembersDirectory =
    input.showInMembersDirectory === undefined
      ? current.showInMembersDirectory === true
      : input.showInMembersDirectory === true;
  const nextPrimaryChapterSlug =
    input.primaryChapterSlug === undefined
      ? normalizeChapterSlug(current.primaryChapterSlug)
      : normalizeChapterSlug(input.primaryChapterSlug);
  const nextChapterSlugs =
    input.chapterSlugs === undefined && input.primaryChapterSlug === undefined
      ? normalizeChapterSlugs(current.chapterSlugs, nextPrimaryChapterSlug)
      : normalizeChapterSlugs(input.chapterSlugs ?? current.chapterSlugs, nextPrimaryChapterSlug);
  const nextInstitution = resolveNextField(input.institution, current.institution);
  const nextDepartment = resolveNextField(input.department, current.department);
  const nextCountry = resolveNextField(input.country ?? input.location, current.country || current.location);
  const nextLocation = resolveNextField(input.location ?? input.country, current.location || current.country);
  const nextAvatarUrl = normalizeAvatar(resolveNextField(input.avatarUrl, current.avatarUrl));
  const nextBio = resolveNextField(input.bio, current.bio);
  const nextOrcidId = resolveNextField(input.orcidId, current.orcidId);
  const nextOrcidUrl = resolveNextField(input.orcidUrl, current.orcidUrl);
  const nextScholarId = resolveNextField(input.scholarId, current.scholarId);
  const nextScholarUrl = resolveNextField(input.scholarUrl, current.scholarUrl);

  const conn = await connectDB();
  if (!conn) {
    return {
      userId: normalizedUserId,
      displayName: nextDisplayName,
      firstName: nextFirstName,
      lastName: nextLastName,
      academicTitle: nextAcademicTitle,
      showInMembersDirectory: nextShowInMembersDirectory,
      primaryChapterSlug: nextPrimaryChapterSlug,
      chapterSlugs: nextChapterSlugs,
      institution: nextInstitution,
      department: nextDepartment,
      country: nextCountry,
      location: nextLocation,
      avatarUrl: nextAvatarUrl,
      bio: nextBio,
      orcidId: nextOrcidId,
      orcidUrl: nextOrcidUrl,
      scholarId: nextScholarId,
      scholarUrl: nextScholarUrl
    } as UserProfileRecord;
  }
  const row = await UserProfile.findOneAndUpdate(
    { userId: normalizedUserId },
    {
      $set: {
        displayName: nextDisplayName,
        firstName: nextFirstName,
        lastName: nextLastName,
        academicTitle: nextAcademicTitle,
        showInMembersDirectory: nextShowInMembersDirectory,
        primaryChapterSlug: nextPrimaryChapterSlug,
        chapterSlugs: nextChapterSlugs,
        institution: nextInstitution,
        department: nextDepartment,
        country: nextCountry,
        location: nextLocation,
        avatarUrl: nextAvatarUrl,
        bio: nextBio,
        orcidId: nextOrcidId,
        orcidUrl: nextOrcidUrl,
        scholarId: nextScholarId,
        scholarUrl: nextScholarUrl
      }
    },
    { upsert: true, new: true }
  );

  return {
    userId: normalizedUserId,
    displayName: normalizeName(toCleanString(row?.displayName || nextDisplayName)),
    firstName: toCleanString(row?.firstName || nextFirstName),
    lastName: toCleanString(row?.lastName || nextLastName),
    academicTitle: toCleanString(row?.academicTitle || nextAcademicTitle),
    showInMembersDirectory:
      typeof row?.showInMembersDirectory === 'boolean'
        ? row.showInMembersDirectory
        : nextShowInMembersDirectory,
    primaryChapterSlug: normalizeChapterSlug(row?.primaryChapterSlug || nextPrimaryChapterSlug),
    chapterSlugs: normalizeChapterSlugs(row?.chapterSlugs || nextChapterSlugs, row?.primaryChapterSlug || nextPrimaryChapterSlug),
    institution: toCleanString(row?.institution || nextInstitution),
    department: toCleanString(row?.department || nextDepartment),
    country: toCleanString(row?.country || nextCountry || nextLocation),
    location: toCleanString(row?.location || nextLocation || nextCountry),
    avatarUrl: normalizeAvatar(toCleanString(row?.avatarUrl || nextAvatarUrl)),
    bio: toCleanString(row?.bio || nextBio),
    orcidId: toCleanString(row?.orcidId || nextOrcidId),
    orcidUrl: toCleanString(row?.orcidUrl || nextOrcidUrl),
    scholarId: toCleanString(row?.scholarId || nextScholarId),
    scholarUrl: toCleanString(row?.scholarUrl || nextScholarUrl)
  } as UserProfileRecord;
}

export async function resolveAuthorIdentity(session: unknown, fallback?: { name?: string; image?: string | null }) {
  const sessionUser = readSessionUser(session);
  const profile = await ensureUserProfileForSessionUser(sessionUser);
  const fallbackName = normalizeName(toCleanString(fallback?.name));
  const fallbackImage = normalizeAvatar(toCleanString(fallback?.image));

  return {
    userId: profile?.userId || sessionUser?.id || null,
    name: profile?.displayName || fallbackName,
    image: profile?.avatarUrl || fallbackImage
  } as AuthorIdentity;
}
