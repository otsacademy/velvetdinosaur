import { assertServerOnly } from '@/lib/_server/guard'

assertServerOnly('lib/ai/seo-provider.server.ts')

export type SeoProviderConfig = {
  provider: 'openai'
  envVar: string
  apiKey: string
  model: string
}

export type SeoGenerationInput = {
  title: string
  body: string
}

export type SeoGenerationOptions = {
  timeoutMs?: number
}

export type SeoGenerationResult = {
  title: string
  description: string
  model: string
}

export class ProviderNotConfigured extends Error {
  public readonly code = 'PROVIDER_NOT_CONFIGURED'
  public readonly providerEnvVar: string

  constructor(providerEnvVar: string, provider?: string) {
    super(`${provider ?? 'SEO provider'} is not configured. Set ${providerEnvVar} to enable generation.`)
    this.name = 'ProviderNotConfigured'
    this.providerEnvVar = providerEnvVar
  }
}

export class ProviderNotConfiguredError extends ProviderNotConfigured {
  constructor(providerEnvVar: string) {
    super(providerEnvVar, 'SEO provider')
    this.name = 'ProviderNotConfiguredError'
  }
}

const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini'
const FALLBACK_SEO_TIMEOUT_MS = 5000

function resolveTimeoutMs(value?: number) {
  const envTimeout = Number(process.env.SEO_TIMEOUT_MS)
  const raw = Number(value ?? envTimeout)
  if (Number.isFinite(raw)) {
    return Math.max(1000, Math.min(Math.round(raw), 8000))
  }
  return FALLBACK_SEO_TIMEOUT_MS
}

function readOpenAiConfig(): SeoProviderConfig | null {
  const apiKey = typeof process.env.OPENAI_API_KEY === 'string' ? process.env.OPENAI_API_KEY.trim() : ''
  if (!apiKey) {
    return null
  }

  const model = process.env.SEO_MODEL || process.env.OPENAI_SEO_MODEL || DEFAULT_OPENAI_MODEL
  return {
    provider: 'openai',
    envVar: 'OPENAI_API_KEY',
    apiKey,
    model: model || DEFAULT_OPENAI_MODEL,
  }
}

function extractSeoJsonCandidate(text: string) {
  const fenced = text.match(/```(?:json)?\n([\s\S]*?)\n```/i)
  return (fenced?.[1] || text).trim()
}

export function getSeoProviderInfo(): { envVar: string; configured: boolean } {
  const config = readOpenAiConfig()
  if (config) {
    return { envVar: config.envVar, configured: true }
  }
  return { envVar: 'OPENAI_API_KEY', configured: false }
}

export async function generateSEOFromArticleText(
  input: SeoGenerationInput,
  options: SeoGenerationOptions = {},
): Promise<SeoGenerationResult> {
  const provider = readOpenAiConfig()
  if (!provider) {
    throw new ProviderNotConfiguredError('OPENAI_API_KEY')
  }

  const title = input.title.trim()
  const body = input.body.trim()
  if (!title && !body) {
    throw new Error('SEO generation requires article title or body text')
  }

  const signal = AbortSignal.timeout(resolveTimeoutMs(options.timeoutMs))
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: provider.model,
      temperature: 0.3,
      max_tokens: 220,
      messages: [
        {
          role: 'system',
          content:
            'You are a search-engine metadata specialist for news content. Return strict JSON only, no markdown, no quotes around field values.',
        },
        {
          role: 'user',
          content:
            'Generate SEO title and meta description for this article in plain JSON format: {"title":"...","description":"..."}\n' +
            'Rules:\n' +
            '- Title should be concise and useful for search snippets.\n' +
            '- Meta description should be concise, clear, and persuasive.\n' +
            '- Avoid markdown and sensitive guesses about personal characteristics.\n' +
            '- Prefer titleTag in 40-60 words range and description in 120-160 words (hard cap 70/170 chars).\n' +
            `- Article title: ${title || 'Untitled'}\n- Article text: ${body || 'No article body available.'}`,
        },
      ],
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    const suffix = detail ? ` (${detail.slice(0, 180)})` : ''
    throw new Error(`SEO provider request failed: ${response.status}${suffix}`)
  }

  const bodyPayload = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: unknown
      }
    }>
    model?: string
  }

  const raw = bodyPayload?.choices?.[0]?.message?.content
  if (typeof raw !== 'string') {
    throw new Error('SEO provider returned an invalid response')
  }

  const payloadText = extractSeoJsonCandidate(raw)
  let parsed: unknown = null
  try {
    parsed = JSON.parse(payloadText)
  } catch {
    parsed = null
  }

  let titleResult = typeof (parsed as { title?: unknown })?.title === 'string' ? ((parsed as { title?: unknown }).title as string) : ''
  let descriptionResult =
    typeof (parsed as { description?: unknown })?.description === 'string'
      ? ((parsed as { description?: unknown }).description as string)
      : ''

  if (!titleResult && !descriptionResult) {
    const titleMatch = raw.match(/\"?title\"?\s*:\s*\"([^\"]+)\"/i)
    const descriptionMatch = raw.match(/\"?description\"?\s*:\s*\"([^\"]+)\"/i)
    titleResult = titleMatch?.[1] || ''
    descriptionResult = descriptionMatch?.[1] || ''
  }

  return {
    title: String(titleResult || title || '').trim(),
    description: String(descriptionResult || '').trim(),
    model: bodyPayload.model || provider.model,
  }
}
