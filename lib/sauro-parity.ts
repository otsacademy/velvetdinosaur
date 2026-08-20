/**
 * Sauro CMS UI parity engine.
 *
 * Compares each site's Sauro UI scopes against the reference implementation
 * defined in docs/platform/sauro-core-manifest.json. Consumed by
 * scripts/sauro-parity-check.ts (CLI) and scripts/fleet-status-producer.ts
 * (the /admin/fleet sauro-ui-parity fact). Read-only.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

export type ParityRole = 'core' | 'site-owned' | 'legacy';

export type ParityRule = { pattern: string; role: ParityRole; owners?: string[]; note?: string };

export type ParitySite = {
  name: string;
  path: string;
  branch: string | null;
  offline?: boolean;
  template?: boolean;
  note?: string;
};

export type ParityManifest = {
  version: number;
  reference: { site: string; path: string; branch?: string };
  scopes: string[];
  sites: ParitySite[];
  workspaces: Record<string, string>;
  rules: ParityRule[];
};

export type ParityFileState = 'identical' | 'drifted' | 'missing' | 'site-owned' | 'legacy' | 'foreign' | 'extra-core';

export type ParityCounts = Record<ParityFileState, number>;

export type SiteParity = {
  site: string;
  offline: boolean;
  counts: ParityCounts;
  files: { rel: string; state: ParityFileState; note?: string }[];
  workspaces: Record<string, boolean>;
};

type CompiledRule = ParityRule & { re: RegExp };

export function loadParityManifest(manifestPath: string): ParityManifest {
  return JSON.parse(readFileSync(manifestPath, 'utf8')) as ParityManifest;
}

/** Supports ** (any depth) and * (within a path segment); patterns are repo-relative. */
export function globToRegExp(pattern: string): RegExp {
  let out = '';
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === '*') {
      if (pattern[i + 1] === '*') {
        out += '.*';
        i++;
        if (pattern[i + 1] === '/') i++;
      } else {
        out += '[^/]*';
      }
    } else if ('.+?^${}()|[]\\'.includes(ch)) {
      out += `\\${ch}`;
    } else {
      out += ch;
    }
  }
  return new RegExp(`^${out}$`);
}

function compileRules(manifest: ParityManifest): CompiledRule[] {
  return manifest.rules.map((rule) => ({ ...rule, re: globToRegExp(rule.pattern) }));
}

function ruleFor(rules: CompiledRule[], rel: string): CompiledRule {
  const hit = rules.find((rule) => rule.re.test(rel));
  if (!hit) throw new Error(`No rule matched ${rel} — the manifest must end with a catch-all`);
  return hit;
}

function walk(root: string): string[] {
  const out: string[] = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop() as string;
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = join(dir, entry);
      try {
        if (statSync(full).isDirectory()) stack.push(full);
        else out.push(full);
      } catch {
        // File vanished mid-scan; skip.
      }
    }
  }
  return out;
}

/** Scope-relative path → sha256 for every file under the manifest scopes. */
export function scanTree(root: string, scopes: string[]): Map<string, string> {
  const files = new Map<string, string>();
  for (const scope of scopes) {
    const base = join(root, scope);
    if (!existsSync(base)) continue;
    for (const file of walk(base)) {
      try {
        files.set(join(scope, relative(base, file)), createHash('sha256').update(readFileSync(file)).digest('hex'));
      } catch {
        // Unreadable file; skip rather than fail the whole scan.
      }
    }
  }
  return files;
}

export function emptyCounts(): ParityCounts {
  return { identical: 0, drifted: 0, missing: 0, 'site-owned': 0, legacy: 0, foreign: 0, 'extra-core': 0 };
}

export function compareSite(
  manifest: ParityManifest,
  siteName: string,
  sitePath: string,
  referenceFiles: Map<string, string>
): SiteParity {
  const rules = compileRules(manifest);
  const files = scanTree(sitePath, manifest.scopes);
  const report: SiteParity = {
    site: siteName,
    offline: Boolean(manifest.sites.find((s) => s.name === siteName)?.offline),
    counts: emptyCounts(),
    files: [],
    workspaces: {}
  };
  const record = (rel: string, state: ParityFileState, note?: string) => {
    report.counts[state]++;
    report.files.push({ rel, state, note });
  };

  for (const [rel, hash] of files) {
    const rule = ruleFor(rules, rel);
    if (rule.role === 'core') {
      if (!referenceFiles.has(rel)) record(rel, 'extra-core', 'core-classified file absent from reference — classify or remove');
      else if (referenceFiles.get(rel) === hash) record(rel, 'identical');
      else record(rel, 'drifted');
    } else if (rule.role === 'site-owned') {
      if (rule.owners && !rule.owners.includes(siteName)) record(rel, 'foreign', `owned by ${rule.owners.join(', ')}`);
      else record(rel, 'site-owned');
    } else {
      record(rel, 'legacy', rule.note);
    }
  }
  for (const rel of referenceFiles.keys()) {
    if (files.has(rel)) continue;
    // Reference-only site-owned/legacy files are the reference site's business, not this site's gap.
    if (ruleFor(rules, rel).role === 'core') record(rel, 'missing');
  }
  for (const [name, probe] of Object.entries(manifest.workspaces)) {
    if (name === 'note') continue;
    report.workspaces[name] = files.has(probe) || [...files.keys()].some((rel) => rel.startsWith(`${probe}/`));
  }
  return report;
}

/** True when the tree has at least one manifest scope — i.e. it carries Sauro UI at all. */
export function hasSauroScopes(root: string, manifest: ParityManifest): boolean {
  return manifest.scopes.some((scope) => existsSync(join(root, scope)));
}

/** One-line summary used by the fleet producer's sauro-ui-parity fact. */
export function summarizeCounts(counts: ParityCounts): { value: string; inParity: boolean } {
  const inParity = counts.drifted === 0 && counts.missing === 0 && counts.foreign === 0 && counts['extra-core'] === 0;
  const value = inParity
    ? `in parity (${counts.identical} core files)`
    : `core ${counts.identical} · drifted ${counts.drifted} · missing ${counts.missing}` +
      (counts.foreign ? ` · foreign ${counts.foreign}` : '') +
      (counts['extra-core'] ? ` · unclassified ${counts['extra-core']}` : '');
  return { value, inParity };
}
