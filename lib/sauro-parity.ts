/**
 * Sauro CMS core parity engine.
 *
 * Compares each site's shared Sauro runtime against the reference implementation
 * defined in docs/platform/sauro-core-manifest.json. Consumed by
 * scripts/sauro-parity-check.ts (CLI) and scripts/fleet-status-producer.ts
 * (the /admin/fleet sauro-ui-parity fact). Read-only.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

export type ParityRole = 'core' | 'site-owned' | 'legacy';

export type ParityRule = { pattern: string; role: ParityRole; owners?: string[]; note?: string };

export type ParitySite = {
  name: string;
  path: string;
  branch: string | null;
  offline?: boolean;
  template?: boolean;
  workspace?: boolean;
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
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as ParityManifest;
  if (!manifest.reference?.site || !manifest.reference.path) {
    throw new Error('Sauro parity manifest must declare a reference site and path');
  }
  if (!Array.isArray(manifest.scopes) || manifest.scopes.length === 0) {
    throw new Error('Sauro parity manifest must declare at least one core scope');
  }
  if (!Array.isArray(manifest.rules) || !manifest.rules.some((rule) => rule.pattern === '**')) {
    throw new Error('Sauro parity manifest must include a ** catch-all rule');
  }
  return manifest;
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

/** Repo-relative path → sha256 for every file or directory in the manifest scopes. */
export function scanTree(root: string, scopes: string[]): Map<string, string> {
  const files = new Map<string, string>();
  for (const scope of scopes) {
    const base = join(root, scope);
    if (!existsSync(base)) continue;
    let candidates: string[];
    try {
      candidates = statSync(base).isDirectory() ? walk(base) : [base];
    } catch {
      continue;
    }
    for (const file of candidates) {
      try {
        const rel = statSync(base).isDirectory() ? join(scope, relative(base, file)) : scope;
        files.set(rel, createHash('sha256').update(readFileSync(file)).digest('hex'));
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
      const ownerName = siteName.startsWith('workspace/') ? siteName.slice('workspace/'.length) : siteName;
      if (rule.owners && !rule.owners.includes(ownerName)) record(rel, 'foreign', `owned by ${rule.owners.join(', ')}`);
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

/** True when the tree has at least one manifest scope — i.e. it carries the Sauro core at all. */
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

/**
 * Union of the manifest's declared sites and Sauro source checkouts discovered
 * from the installer registries and /srv/apps. Runtime blue/green slots are
 * deliberately ignored: parity assesses their canonical source checkout.
 * Manifest entries win on name/path collisions, so overrides stay possible.
 */
export function discoverInstalledSites(
  manifest: ParityManifest,
  opts?: { opsRoot?: string; appsRoot?: string; registryPath?: string }
): ParitySite[] {
  const opsRoot = opts?.opsRoot ?? '/srv/apps/.ops/sites';
  const appsRoot = opts?.appsRoot ?? '/srv/apps';
  const registryPath = opts?.registryPath ?? '/var/lib/vd-platform/registry.json';
  const slugSet = new Set<string>();
  try {
    for (const slug of readdirSync(opsRoot)) slugSet.add(slug);
  } catch {
    // Registry dir may not exist on dev machines.
  }
  // Newer installs register in the platform registry instead of .ops/sites.
  try {
    const registry = JSON.parse(readFileSync(registryPath, 'utf8')) as {
      sites?: Record<string, unknown>;
    };
    for (const slug of Object.keys(registry.sites ?? {})) slugSet.add(slug);
  } catch {
    // No platform registry; directory scan above still applies.
  }
  try {
    for (const entry of readdirSync(appsRoot, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith('.') || /-(?:blue|green)$/.test(entry.name)) continue;
      slugSet.add(entry.name);
    }
  } catch {
    // Direct source discovery is a fallback; declared sites still apply.
  }

  const known = new Set(manifest.sites.map((site) => site.name));
  const knownPaths = new Set(manifest.sites.map((site) => canonicalPath(site.path)));
  const discovered: ParitySite[] = [];
  for (const slug of [...slugSet].sort()) {
    if (known.has(slug)) continue;
    const path = join(appsRoot, slug);
    if (knownPaths.has(canonicalPath(path)) || !isSauroCheckout(path)) continue;
    discovered.push({ name: slug, path, branch: null, note: 'auto-discovered from installed sites' });
  }
  return [...manifest.sites, ...discovered];
}

function canonicalPath(path: string) {
  try {
    return realpathSync(path);
  } catch {
    return resolve(path);
  }
}

function isSauroCheckout(path: string) {
  return (
    existsSync(join(path, 'package.json')) &&
    existsSync(join(path, 'app/edit')) &&
    existsSync(join(path, 'components/puck')) &&
    existsSync(join(path, 'puck'))
  );
}

/**
 * Complete parity inventory: installed sources plus every unstamped Sauro
 * package under /opt/vdplatform/workspaces. Workspace names are namespaced so
 * a package and its installed checkout can both appear in one report.
 */
export function discoverSauroTargets(
  manifest: ParityManifest,
  opts?: {
    opsRoot?: string;
    appsRoot?: string;
    registryPath?: string;
    workspacesRoot?: string;
  }
): ParitySite[] {
  const installed = discoverInstalledSites(manifest, opts);
  const workspacesRoot = opts?.workspacesRoot ?? '/opt/vdplatform/workspaces';
  const knownPaths = new Set(installed.map((site) => canonicalPath(site.path)));
  const workspaces: ParitySite[] = [];

  try {
    for (const entry of readdirSync(workspacesRoot, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
      const path = join(workspacesRoot, entry.name);
      if (knownPaths.has(canonicalPath(path)) || !isSauroCheckout(path)) continue;
      workspaces.push({
        name: `workspace/${entry.name}`,
        path,
        branch: null,
        workspace: true,
        note: 'auto-discovered unstamped workspace package'
      });
    }
  } catch {
    // Workspaces are optional on development machines.
  }

  return [...installed, ...workspaces.sort((a, b) => a.name.localeCompare(b.name))];
}
