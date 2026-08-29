import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const REQUIRED_DEMO_FACTS = [
  'tradingStatus',
  'telephone',
  'email',
  'address',
  'openingHours',
  'prices',
  'awards',
  'events',
  'socialLinks'
] as const;

type EvidenceStatus = 'verified' | 'not-published' | 'not-applicable';

type FactEvidence = {
  status?: EvidenceStatus;
  value?: unknown;
  sources?: unknown;
};

export type ClaimEvidence = {
  kind?: string;
  text?: string;
  sourceUrl?: string;
  verifiedAt?: string;
};

export type DemoManifest = {
  seedCommand?: string;
  description?: string;
  factCheck?: {
    verifiedAt?: string;
    reviewer?: string;
    facts?: Record<string, FactEvidence>;
  };
  claims?: ClaimEvidence[];
};

function isHttpUrl(value: unknown) {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function parseDate(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

export async function loadDemoManifest(cwd = process.cwd()) {
  const manifestPath = path.join(cwd, 'demo', 'site-manifest.json');
  const raw = await readFile(manifestPath, 'utf8');
  return JSON.parse(raw) as DemoManifest;
}

export function normalizeEvidenceText(value: unknown) {
  return String(value || '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function validateDemoEvidence(
  manifest: DemoManifest,
  options: { requireCurrentFacts?: boolean; maxAgeHours?: number } = {}
) {
  const errors: string[] = [];
  const maxAgeHours = options.maxAgeHours ?? 24;
  const factCheck = manifest.factCheck;
  const facts = factCheck?.facts || {};

  if (options.requireCurrentFacts) {
    const verifiedAt = parseDate(factCheck?.verifiedAt);
    if (!verifiedAt) {
      errors.push('Fact evidence is missing a valid factCheck.verifiedAt timestamp');
    } else {
      const ageMs = Date.now() - verifiedAt.getTime();
      if (ageMs < 0 || ageMs > maxAgeHours * 60 * 60 * 1000) {
        errors.push(`Fact evidence is older than ${maxAgeHours} hours`);
      }
    }
    if (!factCheck?.reviewer?.trim()) errors.push('Fact evidence is missing factCheck.reviewer');
  }

  for (const key of REQUIRED_DEMO_FACTS) {
    const fact = facts[key];
    if (!fact) {
      errors.push(`Fact evidence is missing ${key}`);
      continue;
    }
    if (!['verified', 'not-published', 'not-applicable'].includes(String(fact.status || ''))) {
      errors.push(`Fact evidence ${key} has an invalid status`);
    }
    const sources = Array.isArray(fact.sources) ? fact.sources : [];
    if (sources.length === 0 || sources.some((source) => !isHttpUrl(source))) {
      errors.push(`Fact evidence ${key} must include valid HTTP source URLs`);
    }
    if (fact.status === 'verified' && (fact.value === undefined || fact.value === null || fact.value === '')) {
      errors.push(`Fact evidence ${key} is verified but has no value`);
    }
  }

  for (const [index, claim] of (manifest.claims || []).entries()) {
    if (!claim.kind?.trim()) errors.push(`Claim ${index + 1} is missing kind`);
    if (!claim.text?.trim()) errors.push(`Claim ${index + 1} is missing text`);
    if (!isHttpUrl(claim.sourceUrl)) errors.push(`Claim ${index + 1} is missing a valid sourceUrl`);
    if (!parseDate(claim.verifiedAt)) errors.push(`Claim ${index + 1} is missing a valid verifiedAt`);
  }

  return errors;
}

export function hasSourcedClaim(manifest: DemoManifest, kind: string, text: string) {
  const target = normalizeEvidenceText(text);
  if (!target) return false;
  return (manifest.claims || []).some((claim) => {
    if (normalizeEvidenceText(claim.kind) !== normalizeEvidenceText(kind)) return false;
    const evidence = normalizeEvidenceText(claim.text);
    return Boolean(evidence && (evidence.includes(target) || target.includes(evidence)) && isHttpUrl(claim.sourceUrl));
  });
}
