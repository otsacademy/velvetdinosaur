import { expect, test } from 'bun:test';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { readNewsletterEnvironment } from './operations';

const command = path.resolve(import.meta.dir, '../../scripts/newsletter-configure.ts');

test('configuration discovers environment-defined slots and preserves one key across all of them', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'newsletter-config-test-'));
  try {
    const blue = path.join(root, 'blue');
    const green = path.join(root, 'green');
    await mkdir(blue); await mkdir(green);
    const source = `VD_DEPLOY_BLUE_PATH="${blue}"\nVD_DEPLOY_GREEN_PATH="${green}"\n`;
    await writeFile(path.join(root, '.env.production'), source);
    await writeFile(path.join(blue, '.env.production'), 'PORT=3103\n');
    await writeFile(path.join(green, '.env.production'), 'PORT=3104\n');
    const dryRun = spawnSync(process.execPath, [command, `--site-root=${root}`], { encoding: 'utf8' });
    expect(dryRun.status).toBe(0);
    expect(await readFile(path.join(root, '.env.production'), 'utf8')).toBe(source);
    const apply = spawnSync(process.execPath, [command, `--site-root=${root}`, '--apply'], { encoding: 'utf8' });
    expect(apply.status).toBe(0);
    const configs = await Promise.all([root, blue, green].map((dir) => readNewsletterEnvironment(path.join(dir, '.env.production'))));
    expect(new Set(configs.map((env) => env.NEWSLETTER_MEDIA_ENCRYPTION_KEY)).size).toBe(1);
    expect(new Set(configs.map((env) => env.CRON_SECRET)).size).toBe(1);
    expect(Buffer.from(configs[0].NEWSLETTER_MEDIA_ENCRYPTION_KEY, 'base64').length).toBe(32);
    expect(configs[1].PORT).toBe('3103');
    expect(apply.stdout).not.toContain(configs[0].NEWSLETTER_MEDIA_ENCRYPTION_KEY);
    expect(apply.stdout).not.toContain(configs[0].CRON_SECRET);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('conflicting retained encryption keys stop provisioning before any writes', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'newsletter-config-conflict-'));
  try {
    const blue = path.join(root, 'blue');
    await mkdir(blue);
    const source = `VD_DEPLOY_BLUE_PATH="${blue}"\nNEWSLETTER_MEDIA_ENCRYPTION_KEY="${Buffer.alloc(32, 1).toString('base64')}"\n`;
    const slot = `NEWSLETTER_MEDIA_ENCRYPTION_KEY="${Buffer.alloc(32, 2).toString('base64')}"\n`;
    await writeFile(path.join(root, '.env.production'), source);
    await writeFile(path.join(blue, '.env.production'), slot);
    const result = spawnSync(process.execPath, [command, `--site-root=${root}`, '--apply'], { encoding: 'utf8' });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('encryption keys disagree');
    expect(await readFile(path.join(root, '.env.production'), 'utf8')).toBe(source);
    expect(await readFile(path.join(blue, '.env.production'), 'utf8')).toBe(slot);
  } finally { await rm(root, { recursive: true, force: true }); }
});
