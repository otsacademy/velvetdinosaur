import { readdir, readFile, realpath, writeFile, mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

// Reuse each site's own media proxy/upstream and rate-limit configuration.
function withNewsletterImages(source: string) {
  if (/location\s+\^~\s+\/api\/newsletter\/media\//.test(source)) return source;
  const match = source.match(/^([ \t]*)location \^~ \/api\/assets\/file \{[ \t]*$/m);
  if (!match || match.index === undefined) return source;
  const start = match.index;
  const after = source.slice(start + match[0].length);
  const end = after.search(new RegExp(`^${match[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}`, 'm'));
  if (end < 0) throw new Error('The existing media proxy block is incomplete.');
  const block = source.slice(start, start + match[0].length + end + match[1].length + 1);
  return source.slice(0, start) + block.replace('/api/assets/file', '/api/newsletter/media/') + '\n\n' + source.slice(start);
}

function privileged(command: string, args: string[]) {
  const result = spawnSync(process.getuid?.() === 0 ? command : 'sudo',
    process.getuid?.() === 0 ? args : ['-n', command, ...args], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`${command} failed.`);
}

const apply = process.argv.includes('--apply');
const requested = process.argv.find((arg) => arg.startsWith('--site='))?.slice('--site='.length);
const temp = await mkdtemp(path.join(tmpdir(), 'newsletter-nginx-'));
const backup = `/etc/nginx/backups/newsletter-media-${Date.now()}`;
const changed: Array<{ file: string; candidate: string; backup: string }> = [];
try {
  const seen = new Set<string>();
  let matched = false;
  for (const name of await readdir('/etc/nginx/sites-enabled')) {
    if (requested && name !== requested && name !== `${requested}.conf`) continue;
    matched = true;
    const file = await realpath(path.join('/etc/nginx/sites-enabled', name));
    if (seen.has(file)) continue;
    seen.add(file);
    const source = await readFile(file, 'utf8');
    const candidate = withNewsletterImages(source);
    if (candidate === source) continue;
    const local = path.join(temp, name);
    await writeFile(local, candidate);
    changed.push({ file, candidate: local, backup: path.join(backup, name) });
  }
  if (requested && !matched) throw new Error(`No enabled nginx vhost matches ${requested}.`);
  console.log(JSON.stringify({ apply, sites: changed.map((item) => path.basename(item.file)) }));
  if (apply && changed.length) {
    privileged('mkdir', ['-p', backup]);
    // Finish every backup before modifying the first active configuration file.
    for (const item of changed) privileged('cp', ['-p', item.file, item.backup]);
    try {
      for (const item of changed) privileged('install', ['-m', '644', item.candidate, item.file]);
      privileged('nginx', ['-t']);
      privileged('systemctl', ['reload', 'nginx']);
    } catch (error) {
      for (const item of changed) privileged('cp', ['-p', item.backup, item.file]);
      privileged('nginx', ['-t']);
      privileged('systemctl', ['reload', 'nginx']);
      throw error;
    }
  }
} finally {
  await rm(temp, { recursive: true, force: true });
}
