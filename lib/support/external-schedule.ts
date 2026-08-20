import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/support/external-schedule.ts');

export type SupportDevelopmentHourItem = {
  module: string;
  planned: number;
  used: number;
  remaining: number;
  updatedAt: string | null;
};

export type SupportDevelopmentHoursResponse = {
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

function asNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function joinUrl(base: string, path: string) {
  const normalizedBase = base.replace(/\/+$/, '');
  const normalizedPath = path.replace(/^\/+/, '');
  if (!normalizedPath) return normalizedBase;
  return `${normalizedBase}/${normalizedPath}`;
}

export function normalizeDevelopmentHoursPayload(raw: unknown) {
  const root = asObject(raw);
  const itemsRaw = [root.items, root.modules, root.records, root.entries].find(Array.isArray) as unknown[] | undefined;

  const items: SupportDevelopmentHourItem[] = (itemsRaw || [])
    .map((entry, index) => {
      const obj = asObject(entry);
      const moduleName = clean(obj.module) || clean(obj.name) || clean(obj.label) || `Module ${index + 1}`;
      const planned = asNumber(obj.planned ?? obj.allocated ?? obj.total ?? obj.budgetHours);
      const used = asNumber(obj.used ?? obj.spent ?? obj.consumed ?? obj.loggedHours);
      const remaining = asNumber(obj.remaining ?? obj.balance ?? planned - used);
      return {
        module: moduleName,
        planned,
        used,
        remaining,
        updatedAt: toIsoOrNull(obj.updatedAt || obj.lastUpdatedAt || obj.timestamp)
      };
    })
    .filter((entry) => entry.module);

  const totalsObject = asObject(root.totals);
  const totalPlanned = asNumber(totalsObject.planned || totalsObject.allocated) || items.reduce((sum, item) => sum + item.planned, 0);
  const totalUsed = asNumber(totalsObject.used || totalsObject.spent) || items.reduce((sum, item) => sum + item.used, 0);
  const totalRemaining =
    asNumber(totalsObject.remaining || totalsObject.balance) || items.reduce((sum, item) => sum + item.remaining, 0);

  return {
    totals: {
      planned: totalPlanned,
      used: totalUsed,
      remaining: totalRemaining,
      period: clean(totalsObject.period || root.period) || 'Current period'
    },
    items,
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

export async function fetchSupportDevelopmentHoursFromExternal(options?: {
  timeoutMs?: number;
}): Promise<SupportDevelopmentHoursResponse> {
  const base = clean(process.env.VD_SUPPORT_SCHEDULE_API_BASE);
  const apiKey = clean(process.env.VD_SUPPORT_SCHEDULE_API_KEY);

  if (!base) {
    return {
      configured: false,
      source: 'unavailable',
      fetchedAt: null,
      totals: { planned: 0, used: 0, remaining: 0, period: 'Current period' },
      items: [],
      error: 'VD_SUPPORT_SCHEDULE_API_BASE is not configured'
    };
  }

  const fetched = await requestWithCandidates(base, apiKey, Math.max(800, Number(options?.timeoutMs || 6000)), [
    'development-hours',
    'api/development-hours',
    'v1/development-hours',
    'hours',
    ''
  ]);

  if (!fetched.payload) {
    return {
      configured: true,
      source: 'unavailable',
      fetchedAt: null,
      totals: { planned: 0, used: 0, remaining: 0, period: 'Current period' },
      items: [],
      error: fetched.error || 'Unable to load development hours'
    };
  }

  const normalized = normalizeDevelopmentHoursPayload(fetched.payload);
  return {
    configured: true,
    source: 'live',
    fetchedAt: normalized.fetchedAt,
    totals: normalized.totals,
    items: normalized.items,
    raw: fetched.payload
  };
}
