import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/support/external-snapshots.ts');

import { connectDB } from '@/lib/db';
import { SupportExternalSnapshot } from '@/models/SupportExternalSnapshot';
import {
  fetchSupportDevelopmentHoursFromExternal,
  normalizeDevelopmentHoursPayload,
  type SupportDevelopmentHoursResponse
} from '@/lib/support/external-schedule';
import {
  fetchSupportSystemStatusFromExternal,
  normalizeSystemStatusPayload,
  type SupportSystemStatusResponse
} from '@/lib/support/external-status';

type SnapshotType = 'system_status' | 'development_hours';

type SnapshotDoc = {
  _id?: unknown;
  snapshotType?: unknown;
  source?: unknown;
  payload?: unknown;
  fetchedAt?: unknown;
  createdAt?: unknown;
};

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function toIsoOrNull(value: unknown) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function saveSupportExternalSnapshot(input: {
  snapshotType: SnapshotType;
  source: string;
  payload: unknown;
  fetchedAt?: string | Date | null;
}) {
  await connectDB();
  const fetchedAt = input.fetchedAt ? new Date(input.fetchedAt) : new Date();
  const safeFetchedAt = Number.isNaN(fetchedAt.getTime()) ? new Date() : fetchedAt;

  return SupportExternalSnapshot.create({
    snapshotType: input.snapshotType,
    source: clean(input.source),
    payload: input.payload ?? {},
    fetchedAt: safeFetchedAt
  });
}

export async function getLatestSupportExternalSnapshot(snapshotType: SnapshotType) {
  await connectDB();
  const latest = (await SupportExternalSnapshot.findOne({ snapshotType })
    .sort({ fetchedAt: -1, createdAt: -1, _id: -1 })
    .lean()) as SnapshotDoc | null;

  if (!latest) return null;
  return {
    id: String(latest._id || ''),
    snapshotType,
    source: clean(latest.source),
    payload: latest.payload,
    fetchedAt: toIsoOrNull(latest.fetchedAt),
    createdAt: toIsoOrNull(latest.createdAt)
  };
}

export async function resolveSupportSystemStatus() {
  const live = await fetchSupportSystemStatusFromExternal();
  if (live.source === 'live') {
    await saveSupportExternalSnapshot({
      snapshotType: 'system_status',
      source: 'status-api',
      payload: {
        checks: live.checks,
        incidents: live.incidents,
        summary: live.summary,
        fetchedAt: live.fetchedAt
      },
      fetchedAt: live.fetchedAt
    });
    return live;
  }

  const snapshot = await getLatestSupportExternalSnapshot('system_status');
  if (!snapshot) return live;

  const normalized = normalizeSystemStatusPayload(snapshot.payload);
  return {
    ...live,
    source: 'snapshot' as const,
    fetchedAt: snapshot.fetchedAt || normalized.fetchedAt,
    checks: normalized.checks,
    incidents: normalized.incidents,
    summary: normalized.summary,
    raw: snapshot.payload,
    error: live.error
  } satisfies SupportSystemStatusResponse;
}

export async function resolveSupportDevelopmentHours() {
  const live = await fetchSupportDevelopmentHoursFromExternal();
  if (live.source === 'live') {
    await saveSupportExternalSnapshot({
      snapshotType: 'development_hours',
      source: 'schedule-api',
      payload: {
        totals: live.totals,
        items: live.items,
        fetchedAt: live.fetchedAt
      },
      fetchedAt: live.fetchedAt
    });
    return live;
  }

  const snapshot = await getLatestSupportExternalSnapshot('development_hours');
  if (!snapshot) return live;

  const normalized = normalizeDevelopmentHoursPayload(snapshot.payload);
  return {
    ...live,
    source: 'snapshot' as const,
    fetchedAt: snapshot.fetchedAt || normalized.fetchedAt,
    totals: normalized.totals,
    items: normalized.items,
    raw: snapshot.payload,
    error: live.error
  } satisfies SupportDevelopmentHoursResponse;
}

export async function syncSupportExternalSnapshots() {
  const [systemStatus, developmentHours] = await Promise.all([
    fetchSupportSystemStatusFromExternal(),
    fetchSupportDevelopmentHoursFromExternal()
  ]);

  let systemSaved = false;
  let developmentSaved = false;

  if (systemStatus.source === 'live') {
    await saveSupportExternalSnapshot({
      snapshotType: 'system_status',
      source: 'status-api',
      payload: {
        checks: systemStatus.checks,
        incidents: systemStatus.incidents,
        summary: systemStatus.summary,
        fetchedAt: systemStatus.fetchedAt
      },
      fetchedAt: systemStatus.fetchedAt
    });
    systemSaved = true;
  }

  if (developmentHours.source === 'live') {
    await saveSupportExternalSnapshot({
      snapshotType: 'development_hours',
      source: 'schedule-api',
      payload: {
        totals: developmentHours.totals,
        items: developmentHours.items,
        fetchedAt: developmentHours.fetchedAt
      },
      fetchedAt: developmentHours.fetchedAt
    });
    developmentSaved = true;
  }

  return {
    systemStatus: {
      source: systemStatus.source,
      fetchedAt: systemStatus.fetchedAt,
      saved: systemSaved,
      error: systemStatus.error || ''
    },
    developmentHours: {
      source: developmentHours.source,
      fetchedAt: developmentHours.fetchedAt,
      saved: developmentSaved,
      error: developmentHours.error || ''
    }
  };
}

export async function pruneSupportExternalSnapshots(now = new Date()) {
  await connectDB();
  const retentionDays = Math.max(1, Number(process.env.VD_SUPPORT_SNAPSHOT_RETENTION_DAYS || 90));
  const cutoff = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
  const result = await SupportExternalSnapshot.deleteMany({ fetchedAt: { $lt: cutoff } });
  return {
    retentionDays,
    cutoff: cutoff.toISOString(),
    deleted: Number(result.deletedCount || 0)
  };
}
