import { afterEach, describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  compareSite,
  discoverInstalledSites,
  discoverSauroTargets,
  globToRegExp,
  loadParityManifest,
  scanTree,
  type ParityManifest
} from '@/lib/sauro-parity';

const temporaryRoots: string[] = [];

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function temporaryRoot() {
  const root = mkdtempSync(join(tmpdir(), 'sauro-parity-'));
  temporaryRoots.push(root);
  return root;
}

function write(root: string, rel: string, value = rel) {
  const path = join(root, rel);
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, value);
}

function makeSauroCheckout(root: string) {
  write(root, 'package.json', '{}');
  write(root, 'app/edit/page.tsx');
  write(root, 'components/puck/editor.tsx');
  write(root, 'puck/editor-config.ts');
}

function testManifest(referencePath: string): ParityManifest {
  return {
    version: 2,
    reference: { site: 'template', path: referencePath },
    scopes: ['app/edit', 'puck/editor-config.ts'],
    sites: [{ name: 'template', path: referencePath, branch: null, template: true }],
    workspaces: {},
    rules: [{ pattern: '**', role: 'core' }]
  };
}

const REQUIRED_PHASE_2_BEHAVIOR_PATHS = [
  'app/edit/pages/[slug]/page.tsx',
  'app/preview/[slug]/page.tsx',
  'app/api/cms/pages/[slug]/route.ts',
  'app/api/cms/pages/[slug]/publish/route.ts',
  'app/api/cms/pages/[slug]/reset-draft/route.ts',
  'app/api/assets/replace/route.ts',
  'app/api/theme/draft/route.ts',
  'app/api/theme/editor-link/route.ts',
  'app/api/theme/get/route.ts',
  'app/api/theme/publish/route.ts',
  'app/api/theme/reset/route.ts',
  'app/api/theme/save/route.ts',
  'app/api/theme/set-default/route.ts',
  'app/api/admin/support/tickets/[id]/messages/route.ts',
  'app/account/support/page.tsx',
  'components/admin/admin-workspace-shell.client.tsx',
  'components/email/support-ticket-system-update-email.tsx',
  'components/puck/editor/PuckEditorShell.tsx',
  'components/theme/theme-root-client.tsx',
  'components/ui/loading-card.tsx',
  'components/ui/sheet.tsx',
  'puck/editor-config.ts',
  'lib/authz/index.ts',
  'lib/installer-paths.ts',
  'lib/pages.ts',
  'lib/puck/patterns/index.ts',
  'lib/support/tickets.ts',
  'lib/theme-css.ts',
  'lib/theme-default.ts',
  'lib/theme-editor-auth.ts',
  'lib/theme-editor-cors.ts',
  'lib/theme-editor-jwt.ts',
  'lib/theme-editor-session.ts',
  'lib/theme-normalize.ts',
  'lib/theme-store.ts',
  'lib/theme-typography.ts',
  'lib/theme-validation.ts',
  'lib/theme.ts',
  'lib/video-live-capture/token.ts',
  'lib/video-project/slug.ts',
  'lib/email/support-ticket-system-update-email.ts',
  'models/Page.ts',
  'models/Asset.ts',
  'models/Theme.ts',
  'models/VideoLiveCaptureToken.ts',
  'models/SupportTicket.ts'
] as const;

describe('Sauro core parity manifest matching', () => {
  test('supports directory globs, single-segment globs and the catch-all', () => {
    expect(globToRegExp('app/api/support/**').test('app/api/support/tickets/route.ts')).toBe(true);
    expect(globToRegExp('components/puck/previews/*-previews.tsx').test('components/puck/previews/news-previews.tsx')).toBe(true);
    expect(globToRegExp('components/puck/previews/*-previews.tsx').test('components/puck/previews/nested/news-previews.tsx')).toBe(false);
    expect(globToRegExp('**').test('models/SupportTicket.ts')).toBe(true);
  });

  test('scans exact file scopes as well as directory scopes', () => {
    const root = temporaryRoot();
    write(root, 'app/edit/page.tsx', 'page');
    write(root, 'puck/editor-config.ts', 'config');

    const files = scanTree(root, ['app/edit', 'puck/editor-config.ts']);

    expect([...files.keys()].sort()).toEqual(['app/edit/page.tsx', 'puck/editor-config.ts']);
  });

  test('reports drift in behavioral backend and support email files', () => {
    const referenceRoot = temporaryRoot();
    const targetRoot = temporaryRoot();
    const paths = [
      'app/api/theme/save/route.ts',
      'lib/theme.ts',
      'components/email/support-ticket-system-update-email.tsx'
    ];
    for (const path of paths) {
      write(referenceRoot, path, 'canonical');
      write(targetRoot, path, 'drifted');
    }
    const manifest: ParityManifest = {
      version: 2,
      reference: { site: 'template', path: referenceRoot },
      scopes: ['app/api/theme', 'lib/theme.ts', 'components/email/support-ticket-system-update-email.tsx'],
      sites: [{ name: 'template', path: referenceRoot, branch: null, template: true }],
      workspaces: {},
      rules: [{ pattern: '**', role: 'core' }]
    };

    const report = compareSite(manifest, 'target', targetRoot, scanTree(referenceRoot, manifest.scopes));

    expect(report.files.filter((file) => file.state === 'drifted').map((file) => file.rel).sort()).toEqual(
      [...paths].sort()
    );
  });
});

describe('Sauro target discovery', () => {
  test('checks canonical installed sources and unstamped workspaces without runtime slot duplicates', () => {
    const root = temporaryRoot();
    const appsRoot = join(root, 'apps');
    const workspacesRoot = join(root, 'workspaces');
    const templateRoot = join(root, 'template');
    makeSauroCheckout(templateRoot);
    makeSauroCheckout(join(appsRoot, 'prospect'));
    makeSauroCheckout(join(appsRoot, 'prospect-blue'));
    makeSauroCheckout(join(workspacesRoot, 'prospect'));
    mkdirSync(join(appsRoot, 'not-sauro'), { recursive: true });

    const manifest = testManifest(templateRoot);
    const options = {
      appsRoot,
      workspacesRoot,
      opsRoot: join(root, 'missing-ops'),
      registryPath: join(root, 'missing-registry.json')
    };

    expect(discoverInstalledSites(manifest, options).map((site) => site.name)).toEqual(['template', 'prospect']);
    expect(discoverSauroTargets(manifest, options).map((site) => site.name)).toEqual([
      'template',
      'prospect',
      'workspace/prospect'
    ]);
  });
});

describe('fleet phase 2 manifests', () => {
  test('the canonical template has complete, self-consistent core coverage', () => {
    const manifest = loadParityManifest(join(process.cwd(), 'docs/platform/sauro-core-manifest.json'));
    const reference = scanTree(manifest.reference.path, manifest.scopes);
    const report = compareSite(manifest, manifest.reference.site, manifest.reference.path, reference);

    expect(manifest.reference).toEqual({ site: 'template', path: '/opt/vdplatform/template' });
    expect(manifest.sites.find((site) => site.name === 'thebrave')?.path).toBe('/srv/apps/thebrave-release');
    expect(reference.size).toBeGreaterThan(450);
    expect([...reference.keys()]).toEqual(expect.arrayContaining([...REQUIRED_PHASE_2_BEHAVIOR_PATHS]));
    expect(report.counts.drifted).toBe(0);
    expect(report.counts.missing).toBe(0);
    expect(report.counts.foreign).toBe(0);
    expect(report.counts['extra-core']).toBe(0);
  });

  test('sync covers every parity-classified core file while protecting site-owned seams', () => {
    const sync = JSON.parse(readFileSync('/opt/vdplatform/sync/editor-baseline.json', 'utf8')) as {
      version: number;
      allow: string[];
      deny: string[];
    };

    expect(sync.version).toBe(2);
    expect(sync.allow).toEqual(
      expect.arrayContaining([
        'app/api/cms/pages/**',
        'app/api/assets/**',
        'app/api/admin/support/**',
        'app/api/support/**',
        'app/account/support/**',
        'components/admin/**',
        'components/theme/**',
        'lib/pages.ts',
        'lib/support/**',
        'models/Page.ts',
        'models/Asset.ts',
        'models/SupportTicket.ts'
      ])
    );
    expect(sync.deny).toEqual(
      expect.arrayContaining([
        'components/admin/workspace-shell.config.tsx',
        'components/edit/edit-index.config.tsx',
        'components/puck/previews/store-preview-renders.ts',
        'puck/field-vocabulary.site.ts',
        'puck/store-block-schemas.json',
        'components/blocks/store/**',
        'public/**'
      ])
    );

    const syncAllows = (path: string) =>
      sync.allow.some((pattern) => globToRegExp(pattern).test(path)) &&
      !sync.deny.some((pattern) => globToRegExp(pattern).test(path));
    expect(REQUIRED_PHASE_2_BEHAVIOR_PATHS.filter((path) => !syncAllows(path))).toEqual([]);

    const manifest = loadParityManifest(join(process.cwd(), 'docs/platform/sauro-core-manifest.json'));
    const rules = manifest.rules.map((rule) => ({ ...rule, matcher: globToRegExp(rule.pattern) }));
    const coreReferencePaths = [...scanTree(manifest.reference.path, manifest.scopes).keys()].filter(
      (path) => rules.find((rule) => rule.matcher.test(path))?.role === 'core'
    );
    expect(coreReferencePaths.filter((path) => !syncAllows(path))).toEqual([]);
  });
});
