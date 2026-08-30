/**
 * Batch-mint tracked recipient links for every live demo's prospect.
 *
 * Recovers each prospect's email from that site's Mongo `invites` collection
 * (the invite is email-bound, so it is the authoritative slug -> email map),
 * mints or refreshes a recipient link via the same registry the activity
 * digest reads, and writes a copy-paste link pack to docs/growth/.
 *
 * Run: bun scripts/demo-recipient-links-batch.ts [--until=2026-09-30] [--out=<path>]
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { discoverDemoSites } from './demo-fleet-activity-digest';
import {
  createRecipientToken,
  readOrCreateRecipientSecret,
  readRecipientRegistry,
  writeRecipientRegistry,
  type RecipientLinkRecord
} from './lib/demo-recipient-links';

const APPS_ROOT = process.env.VD_APPS_ROOT || '/srv/apps';
const INTERNAL_EMAILS = new Set(['eugenia@ontourism.academy', 'ian.wickens@ontourism.academy']);

function argumentValue(name: string, fallback: string) {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) || fallback;
}

function mongoUri(slug: string) {
  const envPath = join(APPS_ROOT, slug, '.env.production');
  const line = readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .find((candidate) => candidate.startsWith('MONGODB_URI='));
  if (!line) throw new Error(`No MONGODB_URI in ${envPath}`);
  return line.slice('MONGODB_URI='.length).replace(/^["']|["']$/g, '');
}

/** The prospect invite: latest-expiring invite whose email is not one of ours. */
function prospectEmail(slug: string) {
  const script =
    'JSON.stringify(db.invites.find({},{email:1,expiresAt:1,_id:0}).toArray()' +
    '.map(i=>({email:i.email,expiresAt:i.expiresAt&&i.expiresAt.toISOString()})))';
  const output = execFileSync('mongosh', [mongoUri(slug), '--quiet', '--eval', script], {
    encoding: 'utf8',
    timeout: 20_000
  })
    .trim()
    .split('\n')
    .pop();
  const invites = JSON.parse(output || '[]') as Array<{ email: string; expiresAt: string | null }>;
  const candidates = invites
    .filter((invite) => invite.email && !INTERNAL_EMAILS.has(invite.email.toLowerCase()))
    .sort((left, right) => (right.expiresAt || '').localeCompare(left.expiresAt || ''));
  return candidates[0]?.email.toLowerCase() || '';
}

function trackingRouteLive(slug: string) {
  try {
    const slot = realpathSync(join(APPS_ROOT, `${slug}-current`));
    return existsSync(join(slot, '.next/server/app/visit'));
  } catch {
    return false;
  }
}

function main() {
  const until = argumentValue('until', '2026-09-30');
  const out = argumentValue('out', `docs/growth/tracked-links-${new Date().toISOString().slice(0, 10)}.md`);
  const expiresAt = new Date(`${until}T22:59:59.000Z`);
  if (!Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
    throw new Error(`--until must be a future date, got: ${until}`);
  }

  const sites = discoverDemoSites(APPS_ROOT);
  if (!sites.length) throw new Error('No demo sites discovered.');
  const registry = readRecipientRegistry();
  const secret = readOrCreateRecipientSecret();
  const now = new Date();

  const rows: Array<{ site: string; email: string; url: string; pixel: string; live: boolean }> = [];
  const skipped: string[] = [];

  for (const site of sites) {
    const email = prospectEmail(site.slug);
    if (!email) {
      skipped.push(site.slug);
      continue;
    }
    const existing = registry.recipients.find(
      (record) => record.siteSlug === site.slug && record.email.toLowerCase() === email
    );
    const record: RecipientLinkRecord = {
      ...existing,
      id: existing?.id || randomUUID(),
      siteSlug: site.slug,
      name: existing?.name || site.name,
      email,
      createdAt: existing?.createdAt || now.toISOString(),
      expiresAt: expiresAt.toISOString()
    };
    registry.recipients = [
      ...registry.recipients.filter((candidate) => candidate.id !== record.id),
      record
    ].sort((left, right) => left.siteSlug.localeCompare(right.siteSlug));
    const token = createRecipientToken(record, secret);
    rows.push({
      site: site.name,
      email,
      url: new URL(`/visit/${token}`, site.url).toString(),
      pixel: `https://velvetdinosaur.com/open/${token}.gif`,
      live: trackingRouteLive(site.slug)
    });
  }

  writeRecipientRegistry(registry);

  const lines = [
    `# Tracked demo links — minted ${now.toISOString().slice(0, 10)}`,
    '',
    `One personalised tracking URL per prospect, expiring ${until} (same day as the invites).`,
    'Use these in any follow-up email INSTEAD of the bare site address — a click then shows up',
    'in the activity digest within two hours, named to the prospect.',
    '',
    '**Status meaning:** `live` = works right now. `needs release` = the tracking route is not in',
    "that site's deployed build yet; the URL is minted and stable, but until the site is released",
    'once it will show the 404 page, so do not email it before enabling. Enable a site with:',
    '',
    '```',
    'cd /srv/apps/<slug>   # preflight: git status clean, branch develop',
    'bun run release:local -- --skip-quality --skip-push',
    "curl -sI https://<slug>.velvetdinosaur.com/visit/x | head -1   # expect HTTP/2 307",
    'cd /srv/apps/velvetdinosaur && bun run demo:health',
    '```',
    '',
    '## Email-open pixel (optional but recommended)',
    '',
    'Each prospect also has a personal 1x1 tracking pixel. Put it in the email body and the',
    "digest gains an \"email opened\" signal (delivery evidence: the email landed in an inbox",
    'and was displayed at least once — it did not vanish into spam).',
    '',
    'How, in Gmail compose: Insert photo (the image icon) -> Web Address (URL) -> paste the',
    "prospect's Pixel URL -> Insert. It renders as an invisible 1px dot; leave it at the end",
    'of the email.',
    '',
    'Caveats to read once: (1) Google caches pixel fetches per URL, and viewing your OWN sent',
    'copy in Gmail fires it too — so do not reopen the sent email, or treat an "open" within a',
    'minute of sending as yourself. (2) Apple Mail prefetches images, so an Apple-side open',
    'proves delivery, not necessarily a human read. (3) No open proves nothing — many clients',
    'block images. Clicks remain the intent signal; the pixel is delivery evidence.',
    '',
    '| Business | Prospect email | Status | Tracked URL | Email pixel |',
    '|---|---|---|---|---|',
    ...rows.map(
      (row) =>
        `| ${row.site} | ${row.email} | ${row.live ? 'live' : 'needs release'} | ${row.url} | ${row.pixel} |`
    ),
    ''
  ];
  if (skipped.length) {
    lines.push(`No prospect invite found (no link minted): ${skipped.join(', ')}`, '');
  }
  writeFileSync(out, lines.join('\n'));
  console.log(
    `Minted/refreshed ${rows.length} recipient links (${rows.filter((row) => row.live).length} live now); pack written to ${out}`
  );
  if (skipped.length) console.log(`Skipped (no prospect invite): ${skipped.join(', ')}`);
}

if (import.meta.main) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
