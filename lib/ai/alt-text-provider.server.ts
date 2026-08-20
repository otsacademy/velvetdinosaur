import { assertServerOnly } from '@/lib/_server/guard';

assertServerOnly('lib/ai/alt-text-provider.server.ts');

export type AltTextProviderConfig = {
  provider: 'openai';
  envVar: string;
  apiKey: string;
  model: string;
};

export type AltTextGenerationInput = {
  url: string;
  mime?: string | null;
  width?: number | null;
  height?: number | null;
};

export type AltTextGenerationOptions = {
  timeoutMs?: number;
};

export type AltTextGenerationResult = {
  alt: string;
  model: string;
};

export class ProviderNotConfigured extends Error {
  public readonly code = 'PROVIDER_NOT_CONFIGURED';
  public readonly providerEnvVar: string;

  constructor(providerEnvVar: string) {
    super(`Alt text provider is not configured. Set ${providerEnvVar} to enable generation.`);
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
const FALLBACK_ALT_TEXT_TIMEOUT_MS = 5000;

function resolveTimeoutMs(value?: number) {
  const envTimeout = Number(process.env.ALT_TEXT_TIMEOUT_MS);
  const raw = Number(value ?? envTimeout);
  if (Number.isFinite(raw)) {
    return Math.max(1000, Math.min(Math.round(raw), 5000));
  }
  return FALLBACK_ALT_TEXT_TIMEOUT_MS;
}

function readOpenAiConfig(): AltTextProviderConfig | null {
  const apiKey = typeof process.env.OPENAI_API_KEY === 'string' ? process.env.OPENAI_API_KEY.trim() : '';
  if (!apiKey) {
    return null;
  }

  const model = process.env.ALT_TEXT_MODEL || process.env.OPENAI_ALT_TEXT_MODEL || DEFAULT_OPENAI_MODEL;
  return {
    provider: 'openai',
    envVar: 'OPENAI_API_KEY',
    apiKey,
    model: model || DEFAULT_OPENAI_MODEL
  };
}

export function getAltTextProviderInfo(): { envVar: string; configured: boolean } {
  const config = readOpenAiConfig();
  if (config) {
    return { envVar: config.envVar, configured: true };
  }
  return { envVar: 'OPENAI_API_KEY', configured: false };
}

export async function generateAltTextFromImageUrl(
  input: AltTextGenerationInput,
  options: AltTextGenerationOptions = {}
): Promise<AltTextGenerationResult> {
  const provider = readOpenAiConfig();
  if (!provider) {
    throw new ProviderNotConfiguredError('OPENAI_API_KEY');
  }

  const timeoutMs = resolveTimeoutMs(options.timeoutMs);
  const signal = AbortSignal.timeout(timeoutMs);
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: provider.model,
      temperature: 0.3,
      max_tokens: 120,
      messages: [
        {
          role: 'system',
          content:
            'You are an accessibility-first alt text writer. Return only concise, non-sensitive image descriptions.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text:
                'Write a short alt text for this image for web accessibility.\n- Keep it concise and useful for someone who cannot see the image.\n- Prefer concrete, observable subjects and composition.\n- Avoid sensitive guesses about age, race, disability, gender identity, and other protected personal traits.\n- Avoid phrases like "Image of" or "Picture of".\n- Return only one plain sentence.'
            },
            {
              type: 'image_url',
              image_url: { url: input.url }
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    const statusMessage = detail ? ` (${detail.slice(0, 180)})` : '';
    throw new Error(`Alt text provider request failed: ${response.status}${statusMessage}`);
  }

  const body = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: unknown;
      };
    }>;
    model?: string;
  };
  const raw = body?.choices?.[0]?.message?.content;
  if (typeof raw !== 'string') {
    throw new Error('Alt text provider returned invalid response');
  }

  return {
    alt: raw,
    model: body.model || provider.model
  };
}
