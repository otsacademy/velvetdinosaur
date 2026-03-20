import { assertServerOnly } from '@/lib/_server/guard';

assertServerOnly('lib/ai/rewrite-provider.server.ts');

export type RewriteMode =
  | 'fix'
  | 'shorten'
  | 'expand'
  | 'tone:professional'
  | 'tone:friendly'
  | 'tone:neutral';

export type RewriteProviderConfig = {
  provider: 'openai';
  envVar: string;
  apiKey: string;
  model: string;
};

export type RewriteTextInput = {
  input: string;
  mode: RewriteMode;
};

export type RewriteTextOptions = {
  timeoutMs?: number;
};

export type RewriteTextResult = {
  output: string;
  model?: string;
};

export class ProviderNotConfigured extends Error {
  public readonly code = 'PROVIDER_NOT_CONFIGURED';
  public readonly providerEnvVar: string;

  constructor(providerEnvVar: string) {
    super(`Rewrite provider is not configured. Set ${providerEnvVar} to enable writing magic.`);
    this.name = 'ProviderNotConfigured';
    this.providerEnvVar = providerEnvVar;
  }
}

export class ProviderNotConfiguredError extends ProviderNotConfigured {
  constructor(providerEnvVar: string) {
    super(providerEnvVar);
    this.name = 'ProviderNotConfiguredError';
  }
}

const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';
const FALLBACK_REWRITE_TIMEOUT_MS = 8000;
const MIN_REWRITE_TIMEOUT_MS = 6000;
const MAX_REWRITE_TIMEOUT_MS = 10000;

function resolveTimeoutMs(value?: number) {
  const envTimeout = Number(process.env.REWRITE_TIMEOUT_MS);
  const raw = Number(value ?? envTimeout);
  if (Number.isFinite(raw)) {
    return Math.max(MIN_REWRITE_TIMEOUT_MS, Math.min(Math.round(raw), MAX_REWRITE_TIMEOUT_MS));
  }
  return FALLBACK_REWRITE_TIMEOUT_MS;
}

function readOpenAiConfig(): RewriteProviderConfig | null {
  const apiKey = typeof process.env.OPENAI_API_KEY === 'string' ? process.env.OPENAI_API_KEY.trim() : '';
  if (!apiKey) {
    return null;
  }

  const model = process.env.REWRITE_MODEL || process.env.OPENAI_REWRITE_MODEL || DEFAULT_OPENAI_MODEL;
  return {
    provider: 'openai',
    envVar: 'OPENAI_API_KEY',
    apiKey,
    model: model || DEFAULT_OPENAI_MODEL,
  };
}

export function getRewriteProviderInfo(): { envVar: string; configured: boolean } {
  const config = readOpenAiConfig();
  if (config) {
    return { envVar: config.envVar, configured: true };
  }
  return { envVar: 'OPENAI_API_KEY', configured: false };
}

function formatModePrompt(mode: RewriteMode) {
  switch (mode) {
    case 'fix':
      return 'Fix grammar, punctuation, and spelling. Keep meaning and facts unchanged.';
    case 'shorten':
      return 'Shorten the text while preserving meaning and key details.';
    case 'expand':
      return 'Expand the text with clearer explanations while preserving facts.';
    case 'tone:professional':
      return 'Rewrite in a professional tone: precise, concise, polished, and business-like.';
    case 'tone:friendly':
      return 'Rewrite in a friendly tone: warm, open, and approachable.';
    case 'tone:neutral':
      return 'Rewrite in a neutral tone: factual, balanced, and even.';
    default:
      return 'Edit the text carefully and improve readability.';
  }
}

export async function rewriteText(
  input: RewriteTextInput,
  options: RewriteTextOptions = {},
): Promise<RewriteTextResult> {
  const provider = readOpenAiConfig();
  if (!provider) {
    throw new ProviderNotConfiguredError('OPENAI_API_KEY');
  }

  const normalizedInput = typeof input.input === 'string' ? input.input.trim() : '';
  if (!normalizedInput) {
    throw new Error('Rewrite request has no input text');
  }

  const signal = AbortSignal.timeout(resolveTimeoutMs(options.timeoutMs));
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: provider.model,
      temperature: 0.2,
      max_tokens: 1200,
      messages: [
        {
          role: 'system',
          content:
            'You are a plain-text news-writing assistant. Rewrite the provided text directly and never return markdown.',
        },
        {
          role: 'user',
          content:
            `Rewrite the input using this mode: ${formatModePrompt(input.mode)}\n\n` +
            '- Preserve the original language exactly (do not translate).\n' +
            '- Keep factual meaning unchanged unless the mode requests shortening/expanding.\n' +
            "- Return plain text only; do not add headings unless the input already has heading-like lines.\n" +
            '- Do not use markdown bullets, code fences, tables, or list markers.\n' +
            '- Preserve existing paragraph line breaks when possible.\n' +
            `- Input:\n${normalizedInput}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    const suffix = detail ? ` (${detail.slice(0, 200)})` : '';
    throw new Error(`Rewrite provider request failed: ${response.status}${suffix}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: unknown;
      };
    }>;
    model?: string;
  };
  const raw = payload?.choices?.[0]?.message?.content;
  if (typeof raw !== 'string') {
    throw new Error('Rewrite provider returned an invalid response');
  }

  return {
    output: raw,
    model: payload.model || provider.model,
  };
}
