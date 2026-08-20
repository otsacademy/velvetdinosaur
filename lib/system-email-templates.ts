import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/system-email-templates.ts');

import { connectDB } from '@/lib/db';
import { resolveDefaultAppUrl, resolveLogoUrl, resolveSiteName } from '@/lib/email-branding';
import {
  getSystemEmailTemplateDefinition,
  TEMPLATE_ORDER,
  type SystemEmailTemplateEditorState,
  type SystemEmailTemplateKey
} from '@/lib/system-email-template-definitions';
import { buildDefaultSystemEmailTemplateContent } from '@/lib/system-email-template-defaults';
import { ContactSettings } from '@/models/ContactSettings';

type TemplateStoredEntry = {
  html?: unknown;
  text?: unknown;
  updatedAt?: unknown;
};

type ContactSettingsDoc = {
  emailTemplates?: Record<string, TemplateStoredEntry> | Map<string, TemplateStoredEntry>;
  contactEmailHtml?: unknown;
  contactEmailText?: unknown;
  updatedAt?: unknown;
};

function buildPreviewUrl(baseUrl: string, path: string) {
  if (!baseUrl) return path;
  return `${baseUrl}${path}`;
}

function resolveEditorSampleValues(
  values: Record<string, string>,
  options: { siteName: string; appUrl: string; logoUrl: string }
) {
  const resolvedAppUrl = options.appUrl || '/';
  const previewInviteUrl = buildPreviewUrl(options.appUrl, '/sign-up?invite=sample-preview-token');
  const previewVerificationUrl = buildPreviewUrl(
    options.appUrl,
    '/verify-email?token=sample-verification-token'
  );
  const previewResetUrl = buildPreviewUrl(options.appUrl, '/reset-password?token=sample-reset-token');
  const previewReviewUrl = buildPreviewUrl(options.appUrl, '/review/preview-token');

  const output: Record<string, string> = {};
  for (const [token, value] of Object.entries(values)) {
    let nextValue = value.replaceAll('ASAP', options.siteName);
    if (options.appUrl) {
      nextValue = nextValue.replaceAll('https://example.org', options.appUrl);
    } else {
      nextValue = nextValue.replaceAll('https://example.org', '');
    }
    output[token] = nextValue;
  }

  output['{{siteName}}'] = options.siteName;
  output['{{appName}}'] = options.siteName;
  output['{{appUrl}}'] = resolvedAppUrl;
  output['{{logoUrl}}'] = options.logoUrl;
  output['{{inviteUrl}}'] = previewInviteUrl;
  output['{{verificationLink}}'] = previewVerificationUrl;
  output['{{resetLink}}'] = previewResetUrl;
  output['{{reviewLink}}'] = previewReviewUrl;

  return output;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toIsoStringOrNull(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  return null;
}

function parseEmailTemplatesMap(raw: ContactSettingsDoc['emailTemplates']) {
  if (!raw) return {} as Record<string, TemplateStoredEntry>;
  if (raw instanceof Map) {
    return Object.fromEntries(raw.entries());
  }
  if (typeof raw === 'object') {
    return raw as Record<string, TemplateStoredEntry>;
  }
  return {} as Record<string, TemplateStoredEntry>;
}

function readTemplateFromDoc(doc: ContactSettingsDoc | null, key: SystemEmailTemplateKey) {
  if (!doc) return null;

  const map = parseEmailTemplatesMap(doc.emailTemplates);
  const entry = map[key];
  let html = typeof entry?.html === 'string' ? entry.html : null;
  let text = typeof entry?.text === 'string' ? entry.text : null;
  let updatedAt = toIsoStringOrNull(entry?.updatedAt);

  if (key === 'contact-enquiry') {
    if (!html && typeof doc.contactEmailHtml === 'string') html = doc.contactEmailHtml;
    if (!text && typeof doc.contactEmailText === 'string') text = doc.contactEmailText;
    if (!updatedAt) updatedAt = toIsoStringOrNull(doc.updatedAt);
  }

  if (!html || !text) return null;
  return { html, text, updatedAt };
}

export function findMissingRequiredTokens(
  html: string,
  text: string,
  requiredTokens: string[]
): { htmlMissing: string[]; textMissing: string[] } {
  const htmlMissing = requiredTokens.filter((token) => !html.includes(token));
  const textMissing = requiredTokens.filter((token) => !text.includes(token));
  return { htmlMissing, textMissing };
}

export function findUnresolvedRequiredTokens(html: string, text: string, requiredTokens: string[]) {
  return requiredTokens.filter((token) => !html.includes(token) && !text.includes(token));
}

export function applyTemplateValues(
  template: string,
  values: Record<string, string | null | undefined>,
  options?: { html?: boolean }
) {
  let output = template;
  const html = Boolean(options?.html);
  for (const [token, value] of Object.entries(values)) {
    const raw = String(value ?? '').trim();
    const formatted = html ? escapeHtml(raw).replace(/\n/g, '<br />') : raw;
    output = output.replaceAll(token, formatted);
  }
  return output;
}

export async function renderTemplateWithStoredOverrides(input: {
  key: SystemEmailTemplateKey;
  values: Record<string, string | null | undefined>;
  fallbackHtml: string;
  fallbackText: string;
}) {
  try {
    await connectDB();
    const doc = (await ContactSettings.findOne({}).lean()) as ContactSettingsDoc | null;
    const stored = readTemplateFromDoc(doc, input.key);
    if (!stored) {
      return { html: input.fallbackHtml, text: input.fallbackText };
    }

    return {
      html: applyTemplateValues(stored.html, input.values, { html: true }),
      text: applyTemplateValues(stored.text, input.values, { html: false })
    };
  } catch {
    return { html: input.fallbackHtml, text: input.fallbackText };
  }
}

export async function getSystemEmailTemplateEditorState() {
  await connectDB();
  const doc = (await ContactSettings.findOne({}).lean()) as ContactSettingsDoc | null;
  const siteName = resolveSiteName();
  const appUrl = resolveDefaultAppUrl();
  const logoUrl = resolveLogoUrl(undefined, appUrl);

  const defaultsByKey = await Promise.all(
    TEMPLATE_ORDER.map(async (key) => {
      const defaults = await buildDefaultSystemEmailTemplateContent(key);
      return [key, defaults] as const;
    })
  );
  const defaultsMap = new Map<SystemEmailTemplateKey, { html: string; text: string }>(defaultsByKey);

  return TEMPLATE_ORDER.map((key) => {
    const definition = getSystemEmailTemplateDefinition(key);
    const sampleValues = resolveEditorSampleValues(definition.sampleValues, {
      siteName,
      appUrl,
      logoUrl
    });
    const defaults = defaultsMap.get(key);
    const stored = readTemplateFromDoc(doc, key);
    const defaultHtml = defaults?.html || '';
    const defaultText = defaults?.text || '';

    return {
      ...definition,
      sampleValues,
      initialHtml: stored?.html || defaultHtml,
      initialText: stored?.text || defaultText,
      defaultHtml,
      defaultText,
      updatedAt: stored?.updatedAt || null
    } satisfies SystemEmailTemplateEditorState;
  });
}

export async function saveSystemEmailTemplate(input: {
  key: SystemEmailTemplateKey;
  html: string;
  text: string;
}) {
  await connectDB();
  const now = new Date();

  const update: Record<string, unknown> = {
    [`emailTemplates.${input.key}.html`]: input.html,
    [`emailTemplates.${input.key}.text`]: input.text,
    [`emailTemplates.${input.key}.updatedAt`]: now
  };

  if (input.key === 'contact-enquiry') {
    update.contactEmailHtml = input.html;
    update.contactEmailText = input.text;
  }

  await ContactSettings.findOneAndUpdate({}, { $set: update }, { upsert: true, new: true });
  return { updatedAt: now.toISOString() };
}
