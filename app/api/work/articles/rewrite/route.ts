import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';

import { requireWorkArticleWriteAccess } from '@/lib/work-article-access';
import {
  RewriteValidationError,
  RewriteTimeoutError,
  getRewriteProviderConfig,
  rewritePlateText,
} from '@/lib/editor/plate-magic.server';
import { ProviderNotConfiguredError } from '@/lib/ai/rewrite-provider.server';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store',
  Pragma: 'no-cache',
  Expires: '0',
};

const DEFAULT_TIMEOUT_MS = 8000;

type RequestPayload = {
  text?: unknown;
  mode?: unknown;
  tone?: unknown;
};

function normalizeMode(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeTone(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function GET(request: Request) {
  unstable_noStore();

  const access = await requireWorkArticleWriteAccess(request);
  if (!access.ok) {
    return access.response;
  }

  const provider = getRewriteProviderConfig();
  return NextResponse.json(provider, { headers: NO_STORE_HEADERS });
}

export async function POST(request: Request) {
  unstable_noStore();
  const access = await requireWorkArticleWriteAccess(request);
  if (!access.ok) {
    return access.response;
  }

  const payload = (await request.json().catch(() => null)) as RequestPayload | null;
  const text = normalizeMode(payload?.text);
  const mode = normalizeMode(payload?.mode);
  const tone = normalizeTone(payload?.tone);

  if (!text) {
    return NextResponse.json({ error: 'Invalid payload: text is required' }, { status: 400, headers: NO_STORE_HEADERS });
  }
  if (!mode) {
    return NextResponse.json(
      { error: 'Invalid payload: mode is required' },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const result = await rewritePlateText(text, mode, tone, {
      timeoutMs: DEFAULT_TIMEOUT_MS,
    });

    return NextResponse.json(
      { output: result.output, model: result.model },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    if (error instanceof RewriteValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400, headers: NO_STORE_HEADERS });
    }

    if (error instanceof ProviderNotConfiguredError) {
      return NextResponse.json(
        { error: `Provider not configured: ${error.providerEnvVar}` },
        { status: 503, headers: NO_STORE_HEADERS }
      );
    }

    if (error instanceof RewriteTimeoutError) {
      return NextResponse.json({ error: 'Rewrite request timed out' }, { status: 504, headers: NO_STORE_HEADERS });
    }

    const message = error instanceof Error ? error.message : 'Rewrite failed';
    return NextResponse.json({ error: message }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
