import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/support/external-status.ts');

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

export type SupportSystemStatusResponse = {
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
  raw?: unknown;
};

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function asObject(value: unknown) {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function toIsoOrNull(value: unknown) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeStatus(value: unknown): SupportSystemCheck['status'] {
  const raw = clean(value).toLowerCase();
  if (!raw) return 'unknown';
  if (['operational', 'ok', 'healthy', 'up', 'green'].includes(raw)) return 'operational';
  if (['degraded', 'warning', 'warn', 'partial', 'yellow'].includes(raw)) return 'degraded';
  if (['outage', 'down', 'critical', 'red', 'incident'].includes(raw)) return 'outage';
  return 'unknown';
}

function joinUrl(base: string, path: string) {
  const normalizedBase = base.replace(/\/+$/, '');
  const normalizedPath = path.replace(/^\/+/, '');
  if (!normalizedPath) return normalizedBase;
  return `${normalizedBase}/${normalizedPath}`;
}

export function normalizeSystemStatusPayload(raw: unknown) {
  const root = asObject(raw);
  const checksRaw = [root.checks, root.services, root.statuses, root.components].find(Array.isArray) as unknown[] | undefined;
  const incidentsRaw = [root.incidents, root.alerts, root.outages].find(Array.isArray) as unknown[] | undefined;

  const checks: SupportSystemCheck[] = (checksRaw || [])
    .map((entry, index) => {
      const obj = asObject(entry);
      const label = clean(obj.label) || clean(obj.name) || clean(obj.service) || `Service ${index + 1}`;
      const key = clean(obj.key) || clean(obj.id) || label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return {
        key,
        label,
        status: normalizeStatus(obj.status || obj.state || obj.health),
        detail: clean(obj.detail) || clean(obj.message) || clean(obj.description),
        updatedAt: toIsoOrNull(obj.updatedAt || obj.lastUpdatedAt || obj.timestamp)
      };
    })
    .filter((entry) => entry.key || entry.label);

  const incidents: SupportSystemIncident[] = (incidentsRaw || [])
    .map((entry, index) => {
      const obj = asObject(entry);
      return {
        id: clean(obj.id) || `incident-${index + 1}`,
        title: clean(obj.title) || clean(obj.name) || 'Incident',
        status: clean(obj.status) || clean(obj.state) || 'open',
        detail: clean(obj.detail) || clean(obj.message) || clean(obj.description),
        startedAt: toIsoOrNull(obj.startedAt || obj.createdAt || obj.timestamp),
        resolvedAt: toIsoOrNull(obj.resolvedAt || obj.endedAt)
      };
    })
    .filter((entry) => entry.id);

  const summary = {
    totalChecks: checks.length,
    operational: checks.filter((entry) => entry.status === 'operational').length,
    degraded: checks.filter((entry) => entry.status === 'degraded').length,
    outage: checks.filter((entry) => entry.status === 'outage').length,
    unknown: checks.filter((entry) => entry.status === 'unknown').length,
    incidents: incidents.length
  };

  return {
    checks,
    incidents,
    summary,
    fetchedAt: toIsoOrNull(root.fetchedAt || root.updatedAt || root.generatedAt || new Date())
  };
}

async function requestWithCandidates(base: string, apiKey: string, timeoutMs: number, candidates: string[]) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let lastError = '';

  try {
    for (const candidate of candidates) {
      const target = joinUrl(base, candidate);
      try {
        const response = await fetch(target, {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
          headers: {
            accept: 'application/json',
            authorization: apiKey ? `Bearer ${apiKey}` : '',
            'x-api-key': apiKey
          }
        });

        if (!response.ok) {
          lastError = `HTTP ${response.status} (${candidate || '/'})`;
          continue;
        }

        const payload = await response.json().catch(() => null);
        if (!payload || typeof payload !== 'object') {
          lastError = `Invalid JSON payload (${candidate || '/'})`;
          continue;
        }

        return { payload, source: target };
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown network error';
      }
    }
  } finally {
    clearTimeout(timeout);
  }

  return { payload: null, source: '', error: lastError || 'No successful endpoint response' };
}

export async function fetchSupportSystemStatusFromExternal(options?: {
  timeoutMs?: number;
}): Promise<SupportSystemStatusResponse> {
  const base = clean(process.env.VD_SUPPORT_STATUS_API_BASE);
  const apiKey = clean(process.env.VD_SUPPORT_STATUS_API_KEY);

  if (!base) {
    return {
      configured: false,
      source: 'unavailable',
      fetchedAt: null,
      summary: { totalChecks: 0, operational: 0, degraded: 0, outage: 0, unknown: 0, incidents: 0 },
      checks: [],
      incidents: [],
      error: 'VD_SUPPORT_STATUS_API_BASE is not configured'
    };
  }

  const fetched = await requestWithCandidates(base, apiKey, Math.max(800, Number(options?.timeoutMs || 6000)), [
    'status',
    'api/status',
    'v1/status',
    ''
  ]);

  if (!fetched.payload) {
    return {
      configured: true,
      source: 'unavailable',
      fetchedAt: null,
      summary: { totalChecks: 0, operational: 0, degraded: 0, outage: 0, unknown: 0, incidents: 0 },
      checks: [],
      incidents: [],
      error: fetched.error || 'Unable to load system status'
    };
  }

  const normalized = normalizeSystemStatusPayload(fetched.payload);
  return {
    configured: true,
    source: 'live',
    fetchedAt: normalized.fetchedAt,
    summary: normalized.summary,
    checks: normalized.checks,
    incidents: normalized.incidents,
    raw: fetched.payload
  };
}
