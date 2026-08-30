import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { connectDB } from '@/lib/db';
import { Asset } from '@/models/Asset';
import { Page } from '@/models/Page';
import {
  hasSourcedClaim,
  loadDemoManifest,
  validateDemoEvidence,
  type DemoManifest
} from './demo-evidence';

const coreTypes = new Set(['Hero', 'FeatureGrid', 'Text', 'Image', 'CTA', 'Attachment']);
const imageExtensions = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp']);

async function sourceMediaCount() {
  const signatures = new Set<string>();
  async function collect(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) await collect(target);
      if (entry.isFile() && imageExtensions.has(path.extname(entry.name).toLowerCase())) {
        const digest = createHash('sha256').update(await readFile(target)).digest('hex');
        signatures.add(`${entry.name.toLowerCase()}:${digest}`);
      }
    }
  }
  const publicRoot = path.join(process.cwd(), 'public');
  await Promise.all(
    ['demo-photos', 'design-assets'].map((directory) => collect(path.join(publicRoot, directory)))
  );
  return signatures.size;
}

async function registeredBlockSource() {
  async function read(directory: string): Promise<string> {
    const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
    const chunks: string[] = [];
    for (const entry of entries) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) chunks.push(await read(target));
      if (entry.isFile() && /\.tsx?$/.test(entry.name)) chunks.push(await readFile(target, 'utf8'));
    }
    return chunks.join('\n');
  }
  return read(path.join(process.cwd(), 'components', 'blocks', 'store'));
}

type InspectionResult = {
  types: Set<string>;
  legacy: number;
  assetKeys: Set<string>;
  copyProblems: string[];
  linkProblems: string[];
  reviewQuotes: string[];
};

const unsafeCopyPatterns = [
  /\blorem ipsum\b/i,
  /\bplaceholder (copy|content|image|text)\b/i,
  /\b(click|tap) (here )?to edit\b/i,
  /\buse the (page )?editor\b/i,
  /\breplace (this|me)\b/i,
  /\bTODO\b/,
  /\[insert [^\]]+\]/i,
  /\[[^\]]+ (profile|page) URL\]/i,
  /\bexample\.com\b/i
];

function inspect(
  value: unknown,
  result: InspectionResult,
  trail = 'page',
  semanticContext = trail
) {
  if (typeof value === 'string') {
    if (value.startsWith('/demo-photos/') || value.startsWith('/design-assets/')) result.legacy += 1;
    if (value.startsWith('/api/assets/file?key=')) {
      const key = new URL(value, 'https://demo.invalid').searchParams.get('key');
      if (key) result.assetKeys.add(key);
    }
    if (unsafeCopyPatterns.some((pattern) => pattern.test(value))) {
      result.copyProblems.push(`${trail}: ${value.slice(0, 120)}`);
    }
    return;
  }
  if (Array.isArray(value)) {
    return value.forEach((item, index) =>
      inspect(item, result, `${trail}[${index}]`, semanticContext)
    );
  }
  if (!value || typeof value !== 'object') return;
  const record = value as Record<string, unknown>;
  const nextSemanticContext =
    typeof record.type === 'string' ? record.type : semanticContext;
  if (typeof record.type === 'string' && record.props) result.types.add(record.type);
  for (const [key, item] of Object.entries(record)) {
    const nextTrail = `${trail}.${key}`;
    if (typeof item === 'string' && /^(href|url|link)$/i.test(key)) {
      const link = item.trim();
      if (link === '#' || /^javascript:/i.test(link) || /example\.com/i.test(link) || /^\[[^\]]+\]$/.test(link)) {
        result.linkProblems.push(`${nextTrail}: ${link || '(empty)'}`);
      }
    }
    if (
      typeof item === 'string' &&
      /^(quote|review|testimonial)$/i.test(key) &&
      item.trim().length >= 20 &&
      (/review|testimonial|quote/i.test(nextSemanticContext) || /^(review|testimonial)$/i.test(key))
    ) {
      result.reviewQuotes.push(item.trim());
    }
    inspect(item, result, nextTrail, nextSemanticContext);
  }
}

async function verifyDemoSafetyIntegration() {
  const requiredSourceMarkers: Array<[string, string[]]> = [
    ['app/layout.tsx', ['DemoSafetyBanner', 'isDemoSite()', 'noarchive: true', 'nocache: true']],
    ['proxy.ts', ['shouldBlockDemoSideEffect', 'X-VD-Demo-Site', 'X-VD-Demo-Blocked', 'no-store, no-cache, must-revalidate']],
    ['app/robots.ts', ["disallow: '/'"]],
    ['lib/demo-safety.ts', ["'/sign-in'", "'/sign-up'", "'/reset-password'"]],
    ['components/demo/demo-safety-banner.client.tsx', ['fixed inset-x-0 bottom-0', 'z-[100]']],
    ['components/auth/auth-form.tsx', ['redirectTo', '/reset-password', 'autoComplete="email"', "'current-password'"]],
    ['components/auth/auth-page-shell.tsx', ['Back to website preview', 'Secure editor access by Velvet Dinosaur', 'support@velvetdinosaur.com']],
    ['app/sign-in/page.tsx', ['AuthPageShell', 'Editor sign in']],
    ['app/reset-password/page.tsx', ['AuthPageShell', 'ResetPasswordForm']],
    ['components/auth/reset-password-form.tsx', ['/api/auth/reset-password', 'newPassword', 'token']],
    ['lib/email.ts', ['Velvet Dinosaur', 'Reset your editor password for ${managedSiteName}']]
  ];
  const errors: string[] = [];
  for (const [relativePath, markers] of requiredSourceMarkers) {
    const source = await readFile(path.join(process.cwd(), relativePath), 'utf8').catch(() => '');
    for (const marker of markers) {
      if (!source.includes(marker)) errors.push(`${relativePath} is missing demo-safety marker: ${marker}`);
    }
  }
  const authEmailSources = await Promise.all(
    [
      'lib/email.ts',
      'lib/email/email-text-builders.ts',
      'components/email/invite-email.tsx',
      'components/email/reset-password-email.tsx',
      'components/email/waitlist-signup-notification-email.tsx'
    ].map(async (relativePath) => ({
      relativePath,
      source: await readFile(path.join(process.cwd(), relativePath), 'utf8').catch(() => '')
    }))
  );
  for (const { relativePath, source } of authEmailSources) {
    if (/ASAP|Academics Stand Against Poverty/.test(source)) {
      errors.push(`${relativePath} contains legacy ASAP email branding`);
    }
  }
  return errors;
}

async function main() {
  const strict = process.argv.includes('--strict');
  const requireMedia = strict || process.argv.includes('--require-media');
  const requireSiteBlocks = strict || process.argv.includes('--require-site-blocks');
  const requireCurrentFacts = strict || process.argv.includes('--require-current-facts');
  const maxAgeArgument = process.argv.find((argument) => argument.startsWith('--max-fact-age-hours='));
  const maxAgeHours = maxAgeArgument ? Number(maxAgeArgument.split('=', 2)[1]) : 24;
  const connection = await connectDB();
  if (!connection) throw new Error('Database connection not available');

  const pages = await Page.find({ slug: { $not: /^smoke-/ } }).lean();
  const result: InspectionResult = {
    types: new Set<string>(),
    legacy: 0,
    assetKeys: new Set<string>(),
    copyProblems: [],
    linkProblems: [],
    reviewQuotes: []
  };
  const errors: string[] = [];
  errors.push(...(await verifyDemoSafetyIntegration()));
  let manifest: DemoManifest = {};
  try {
    manifest = await loadDemoManifest();
    errors.push(...validateDemoEvidence(manifest, { requireCurrentFacts, maxAgeHours }));
  } catch (error) {
    errors.push(`Demo manifest is missing or invalid: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!pages.length) errors.push('No CMS pages exist');
  for (const page of pages) {
    if (!page.draftData) errors.push(`${page.slug}: missing draft data`);
    if (!page.publishedData && !page.data) errors.push(`${page.slug}: missing published data`);
    inspect(page.draftData, result);
    inspect(page.publishedData, result);
    inspect(page.data, result);
  }

  const blockSource = await registeredBlockSource();
  const clientRegistry = await readFile(path.join(process.cwd(), 'puck', 'registry.client.ts'), 'utf8');
  for (const type of result.types) {
    if (!coreTypes.has(type) && !blockSource.includes(type)) errors.push(`Unregistered Puck block: ${type}`);
  }
  if (
    [...result.types].some((type) => !coreTypes.has(type)) &&
    !clientRegistry.includes('storeBlocksCurated') &&
    !clientRegistry.includes('storeBlocks as clientSafeBlocks')
  ) {
    errors.push('Site-specific blocks are not loaded by the client Puck registry');
  }
  if (result.legacy) errors.push(`${result.legacy} local demo-photo references remain`);
  for (const problem of result.copyProblems) errors.push(`Unsafe public copy: ${problem}`);
  for (const problem of result.linkProblems) errors.push(`Unresolved public link: ${problem}`);
  for (const quote of result.reviewQuotes) {
    if (!hasSourcedClaim(manifest, 'review', quote) && !hasSourcedClaim(manifest, 'testimonial', quote)) {
      errors.push(`Unsourced review/testimonial: ${quote.slice(0, 120)}`);
    }
  }
  if (requireSiteBlocks && ![...result.types].some((type) => !coreTypes.has(type))) {
    errors.push('No site-specific Puck blocks are used');
  }

  const mediaFiles = await sourceMediaCount();
  const mediaAssets = await Asset.find({ folder: 'site-media', deletedAt: null }).select('key').lean();
  const storedKeys = new Set(mediaAssets.map((asset) => asset.key));
  if (mediaAssets.length < mediaFiles) errors.push(`Media library has ${mediaAssets.length} assets for ${mediaFiles} source images`);
  if (requireMedia && mediaAssets.length === 0) errors.push('Media library is empty');
  for (const key of result.assetKeys) if (!storedKeys.has(key)) errors.push(`Page references missing media asset: ${key}`);

  const editorSource = await readFile(path.join(process.cwd(), 'components/edit/editor-client.tsx'), 'utf8');
  if (!editorSource.includes('enabled: true')) errors.push('Puck editor is not using the site preview iframe');
  if (!editorSource.includes('SiteDesignFrame')) errors.push('Puck editor is missing the site design frame');

  const summary = {
    pages: pages.length,
    blockTypes: [...result.types].sort(),
    mediaFiles,
    mediaAssets: mediaAssets.length,
    referencedAssets: result.assetKeys.size,
    reviewsChecked: result.reviewQuotes.length,
    factEvidenceRequired: requireCurrentFacts,
    errors
  };
  console.log(JSON.stringify(summary, null, 2));
  if (errors.length) process.exitCode = 1;
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(async () => {
    const mongoose = await import('mongoose');
    await mongoose.default.disconnect();
  });
