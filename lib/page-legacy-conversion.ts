import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/page-legacy-conversion.ts');

import type { Data } from '@puckeditor/core';
import { connectDB } from '@/lib/db';
import { Page } from '@/models/Page';
import { listLegacyPageComponents } from '@/lib/puck/legacy-page-components';
import {
  findLegacyTypesWithoutTemplates,
  migrateLegacyTemplateNodes
} from '@/lib/puck/page-template-migrations';

type PageHistoryEntry = {
  action: string;
  createdAt: Date;
  snapshot: unknown;
  meta?: Record<string, unknown>;
};

type LegacySnapshotEntry = {
  id: string;
  timestamp: string;
  userId: string;
  draftPayload?: unknown;
  publishedPayload?: unknown;
  fromType: string;
};

type PageDoc = {
  slug: string;
  title?: string;
  data?: unknown;
  draftData?: unknown;
  publishedData?: unknown;
  draftUpdatedAt?: Date;
  publishedAt?: Date;
  primaryChapterSlug?: string | null;
  chapterSlugs?: string[] | null;
  status?: string;
  updatedAt?: Date;
  history?: PageHistoryEntry[];
  legacySnapshots?: LegacySnapshotEntry[];
};

export type PageLegacyConversionResult = {
  page: PageDoc | null;
  converted: boolean;
  snapshotStored: boolean;
  snapshotId: string | null;
  fromType: string | null;
  toBlockCount: number;
  publishedUpdated: boolean;
  legacyTemplateTypes: string[];
};

export type PageLegacyRollbackResult = {
  page: PageDoc | null;
  restored: boolean;
  snapshotId: string | null;
};

export type LegacyConversionOptions = {
  publishConverted?: boolean;
};

function resolvePublishedData(page: PageDoc | null): unknown | null {
  if (!page) return null;
  return page.publishedData ?? page.data ?? null;
}

function resolveDraftData(page: PageDoc | null): unknown | null {
  if (!page) return null;
  return page.draftData ?? page.publishedData ?? page.data ?? null;
}

function appendHistoryEntry(history: unknown, entry: PageHistoryEntry): PageHistoryEntry[] {
  const existing = Array.isArray(history) ? history : [];
  return [...existing, entry].slice(-20);
}

function appendLegacySnapshot(
  snapshots: unknown,
  entry: LegacySnapshotEntry
): LegacySnapshotEntry[] {
  const existing = Array.isArray(snapshots) ? (snapshots as LegacySnapshotEntry[]) : [];
  return [...existing, entry].slice(-30);
}

function createLegacySnapshotEntry(input: {
  userId: string;
  draftPayload?: unknown;
  publishedPayload?: unknown;
  fromType: string;
}): LegacySnapshotEntry {
  const timestamp = new Date().toISOString();
  const snapshotId = `${timestamp}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    id: snapshotId,
    timestamp,
    userId: input.userId,
    draftPayload: input.draftPayload,
    publishedPayload: input.publishedPayload,
    fromType: input.fromType
  };
}

function resolveLegacySourceType(legacyTemplateTypes: string[]) {
  return legacyTemplateTypes.join(', ');
}

function assertNoMissingLegacyTemplateMappings(legacyTemplateTypes: string[]) {
  const missingTemplates = findLegacyTypesWithoutTemplates(legacyTemplateTypes);
  if (missingTemplates.length > 0) {
    throw new Error(
      `Missing legacy conversion template mappings for: ${missingTemplates.join(', ')}`
    );
  }
}

function isPuckData(value: unknown): value is Data {
  if (!value || typeof value !== 'object') return false;
  const maybe = value as { root?: unknown; content?: unknown };
  if (!maybe.root || typeof maybe.root !== 'object') return false;
  if (!Array.isArray(maybe.content)) return false;
  return true;
}

export async function convertLegacyPageTemplateToBlocks(
  slug: string,
  userId = 'system',
  options: LegacyConversionOptions = {}
): Promise<PageLegacyConversionResult> {
  const normalizedUserId = userId.trim() || 'system';
  const publishConverted = options.publishConverted === true;
  const conn = await connectDB();
  if (!conn) {
    throw new Error('Database connection not available');
  }

  const existing = await Page.findOne({ slug });
  if (!existing) {
    return {
      page: null,
      converted: false,
      snapshotStored: false,
      snapshotId: null,
      fromType: null,
      toBlockCount: 0,
      publishedUpdated: false,
      legacyTemplateTypes: []
    };
  }

  const typedExisting = existing as unknown as PageDoc;
  const sourceData = resolveDraftData(typedExisting);
  const legacyTemplateTypes = listLegacyPageComponents(sourceData);
  if (!legacyTemplateTypes.length) {
    return {
      page: existing.toObject() as PageDoc,
      converted: false,
      snapshotStored: false,
      snapshotId: null,
      fromType: null,
      toBlockCount: isPuckData(sourceData) ? sourceData.content.length : 0,
      publishedUpdated: false,
      legacyTemplateTypes
    };
  }

  assertNoMissingLegacyTemplateMappings(legacyTemplateTypes);
  const migrated = migrateLegacyTemplateNodes(sourceData);
  const fromType = resolveLegacySourceType(legacyTemplateTypes);
  if (!migrated?.changed) {
    return {
      page: existing.toObject() as PageDoc,
      converted: false,
      snapshotStored: false,
      snapshotId: null,
      fromType,
      toBlockCount: isPuckData(sourceData) ? sourceData.content.length : 0,
      publishedUpdated: false,
      legacyTemplateTypes
    };
  }

  const snapshot = createLegacySnapshotEntry({
    userId: normalizedUserId,
    draftPayload: existing.draftData,
    publishedPayload: existing.publishedData ?? existing.data,
    fromType
  });
  const now = new Date();
  const historyEntry: PageHistoryEntry = {
    action: 'legacy-template-conversion',
    createdAt: now,
    snapshot: sourceData,
    meta: { legacyTemplateTypes, snapshotId: snapshot.id }
  };
  const currentHistory = appendHistoryEntry((existing as { history?: unknown }).history, historyEntry);
  (existing as { history?: unknown }).history = currentHistory;

  const currentSnapshots = appendLegacySnapshot(
    (existing as { legacySnapshots?: unknown }).legacySnapshots,
    snapshot
  );
  (existing as { legacySnapshots?: unknown }).legacySnapshots = currentSnapshots;

  existing.draftData = migrated.data;
  existing.draftUpdatedAt = now;
  if (publishConverted) {
    existing.publishedData = migrated.data;
    existing.data = migrated.data;
    existing.publishedAt = now;
    existing.status = 'published';
  }
  await existing.save();

  const updated = (await Page.findOne({ slug }).lean()) as PageDoc | null;
  return {
    page: updated,
    converted: true,
    snapshotStored: true,
    snapshotId: snapshot.id,
    fromType,
    toBlockCount: migrated.data.content.length,
    publishedUpdated: publishConverted,
    legacyTemplateTypes: listLegacyPageComponents(resolveDraftData(updated))
  };
}

export async function rollbackLegacyPageTemplateConversion(
  slug: string
): Promise<PageLegacyRollbackResult> {
  const conn = await connectDB();
  if (!conn) {
    throw new Error('Database connection not available');
  }

  const existing = await Page.findOne({ slug });
  if (!existing) {
    return { page: null, restored: false, snapshotId: null };
  }

  const currentSnapshots = Array.isArray((existing as { legacySnapshots?: unknown }).legacySnapshots)
    ? ((existing as { legacySnapshots?: unknown }).legacySnapshots as LegacySnapshotEntry[])
    : [];
  const latestSnapshot = currentSnapshots.at(-1);
  if (!latestSnapshot) {
    return { page: existing.toObject() as PageDoc, restored: false, snapshotId: null };
  }

  (existing as { legacySnapshots?: unknown }).legacySnapshots = currentSnapshots.slice(0, -1);
  existing.draftData = latestSnapshot.draftPayload;
  existing.publishedData = latestSnapshot.publishedPayload;
  existing.data = latestSnapshot.publishedPayload;
  existing.draftUpdatedAt = new Date();
  if (latestSnapshot.publishedPayload) {
    existing.status = 'published';
    existing.publishedAt = new Date();
  } else {
    existing.status = 'draft';
  }
  await existing.save();

  const updated = (await Page.findOne({ slug }).lean()) as PageDoc | null;
  return {
    page: updated,
    restored: true,
    snapshotId: latestSnapshot.id
  };
}
