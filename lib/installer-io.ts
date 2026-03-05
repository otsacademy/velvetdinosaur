import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { LEGACY_REGISTRY_FILE, REGISTRY_FILE, SITES_ROOT } from '@/lib/installer-paths';

type RegistrySite = {
  domain?: string;
  port?: number;
};

type RegistryShape = {
  sites?: Record<string, RegistrySite>;
};

type EnvMap = Record<string, string>;

const ENV_ALLOWLIST = new Set([
  'SITE_SLUG',
  'DOMAIN',
  'PORT',
  'PUBLIC_BASE_URL',
  'NEXT_PUBLIC_BASE_URL',
  'R2_BUCKET',
  'R2_BUCKET_NAME',
  'R2_JURISDICTION',
  'R2_ENDPOINT',
  'THEME_EDITOR_ORIGIN',
  'CANONICAL_ORIGIN',
  'VD_COMPONENT_STORE_PATH'
]);

function stripQuotes(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

async function readRegistryFile(filePath: string) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw || '{}') as RegistryShape;
    return { ok: true, sites: parsed.sites || {} };
  } catch {
    return { ok: false, sites: {} as Record<string, RegistrySite> };
  }
}

function toNumber(value?: string) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export async function readRegistry() {
  const candidates = [REGISTRY_FILE, LEGACY_REGISTRY_FILE].filter(Boolean);
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    const result = await readRegistryFile(candidate);
    if (result.ok) {
      return { sites: result.sites };
    }
  }
  return { sites: {} as Record<string, RegistrySite> };
}

export async function listSites() {
  const registry = await readRegistry();
  const registryMap = new Map<string, RegistrySite>();
  for (const [slug, site] of Object.entries(registry.sites)) {
    registryMap.set(slug, { domain: site.domain, port: site.port });
  }

  const discovered = await discoverSitesFromFilesystem();
  for (const site of discovered) {
    if (!registryMap.has(site.slug)) {
      registryMap.set(site.slug, { domain: site.domain, port: site.port ?? undefined });
    }
  }

  return Array.from(registryMap.entries())
    .map(([slug, site]) => ({
      slug,
      domain: site.domain || '',
      port: site.port ?? null
    }))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

export async function readSiteEnv(slug: string) {
  const filePath = path.join(SITES_ROOT, slug, '.env.production');
  if (!existsSync(filePath)) {
    return { env: {} as EnvMap, exists: false, path: filePath };
  }
  const raw = await fs.readFile(filePath, 'utf8');
  const env: EnvMap = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = stripQuotes(trimmed.slice(idx + 1).trim());
    env[key] = value;
  }
  return { env, exists: true, path: filePath };
}

async function discoverSitesFromFilesystem() {
  const entries = await fs.readdir(SITES_ROOT).catch(() => []);
  const sites: { slug: string; domain: string; port: number | undefined | null }[] = [];

  for (const entry of entries) {
    const envResult = await readSiteEnv(entry);
    if (!envResult.exists) continue;
    const env = envResult.env;
    const slug = env.SITE_SLUG || entry;
    const domain = env.DOMAIN || '';
    const port = toNumber(env.PORT);
    const normalizedPort = port ?? undefined;
    sites.push({ slug, domain, port: normalizedPort });
  }

  return sites;
}

export async function getSiteSummary(slug: string) {
  const registry = await readRegistry();
  const site = registry.sites[slug];
  const envResult = await readSiteEnv(slug);
  const env = envResult.env;
  const safeEnv: EnvMap = {};
  for (const [key, value] of Object.entries(env)) {
    if (ENV_ALLOWLIST.has(key)) {
      safeEnv[key] = value;
    }
  }
  return {
    slug,
    domain: site?.domain || env.DOMAIN || '',
    port: site?.port ?? (env.PORT ? Number(env.PORT) : null),
    envPath: envResult.path,
    envExists: envResult.exists,
    env: safeEnv
  };
}
