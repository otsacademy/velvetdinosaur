import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { invokeNewsletterCron, readNewsletterEnvironment, requireEmptyNewsletterQueue } from '@/lib/newsletter/operations';

function quote(value: string) {
  if (/[\r\n%]/.test(value)) throw new Error('Unsupported character in scheduler path.');
  return `'${value.replaceAll("'", "'\\''")}'`;
}

async function main() {
  const args = process.argv.slice(2);
  const rootArg = args.find((arg) => arg.startsWith('--site-root='));
  const siteRoot = path.resolve(rootArg?.slice('--site-root='.length) || process.cwd());
  const envPath = path.join(siteRoot, '.env.production');
  const env = await readNewsletterEnvironment(envPath);
  const dryRun = !args.includes('--enable-dispatch');
  if (!dryRun && env.VD_DEMO_SITE === 'true' && env.NEWSLETTER_ALLOW_DEMO_SEND !== 'true') {
    throw new Error('Real sending is disabled for this installed demo.');
  }
  // This POST is read-only regardless of the installation mode.
  const summary = await invokeNewsletterCron(env, true);
  if (!dryRun) requireEmptyNewsletterQueue(summary);
  const existing = spawnSync('crontab', ['-l'], { encoding: 'utf8' });
  if (existing.status !== 0 && !existing.stderr.includes('no crontab')) throw new Error('Unable to read the current crontab.');
  const marker = `# newsletter-media:${siteRoot}`;
  const logDir = path.join(siteRoot, 'logs');
  const retained = existing.stdout.split(/\r?\n/).filter((line) =>
    !line.includes(marker) && !(line.includes('newsletter-dispatch-cron') && line.includes(`${siteRoot}/logs/`))
  );
  const bun = process.execPath;
  const command = `cd ${quote(siteRoot)} && /usr/bin/flock -n ${quote(path.join(logDir, 'newsletter-dispatch.lock'))} ` +
    `${quote(bun)} run scripts/newsletter-dispatch-cron.ts --env-file=${quote(envPath)}${dryRun ? '' : ' --dispatch'}`;
  const entry = `*/5 * * * * ${command} >> ${quote(path.join(logDir, 'newsletter-dispatch-cron.log'))} 2>&1 ${marker}`;
  const cleanup = `17 3 * * * cd ${quote(siteRoot)} && /usr/bin/flock -n ${quote(path.join(logDir, 'newsletter-cleanup.lock'))} ` +
    `${quote(bun)} run scripts/newsletter-media-cleanup.ts --env-file=${quote(envPath)} --apply ` +
    `>> ${quote(path.join(logDir, 'newsletter-media-cleanup.log'))} 2>&1 ${marker}`;
  console.log(JSON.stringify({ siteRoot, mode: dryRun ? 'dry-run' : 'dispatch', summary, install: args.includes('--install') }));
  if (!args.includes('--install')) return;
  await mkdir(logDir, { recursive: true });
  const backup = path.join(logDir, `crontab-before-newsletter-${Date.now()}.txt`);
  // The prior crontab can contain credentials. Never print it or use permissive modes.
  await writeFile(backup, existing.stdout, { mode: 0o600 });
  const result = spawnSync('crontab', ['-'], {
    input: `${retained.join('\n').trimEnd()}\n${entry}\n${cleanup}\n`, encoding: 'utf8'
  });
  if (result.status !== 0) throw new Error('Unable to install the newsletter scheduler; original crontab is backed up.');
  console.log(`Installed ${dryRun ? 'read-only checks' : 'dispatch'} and daily snapshot cleanup for ${siteRoot}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Scheduler installation failed.');
  process.exitCode = 1;
});
