import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

type DemoSite = {
  slug: string;
  name: string;
  domain: string;
  path: string;
  workspacePackage: boolean;
  r2Bucket: string;
  r2BucketName: string;
};

const args = process.argv.slice(2);
const json = args.includes('--json');
const strict = args.includes('--strict');
const requireIndex = args.indexOf('--require');
const requiredSlug = requireIndex >= 0 ? args[requireIndex + 1] : '';
const appsRoot = process.env.VD_APPS_ROOT || '/srv/apps';
const workspacesRoot = process.env.VD_DEMO_WORKSPACES_ROOT || '/opt/vdplatform/workspaces';
// Every demo uploads to the hub's shared bucket (new-demo.sh upserts it over the
// installer's per-site default). Two sites kept the installer default and every
// upload failed with AccessDenied (customer test, 13 Sep 2026).
const hubEnvPath = process.env.VD_HUB_ENV_FILE || join(appsRoot, 'velvetdinosaur', '.env.production');

function envValue(source: string, key: string) {
  const prefix = `${key}=`;
  const line = source.split(/\r?\n/).find((candidate) => candidate.startsWith(prefix));
  if (!line) return '';
  const raw = line.slice(prefix.length).trim();
  if (raw.length >= 2 && raw.startsWith('"') && raw.endsWith('"')) return raw.slice(1, -1);
  if (raw.length >= 2 && raw.startsWith("'") && raw.endsWith("'")) return raw.slice(1, -1);
  return raw;
}

function discoverDemoSites(): DemoSite[] {
  if (!existsSync(appsRoot)) return [];
  return readdirSync(appsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => !/(?:-blue|-green|-current)$/.test(entry.name))
    .flatMap((entry) => {
      const path = join(appsRoot, entry.name);
      const envPath = join(path, '.env.production');
      if (!existsSync(envPath)) return [];
      const env = readFileSync(envPath, 'utf8');
      if (envValue(env, 'VD_DEMO_SITE').toLowerCase() !== 'true') return [];
      const slug = envValue(env, 'VD_SITE_SLUG') || entry.name;
      return [{
        slug,
        name:
          envValue(env, 'VD_SITE_NAME') ||
          envValue(env, 'NEXT_PUBLIC_VD_SITE_NAME') ||
          envValue(env, 'NEXT_PUBLIC_SITE_NAME') ||
          slug,
        domain: envValue(env, 'DOMAIN'),
        path,
        workspacePackage: existsSync(join(workspacesRoot, slug)),
        r2Bucket: envValue(env, 'R2_BUCKET'),
        r2BucketName: envValue(env, 'R2_BUCKET_NAME')
      }];
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

const sites = discoverDemoSites();
const errors: string[] = [];
const sharedBucket = existsSync(hubEnvPath) ? envValue(readFileSync(hubEnvPath, 'utf8'), 'R2_BUCKET') : '';
const duplicateSlugs = sites.filter((site, index) => sites.findIndex((candidate) => candidate.slug === site.slug) !== index);
for (const site of duplicateSlugs) errors.push(`duplicate demo slug: ${site.slug}`);
for (const site of sites) {
  if (!site.domain) errors.push(`${site.slug}: DOMAIN is missing`);
  if (!existsSync(join(site.path, 'demo/site-manifest.json'))) errors.push(`${site.slug}: demo/site-manifest.json is missing`);
  if (!existsSync(join(site.path, 'sauro-core.json'))) errors.push(`${site.slug}: sauro-core.json is missing`);
  if (sharedBucket) {
    if (site.r2Bucket !== sharedBucket) {
      errors.push(`${site.slug}: R2_BUCKET is "${site.r2Bucket || '(unset)'}", expected the shared bucket "${sharedBucket}"`);
    }
    if (site.r2BucketName !== sharedBucket) {
      errors.push(`${site.slug}: R2_BUCKET_NAME is "${site.r2BucketName || '(unset)'}", expected the shared bucket "${sharedBucket}"`);
    }
  }
}
if (requiredSlug && !sites.some((site) => site.slug === requiredSlug)) {
  errors.push(`required demo is not in the runtime inventory: ${requiredSlug}`);
}

if (json) {
  console.log(JSON.stringify({ count: sites.length, sites, errors }, null, 2));
} else {
  console.log(`Authoritative demo fleet: ${sites.length} installed demo${sites.length === 1 ? '' : 's'}`);
  for (const site of sites) {
    const packageLabel = site.workspacePackage ? 'workspace package' : 'installed source only';
    console.log(`- ${site.slug.padEnd(23)} ${site.name} (${site.domain || 'missing domain'}; ${packageLabel})`);
  }
  if (errors.length) {
    console.error('\nInventory errors:');
    for (const error of errors) console.error(`- ${error}`);
  }
}

if ((strict || requiredSlug) && errors.length) process.exit(1);
