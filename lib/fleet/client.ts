import { assertServerOnly } from '@/lib/_server/guard';
import { dashboardViewSchema, type DashboardView } from '@/lib/fleet/schema';

assertServerOnly('lib/fleet/client.ts');

const DEFAULT_ENDPOINT = 'http://127.0.0.1:4173/admin/fleet/api/status';
const EXPECTED_PATH = '/admin/fleet/api/status';
const DEFAULT_TIMEOUT_MS = 8_000;
export const MAX_FLEET_RESPONSE_BYTES = 2 * 1024 * 1024;

export type FleetStatusErrorCode =
  | 'configuration'
  | 'unavailable'
  | 'upstream-response'
  | 'content-type'
  | 'response-too-large'
  | 'invalid-json'
  | 'invalid-contract';

export class FleetStatusError extends Error {
  constructor(readonly code: FleetStatusErrorCode) {
    super(code);
    this.name = 'FleetStatusError';
  }
}

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

type FleetClientOptions = {
  endpoint?: string;
  fetchImpl?: FetchLike;
  timeoutMs?: number;
};

export function resolveFleetStatusEndpoint(value = process.env.VD_FLEET_STATUS_URL): string {
  let url: URL;
  try {
    url = new URL(value?.trim() || DEFAULT_ENDPOINT);
  } catch {
    throw new FleetStatusError('configuration');
  }

  if (
    url.protocol !== 'http:' ||
    url.hostname !== '127.0.0.1' ||
    !url.port ||
    url.pathname !== EXPECTED_PATH ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new FleetStatusError('configuration');
  }

  return url.toString();
}

async function readLimitedText(response: Response): Promise<string> {
  const declaredLength = response.headers.get('content-length');
  if (declaredLength !== null) {
    if (!/^\d+$/.test(declaredLength)) {
      throw new FleetStatusError('response-too-large');
    }
    const parsedLength = Number(declaredLength);
    if (!Number.isSafeInteger(parsedLength) || parsedLength > MAX_FLEET_RESPONSE_BYTES) {
      throw new FleetStatusError('response-too-large');
    }
  }

  if (!response.body) return '';

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_FLEET_RESPONSE_BYTES) {
        await reader.cancel();
        throw new FleetStatusError('response-too-large');
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return text;
  } finally {
    reader.releaseLock();
  }
}

export function parseFleetDashboardView(input: unknown): DashboardView {
  const parsed = dashboardViewSchema.safeParse(input);
  if (!parsed.success) {
    throw new FleetStatusError('invalid-contract');
  }
  return parsed.data;
}

export async function fetchFleetDashboardView(
  options: FleetClientOptions = {}
): Promise<DashboardView> {
  const endpoint = resolveFleetStatusEndpoint(options.endpoint);
  const fetchImpl = options.fetchImpl ?? fetch;
  const startedAt = performance.now();
  let outcome: FleetStatusErrorCode | 'ok' = 'ok';

  try {
    let response: Response;
    try {
      response = await fetchImpl(endpoint, {
        cache: 'no-store',
        credentials: 'omit',
        redirect: 'error',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS)
      });
    } catch {
      throw new FleetStatusError('unavailable');
    }

    if (!response.ok) {
      throw new FleetStatusError('upstream-response');
    }

    const contentType = response.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase();
    if (contentType !== 'application/json') {
      throw new FleetStatusError('content-type');
    }

    const body = await readLimitedText(response);
    let decoded: unknown;
    try {
      decoded = JSON.parse(body);
    } catch {
      throw new FleetStatusError('invalid-json');
    }

    return parseFleetDashboardView(decoded);
  } catch (error) {
    const safeError = error instanceof FleetStatusError ? error : new FleetStatusError('unavailable');
    outcome = safeError.code;
    throw safeError;
  } finally {
    console.info('fleet.dashboard.fetch', {
      durationMs: Math.round(performance.now() - startedAt),
      outcome
    });
  }
}
