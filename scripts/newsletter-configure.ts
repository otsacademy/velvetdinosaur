import path from 'node:path';
import { access, readFile, realpath, writeFile, mkdir, chmod } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { readNewsletterEnvironment } from '@/lib/newsletter/operations';

const exists = (file: string) => access(file).then(() => true, () => false);
const asapLinks: Record<string, string> = {
  NEWSLETTER_SOCIAL_FACEBOOK_URL: 'https://www.facebook.com/AcademicsStandAgainstPoverty',
  NEWSLETTER_SOCIAL_INSTAGRAM_URL: 'https://www.instagram.com/academicsstandagainstpoverty',
  NEWSLETTER_SOCIAL_X_URL: 'https://x.com/academicsstand',
  NEWSLETTER_SOCIAL_BLUESKY_URL: 'https://bsky.app/profile/acadsap.bsky.social',
  NEWSLETTER_SOCIAL_LINKEDIN_URL: 'https://www.linkedin.com/company/academics-stand-against-poverty'
};

async function main() {
  const args = process.argv.slice(2);
  const siteRoot = path.resolve(args.find((arg) => arg.startsWith('--site-root='))?.slice('--site-root='.length) || process.cwd());
  const configFile = path.join(siteRoot, 'deploy/local-first.json');
  const config = await exists(configFile) ? JSON.parse(await readFile(configFile, 'utf8')) : {};
  const paths = [path.join(siteRoot, '.env.production')];
  const controller = await readNewsletterEnvironment(paths[0]);
  const slots = Object.values(config.slots || {}) as Array<{ path: string; envFile?: string }>;
  // Installed demos commonly keep their slot metadata in the environment.
  if (!slots.length) {
    for (const name of ['BLUE', 'GREEN']) {
      const slotPath = controller[`VD_DEPLOY_${name}_PATH`];
      if (slotPath) slots.push({ path: slotPath });
    }
  }
  for (const slot of slots) {
    const envPath = slot.envFile || path.join(slot.path, '.env.production');
    if (await exists(envPath)) paths.push(envPath);
  }
  const files = [...new Set(await Promise.all(paths.map((file) => realpath(file))))];
  const configs = await Promise.all(files.map(readNewsletterEnvironment));
  const knownKeys = new Set(configs.map((env) => env.NEWSLETTER_MEDIA_ENCRYPTION_KEY).filter(Boolean));
  if (knownKeys.size > 1) throw new Error('Controller and slot encryption keys disagree. Resolve without overwriting any existing key.');
  const encryptionKey = [...knownKeys][0] || randomBytes(32).toString('base64');
  const decodedKey = Buffer.from(encryptionKey, 'base64');
  if (decodedKey.length !== 32 || decodedKey.toString('base64') !== encryptionKey) throw new Error('The existing newsletter encryption key must canonically encode exactly 32 bytes.');
  const knownCron = new Set(configs.map((env) => env.CRON_SECRET).filter(Boolean));
  if (knownCron.size > 1) throw new Error('Controller and slot cron secrets disagree. Resolve before enabling a scheduler.');
  const cronSecret = [...knownCron][0] || randomBytes(32).toString('hex');
  const isAsap = path.basename(siteRoot) === 'asap';
  const updates: Record<string, string> = { NEWSLETTER_MEDIA_ENCRYPTION_KEY: encryptionKey, CRON_SECRET: cronSecret, ...(isAsap ? asapLinks : {}) };
  const apply = args.includes('--apply');
  let changed = 0;
  for (let index = 0; index < files.length; index++) {
    const additions = Object.entries(updates).filter(([key]) => !configs[index][key]);
    if (!additions.length) continue;
    changed++;
    if (!apply) continue;
    const content = await readFile(files[index], 'utf8');
    const backupDir = path.join(siteRoot, 'logs', 'newsletter-config-backups');
    await mkdir(backupDir, { recursive: true, mode: 0o700 });
    await writeFile(path.join(backupDir, `${Date.now()}-${index}.env`), content, { mode: 0o600 });
    let next = content;
    for (const [key, value] of additions) {
      if (/[\r\n"\\]/.test(value)) throw new Error('Existing operational configuration cannot be safely serialized.');
      const line = `${key}="${value}"`;
      const pattern = new RegExp(`^(?:export\\s+)?${key}\\s*=.*$`, 'm');
      next = pattern.test(next) ? next.replace(pattern, line) : `${next.trimEnd()}\n${line}\n`;
    }
    await writeFile(files[index], next, { mode: 0o600 });
    await chmod(files[index], 0o600);
  }
  console.log(JSON.stringify({ site: path.basename(siteRoot), environmentFiles: files.length, changed, applied: apply, asapSocialLinksPreserved: isAsap }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Newsletter configuration failed.');
  process.exitCode = 1;
});
