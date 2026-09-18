import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { git, sha256 } from './newsletter-release-review';

const baselineDirectory = 'tests/visual/__screenshots__';
const legacyProfile = fileURLToPath(new URL('../quality/fonts/pre-september-2026.conf', import.meta.url));
type Profile = 'pre-september-2026' | 'system';
export type VisualEnvironmentCatalog = {
  version: 1; profileSha256: string;
  sites: { site: string; baselineTree: string; profile: Profile }[];
};

export function selectVisualEnvironment(clone: string, site: string, catalog: VisualEnvironmentCatalog,
  environment: NodeJS.ProcessEnv, profileFile = legacyProfile) {
  if (catalog.version !== 1 || !/^[a-f0-9]{64}$/.test(catalog.profileSha256)) throw new Error('Invalid visual environment catalog.');
  const rows = catalog.sites.filter((row) => row.site === site);
  if (rows.length !== 1) throw new Error(`Exactly one reviewed visual environment is required for ${site}.`);
  const row = rows[0];
  if (!['system', 'pre-september-2026'].includes(row.profile) || !/^[a-f0-9]{40}$/.test(row.baselineTree)) {
    throw new Error('Unreviewed visual environment profile or baseline tree.');
  }
  const baselineTree = git(clone, ['rev-parse', `HEAD:${baselineDirectory}`]);
  if (baselineTree !== row.baselineTree || git(clone, ['status', '--porcelain', '--untracked-files=all', '--', baselineDirectory])) {
    throw new Error(`Visual baselines changed for ${site}; review its rendering environment before retrying.`);
  }
  const profileSha256 = sha256(readFileSync(profileFile));
  if (profileSha256 !== catalog.profileSha256) throw new Error('Reviewed font configuration changed.');
  // Only the quality subprocess receives this setting. The caller keeps its
  // original environment for installation, deployment and service configuration.
  const next = { ...environment };
  delete next.FONTCONFIG_FILE; delete next.FONTCONFIG_PATH; delete next.FONTCONFIG_SYSROOT;
  if (row.profile === 'pre-september-2026') next.FONTCONFIG_FILE = profileFile;
  return { environment: next, evidence: { site, profile: row.profile, baselineTree,
    profileSha256: row.profile === 'pre-september-2026' ? profileSha256 : null } };
}

export function reviewedVisualEnvironment(clone: string, site: { slug: string; isDemo: boolean },
  catalogDirectory: string, environment: NodeJS.ProcessEnv) {
  if (!site.isDemo || site.slug === 'popty-cara') return { environment,
    evidence: { site: site.slug, profile: 'system', reason: 'Pilot already verified with the current font environment.' } };
  const file = path.join(catalogDirectory, 'visual-environments.json');
  const bytes = readFileSync(file);
  const selected = selectVisualEnvironment(clone, site.slug, JSON.parse(bytes.toString()), environment);
  const fonts = ['Arial', 'monospace', 'sans-serif'].map((family) => {
    const result = spawnSync('fc-match', ['-f', '%{family}\n%{file}\n', family], { env: selected.environment, encoding: 'utf8' });
    const [resolvedFamily, file] = result.stdout?.trim().split('\n') || [];
    if (result.status !== 0 || !resolvedFamily || !path.isAbsolute(file || '')) throw new Error('Cannot record the quality font environment.');
    return { requestedFamily: family, resolvedFamily, file, sha256: sha256(readFileSync(file)) };
  });
  return { environment: selected.environment, evidence: { ...selected.evidence, catalogSha256: sha256(bytes), fonts } };
}
