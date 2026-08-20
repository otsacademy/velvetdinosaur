import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/support/forwarding.ts');

type ForwardTicketPayload = {
  ticketId: string;
  ticketRef: string;
  organization: string;
  subject: string;
  category: string;
  module: string;
  priority: string;
  requestedDate: string | null;
  pageUrl: string;
  descriptionText: string;
  requester: {
    id: string;
    email: string;
    name: string;
  };
  source: {
    siteSlug: string;
    siteOrigin: string;
    portalUrl: string;
  };
};

type ForwardResult = {
  ok: boolean;
  endpoint: string;
  status: number;
  error: string;
};

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function toOrigin(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return '';
  }
}

function resolveForwardBase() {
  return clean(process.env.VD_SUPPORT_FORWARD_API_BASE) || 'https://designer.velvetdinosaur.com';
}

function resolveForwardCandidates() {
  const configured = clean(process.env.VD_SUPPORT_FORWARD_API_PATHS);
  if (configured) {
    return configured
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return ['/api/support/ingest'];
}

function joinUrl(base: string, path: string) {
  const normalizedBase = base.replace(/\/+$/, '');
  const normalizedPath = path.replace(/^\/+/, '');
  return `${normalizedBase}/${normalizedPath}`;
}

async function postToEndpoint(url: string, apiKey: string, payload: ForwardTicketPayload): Promise<ForwardResult> {
  if (!isHttpsUrl(url)) {
    return {
      ok: false,
      endpoint: url,
      status: 0,
      error: 'Forward endpoint must use HTTPS'
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        authorization: apiKey ? `Bearer ${apiKey}` : '',
        'x-api-key': apiKey,
        'x-vd-support-forward-key': apiKey
      },
      body: JSON.stringify({
        source: 'vd-child-site',
        ticket: payload
      })
    });
    if (response.ok) {
      return { ok: true, endpoint: url, status: response.status, error: '' };
    }
    const bodyText = await response.text().catch(() => '');
    return {
      ok: false,
      endpoint: url,
      status: response.status,
      error: bodyText || `HTTP ${response.status}`
    };
  } catch (error) {
    return {
      ok: false,
      endpoint: url,
      status: 0,
      error: error instanceof Error ? error.message : 'request-failed'
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function forwardSupportTicketToDesigner(input: Omit<ForwardTicketPayload, 'source'> & { source?: Partial<ForwardTicketPayload['source']> }) {
  const base = resolveForwardBase();
  const apiKey = clean(process.env.VD_SUPPORT_FORWARD_API_KEY);
  if (!base) {
    return {
      attempted: false,
      result: { ok: false, endpoint: '', status: 0, error: 'VD_SUPPORT_FORWARD_API_BASE is not configured' }
    };
  }
  if (!isHttpsUrl(base)) {
    return {
      attempted: false,
      result: { ok: false, endpoint: base, status: 0, error: 'VD_SUPPORT_FORWARD_API_BASE must use HTTPS' }
    };
  }

  const fallbackOrigin =
    toOrigin(clean(process.env.NEXT_PUBLIC_SITE_URL)) ||
    toOrigin(clean(process.env.VD_SITE_URL)) ||
    toOrigin(clean(process.env.NEXT_PUBLIC_BASE_URL)) ||
    toOrigin(clean(process.env.PUBLIC_BASE_URL)) ||
    '';

  const siteOrigin = clean(input.source?.siteOrigin) || fallbackOrigin;
  const portalUrl = clean(input.source?.portalUrl) || (siteOrigin ? `${siteOrigin.replace(/\/+$/, '')}/account/support` : '');

  if (!isHttpsUrl(siteOrigin)) {
    return {
      attempted: false,
      result: { ok: false, endpoint: '', status: 0, error: 'Forward source.siteOrigin must use HTTPS' }
    };
  }
  if (!isHttpsUrl(portalUrl)) {
    return {
      attempted: false,
      result: { ok: false, endpoint: '', status: 0, error: 'Forward source.portalUrl must use HTTPS' }
    };
  }

  const payload: ForwardTicketPayload = {
    ...input,
    source: {
      siteSlug: clean(input.source?.siteSlug) || clean(process.env.VD_SITE_SLUG) || 'unknown-site',
      siteOrigin,
      portalUrl
    }
  };

  let last: ForwardResult = { ok: false, endpoint: '', status: 0, error: 'not-attempted' };
  for (const candidate of resolveForwardCandidates()) {
    const target = joinUrl(base, candidate);
    last = await postToEndpoint(target, apiKey, payload);
    if (last.ok) {
      return { attempted: true, result: last };
    }
  }

  return {
    attempted: true,
    result: last
  };
}
