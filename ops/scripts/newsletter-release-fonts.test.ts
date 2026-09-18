import { afterEach, expect, test } from 'bun:test';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { git, sha256 } from './newsletter-release-review';
import { selectVisualEnvironment, type VisualEnvironmentCatalog } from './newsletter-release-fonts';

const temporary: string[] = [];
const environment: NodeJS.ProcessEnv = { NODE_ENV: 'test' };
afterEach(() => { for (const directory of temporary.splice(0)) rmSync(directory, { recursive: true, force: true }); });
function fixture() {
  const root = mkdtempSync(path.join(tmpdir(), 'newsletter-fonts-')); temporary.push(root);
  const baselines = path.join(root, 'tests/visual/__screenshots__'); mkdirSync(baselines, { recursive: true });
  writeFileSync(path.join(baselines, 'home.png'), 'reviewed screenshot fixture');
  const profile = path.join(root, 'fonts.conf'); writeFileSync(profile, 'reviewed profile fixture');
  git(root, ['init', '-qb', 'main']); git(root, ['add', '.']);
  git(root, ['-c', 'user.name=Tests', '-c', 'user.email=tests@localhost', 'commit', '-qm', 'fixture']);
  const catalog: VisualEnvironmentCatalog = { version: 1, profileSha256: sha256(readFileSync(profile)),
    sites: [{ site: 'demo', baselineTree: git(root, ['rev-parse', 'HEAD:tests/visual/__screenshots__']), profile: 'pre-september-2026' }] };
  return { root, baselines, profile, catalog };
}

test('restored fonts apply only to an unchanged reviewed baseline tree and a copied quality environment', () => {
  const { root, profile, catalog } = fixture();
  const original: NodeJS.ProcessEnv = { NODE_ENV: 'production', SITE_SLUG: 'demo', FONTCONFIG_FILE: '/unreviewed', FONTCONFIG_PATH: '/unexpected', FONTCONFIG_SYSROOT: '/rooted' };
  const selected = selectVisualEnvironment(root, 'demo', catalog, original, profile);
  expect(selected.environment).toEqual({ NODE_ENV: 'production', SITE_SLUG: 'demo', FONTCONFIG_FILE: profile });
  expect(original.FONTCONFIG_FILE).toBe('/unreviewed');
  expect(selected.evidence.profileSha256).toBe(catalog.profileSha256);
  catalog.sites[0].profile = 'system';
  expect(selectVisualEnvironment(root, 'demo', catalog, original, profile).environment).toEqual({ NODE_ENV: 'production', SITE_SLUG: 'demo' });
});

test('unknown sites, duplicate decisions, changed profile and unknown baseline trees stop validation', () => {
  const { root, profile, catalog } = fixture();
  expect(() => selectVisualEnvironment(root, 'other', catalog, environment, profile)).toThrow('Exactly one');
  catalog.sites.push({ ...catalog.sites[0] });
  expect(() => selectVisualEnvironment(root, 'demo', catalog, environment, profile)).toThrow('Exactly one');
  catalog.sites.pop(); catalog.sites[0].baselineTree = 'a'.repeat(40);
  expect(() => selectVisualEnvironment(root, 'demo', catalog, environment, profile)).toThrow('baselines changed');
  catalog.sites[0].baselineTree = git(root, ['rev-parse', 'HEAD:tests/visual/__screenshots__']);
  writeFileSync(profile, 'altered profile');
  expect(() => selectVisualEnvironment(root, 'demo', catalog, environment, profile)).toThrow('font configuration changed');
});

test('modified and newly added screenshot files cannot borrow a previous environment review', () => {
  const { root, baselines, profile, catalog } = fixture();
  const home = path.join(baselines, 'home.png'); const original = readFileSync(home);
  writeFileSync(home, 'different screenshot');
  expect(() => selectVisualEnvironment(root, 'demo', catalog, environment, profile)).toThrow('baselines changed');
  writeFileSync(home, original); writeFileSync(path.join(baselines, 'new.png'), 'unreviewed screenshot');
  expect(() => selectVisualEnvironment(root, 'demo', catalog, environment, profile)).toThrow('baselines changed');
});
