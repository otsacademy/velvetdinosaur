import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/theme.ts');

import { connectDB } from '@/lib/db';
import { Theme } from '@/models/Theme';
import { cacheLife, cacheTag } from 'next/cache';
import type { ThemeStatePayload } from 'tweakcn-ui';
import {
  readThemeCurrent,
  readThemeDefault,
  readThemeDraft,
  readThemeLastGood,
  writeThemeCurrent,
  writeThemeDefault,
  writeThemeDraft,
  writeThemeLastGood
} from '@/lib/theme-store';
import { validateTheme } from '@/lib/theme-validation';
import { normalizeThemePayloadToOklch } from '@/lib/theme-normalize';
import { DEFAULT_THEME_PAYLOAD } from '@/lib/theme-default';
import { themeTags } from '@/lib/cache-tags';

export type ThemePayload = ThemeStatePayload;

type ThemeDoc = {
  key: string;
  // Legacy fields
  payload?: ThemePayload;
  tokens?: ThemePayload;
  // New fields
  draft?: ThemePayload;
  published?: ThemePayload;
};

function extractPublishedPayload(doc: ThemeDoc | null): ThemePayload | null {
  return doc?.published ?? doc?.payload ?? doc?.tokens ?? null;
}

function extractDraftPayload(doc: ThemeDoc | null): ThemePayload | null {
  return doc?.draft ?? doc?.published ?? doc?.payload ?? doc?.tokens ?? null;
}

async function readDbPublishedTheme(): Promise<ThemePayload | null> {
  try {
    const conn = await connectDB();
    if (!conn) return null;
    const theme = (await Theme.findOne({ key: 'default' }).lean()) as ThemeDoc | null;
    return extractPublishedPayload(theme);
  } catch {
    return null;
  }
}

async function readDbDraftTheme(): Promise<ThemePayload | null> {
  try {
    const conn = await connectDB();
    if (!conn) return null;
    const theme = (await Theme.findOne({ key: 'default' }).lean()) as ThemeDoc | null;
    return extractDraftPayload(theme);
  } catch {
    return null;
  }
}

function pickValid(payload: unknown) {
  if (!payload) return null;
  const result = validateTheme(payload);
  return result.ok ? result.payload : null;
}

export async function getThemePayload(): Promise<ThemePayload | null> {
  'use cache';
  cacheLife('hours');
  cacheTag(themeTags.current);
  const current = pickValid(await readThemeCurrent());
  const lastGood = pickValid(await readThemeLastGood());
  const storedDefault = pickValid(await readThemeDefault());

  let dbPublished: ThemePayload | null = null;
  if (!current && !lastGood && !storedDefault) {
    dbPublished = pickValid(await readDbPublishedTheme());
  }

  const resolved = current ?? lastGood ?? dbPublished ?? storedDefault ?? DEFAULT_THEME_PAYLOAD;
  const defaultPayload = storedDefault ?? resolved;

  if (!storedDefault) {
    try {
      await writeThemeDefault(defaultPayload);
    } catch {
      // Ignore storage failures to keep rendering alive.
    }
  }

  if (!current) {
    try {
      await writeThemeCurrent(resolved);
      await writeThemeLastGood(resolved);
    } catch {
      // Ignore storage failures to keep rendering alive.
    }
  } else if (!lastGood) {
    try {
      await writeThemeLastGood(current);
    } catch {
      // Ignore storage failures to keep rendering alive.
    }
  }

  return resolved;
}

export async function saveThemePayload(payload: ThemePayload, note = 'manual update') {
  const normalized = normalizeThemePayloadToOklch(payload, { strict: true });
  const result = validateTheme(normalized);
  if (!result.ok) {
    throw new Error(result.errors.join('; ') || 'Invalid theme payload');
  }

  await writeThemeCurrent(result.payload);
  await writeThemeLastGood(result.payload);

  return { payload: result.payload, note };
}

export async function getThemeDraftPayload(): Promise<ThemePayload | null> {
  'use cache';
  cacheLife('minutes');
  cacheTag(themeTags.draft);
  cacheTag(themeTags.current);
  const draft = pickValid(await readThemeDraft());
  if (draft) return draft;

  const current = pickValid(await readThemeCurrent());
  if (current) return current;

  const dbDraft = pickValid(await readDbDraftTheme());
  if (dbDraft) return dbDraft;

  return pickValid(await readThemeDefault()) ?? DEFAULT_THEME_PAYLOAD;
}

export async function saveThemeDraftPayload(payload: ThemePayload, note = 'draft update') {
  const normalized = normalizeThemePayloadToOklch(payload, { strict: true });
  const result = validateTheme(normalized);
  if (!result.ok) {
    throw new Error(result.errors.join('; ') || 'Invalid theme payload');
  }

  await writeThemeDraft(result.payload);
  return { payload: result.payload, note };
}

export async function publishThemeDraftPayload(note = 'publish draft') {
  const rawDraft = await readThemeDraft();
  if (rawDraft) {
    const normalized = normalizeThemePayloadToOklch(rawDraft, { strict: true });
    const validation = validateTheme(normalized);
    if (!validation.ok) {
      throw new Error(validation.errors.join('; ') || 'Invalid theme payload');
    }
    await writeThemeCurrent(validation.payload);
    await writeThemeLastGood(validation.payload);
    return { published: validation.payload, note };
  }

  const current = pickValid(await readThemeCurrent());
  const fallback = pickValid(await readThemeDefault()) ?? DEFAULT_THEME_PAYLOAD;
  const next = current ?? fallback;

  await writeThemeCurrent(next);
  await writeThemeLastGood(next);

  return { published: next, note };
}
