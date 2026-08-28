import { randomUUID } from 'node:crypto';
import {
  createRecipientToken,
  readOrCreateRecipientSecret,
  readRecipientRegistry,
  writeRecipientRegistry,
  type RecipientLinkRecord
} from './lib/demo-recipient-links';
import { discoverDemoSites } from './demo-fleet-activity-digest';

function argument(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length).trim() || '';
}

function trackedUrl(siteUrl: string, token: string, destination = '/') {
  const url = new URL(`/visit/${token}`, siteUrl);
  if (destination !== '/') url.searchParams.set('next', destination);
  return url.toString();
}

function invitationDestination(invitationUrl: string, expectedDomain: string) {
  if (!invitationUrl) return '';
  const url = new URL(invitationUrl);
  if (url.hostname.toLowerCase() !== expectedDomain) {
    throw new Error('Invitation URL must belong to the selected demo site.');
  }
  return `${url.pathname}${url.search}`;
}

function main() {
  const siteSlug = argument('site').toLowerCase();
  const name = argument('name');
  const email = argument('email').toLowerCase();
  const invitationUrl = argument('invite');
  const expiresDays = Number(argument('expires-days') || 30);
  if (!siteSlug || !name || !email.includes('@')) {
    throw new Error(
      'Usage: bun scripts/demo-recipient-links.ts --site=<slug> --name=<name> --email=<email> [--invite=<url>] [--expires-days=30]'
    );
  }
  if (!Number.isFinite(expiresDays) || expiresDays < 1 || expiresDays > 365) {
    throw new Error('--expires-days must be between 1 and 365.');
  }

  const site = discoverDemoSites().find((candidate) => candidate.slug === siteSlug);
  if (!site) throw new Error(`Demo site not found: ${siteSlug}`);
  const registry = readRecipientRegistry();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresDays * 24 * 60 * 60 * 1000);
  const existing = registry.recipients.find(
    (record) => record.siteSlug === siteSlug && record.email.toLowerCase() === email
  );
  const record: RecipientLinkRecord = {
    id: existing?.id || randomUUID(),
    siteSlug,
    name,
    email,
    createdAt: existing?.createdAt || now.toISOString(),
    expiresAt: expiresAt.toISOString()
  };
  registry.recipients = [
    ...registry.recipients.filter((candidate) => candidate.id !== record.id),
    record
  ].sort((left, right) => left.siteSlug.localeCompare(right.siteSlug));
  writeRecipientRegistry(registry);

  const secret = readOrCreateRecipientSecret();
  const token = createRecipientToken(record, secret);
  const inviteDestination = invitationDestination(invitationUrl, site.domain);
  console.log(
    JSON.stringify(
      {
        site: site.name,
        recipient: { name: record.name, email: record.email },
        expiresAt: record.expiresAt,
        website: trackedUrl(site.url, token),
        invitation: inviteDestination ? trackedUrl(site.url, token, inviteDestination) : null
      },
      null,
      2
    )
  );
}

if (import.meta.main) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
