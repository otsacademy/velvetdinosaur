import {
  ProviderNotConfiguredError,
  rewriteText,
  type RewriteTextOptions,
} from '@/lib/ai/rewrite-provider.server';
import { getRewriteProviderInfo } from '@/lib/ai/rewrite-provider.server';

export const PLATE_MAGIC_MAX_INPUT_CHARS = 12000;
const OUTPUT_WHITESPACE_CLIP = 6_000;

export type RewriteTone = 'professional' | 'friendly' | 'neutral';
export type RewriteMode =
  | 'fix'
  | 'shorten'
  | 'expand'
  | 'tone:professional'
  | 'tone:friendly'
  | 'tone:neutral';

export type RewriteOrchestratorPayload = {
  input: string;
  mode: string;
  tone?: string;
};

export type RewriteValidationProblem = {
  code: string;
  message: string;
};

export type RewriteInputValidation = {
  ok: true;
  input: string;
} | {
  ok: false;
  error: RewriteValidationProblem;
};

export type RewriteEligibility = {
  ok: true;
  mode: RewriteMode;
  input: string;
} | {
  ok: false;
  error: RewriteValidationProblem;
};

export type RewriteResult = {
  output: string;
  model?: string;
};

export class RewriteValidationError extends Error {
  public readonly code = 'REWRITE_VALIDATION_ERROR';
  constructor(message: string) {
    super(message);
    this.name = 'RewriteValidationError';
  }
}

export class RewriteTimeoutError extends Error {
  public readonly code = 'REWRITE_TIMEOUT';
  constructor() {
    super('Rewrite request timed out');
    this.name = 'RewriteTimeoutError';
  }
}

function normalizeMode(mode: string) {
  return typeof mode === 'string' ? mode.trim().toLowerCase() : '';
}

function normalizeTone(value: string) {
  const tone = value.trim().toLowerCase();
  if (tone === 'professional' || tone === 'friendly' || tone === 'neutral') return tone as RewriteTone;
  return '';
}

export function getRewriteProviderConfig() {
  return getRewriteProviderInfo();
}

export function parseRewriteMode(mode: string, tone?: string): RewriteMode | null {
  const normalizedMode = normalizeMode(mode);
  if (normalizedMode === 'fix' || normalizedMode === 'shorten' || normalizedMode === 'expand') {
    return normalizedMode as RewriteMode;
  }

  if (normalizedMode.startsWith('tone:')) {
    const parsedTone = normalizeTone(normalizedMode.slice(5));
    if (!parsedTone) return null;
    return `tone:${parsedTone}` as RewriteMode;
  }

  if (normalizedMode === 'tone' && typeof tone === 'string') {
    const parsedTone = normalizeTone(tone);
    if (!parsedTone) return null;
    return `tone:${parsedTone}` as RewriteMode;
  }

  const parsedTone = normalizeTone(normalizedMode);
  if (parsedTone) {
    return `tone:${parsedTone}` as RewriteMode;
  }

  return null;
}

export function validateInput(input: string): RewriteInputValidation {
  const normalized = typeof input === 'string' ? input.replace(/\r\n/g, '\n').trim() : '';
  if (!normalized) {
    return { ok: false, error: { code: 'EMPTY_INPUT', message: 'No text selected for rewrite.' } };
  }
  if (normalized.length > PLATE_MAGIC_MAX_INPUT_CHARS) {
    return {
      ok: false,
      error: {
        code: 'INPUT_TOO_LONG',
        message: `Text is too long for rewriting. Maximum is ${PLATE_MAGIC_MAX_INPUT_CHARS} characters.`,
      },
    };
  }
  return { ok: true, input: normalized };
}

export function shouldRewrite(input: string, mode: string, tone?: string): RewriteEligibility {
  const resolvedMode = parseRewriteMode(mode, tone);
  if (!resolvedMode) {
    return {
      ok: false,
      error: {
        code: 'INVALID_MODE',
        message: 'Unsupported rewrite mode. Use fix, shorten, expand, or tone options.',
      },
    };
  }

  const validation = validateInput(input);
  if (!validation.ok) {
    return {
      ok: false,
      error: validation.error,
    };
  }

  return {
    ok: true,
    mode: resolvedMode,
    input: validation.input as string,
  };
}

export function postProcess(rawOutput: string) {
  if (typeof rawOutput !== 'string') {
    return '';
  }

  const withoutFence = rawOutput
    .replace(/```[a-zA-Z]*\n([\s\S]*?)\n```/g, '$1')
    .replace(/\u00A0/g, ' ');

  const outputLines = withoutFence
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.replace(/^\s*```/g, ''))
    .map((line) => line.replace(/^[ \t]*[*-+]\s+/g, ''))
    .map((line) => line.replace(/^[ \t]*#{1,6}\s+/g, ''))
    .map((line) => line.replace(/^[ \t]*>\s*/g, ''))
    .map((line) => line.replace(/[ \t]{2,}/g, ' '))
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n');

  return outputLines
    .replace(/\n{3,}/g, '\n\n')
    .slice(0, OUTPUT_WHITESPACE_CLIP)
    .trim();
}

export async function rewritePlateText(
  input: string,
  mode: string,
  tone?: string,
  options: RewriteTextOptions = {},
): Promise<RewriteResult> {
  const canRewrite = shouldRewrite(input, mode, tone);
  if (!canRewrite.ok) {
    throw new RewriteValidationError(canRewrite.error.message);
  }

  try {
    const providerResult = await rewriteText(
      {
        input: canRewrite.input,
        mode: canRewrite.mode,
      },
      options,
    );
    const output = postProcess(providerResult.output);
    if (!output) {
      throw new RewriteValidationError('Provider returned no rewrite output.');
    }

    return {
      output,
      model: providerResult.model,
    };
  } catch (error) {
    if (error instanceof ProviderNotConfiguredError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        throw new RewriteTimeoutError();
      }
      throw error;
    }

  throw new Error('Rewrite failed');
  }
}
