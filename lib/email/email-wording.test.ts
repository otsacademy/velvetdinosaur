import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { render } from '@react-email/render';

import { GoogleAccountStatusEmail } from '@/components/email/google-account-status-email';
import { InviteEmail } from '@/components/email/invite-email';
import { NewsletterSubscribeConfirmationEmail } from '@/components/email/newsletter-subscribe-confirmation-email';
import { ReviewLinkEmail } from '@/components/email/review-link-email';
import { ReviewReminderEmail } from '@/components/email/review-reminder-email';
import { WaitlistSignupNotificationEmail } from '@/components/email/waitlist-signup-notification-email';
import { WelcomeConfirmationEmail } from '@/components/email/welcome-confirmation-email';
import { resolveSiteName, resolveTeamName } from '@/lib/email-branding';
import { buildInviteTextBody, buildWelcomeTextBody } from '@/lib/email/email-text-builders';
import { buildDefaultEventCampaignTemplateContent } from '@/lib/event-registration/default-campaign-template';
import { buildDefaultSystemEmailTemplateContent } from '@/lib/system-email-template-defaults';
import { getSystemEmailTemplateDefinition, TEMPLATE_ORDER } from '@/lib/system-email-template-definitions';
import { resolveEditorSampleValues } from '@/lib/system-email-templates';

// The email code came over from the Academics Stand Against Poverty site in the
// August 2026 core sync, so this site's welcome, invite, Google, review,
// waitlist, newsletter and event emails were signed "The ASAP Global Team" and
// talked about poverty research. This list keeps that wording from coming back
// with the next sync.
const OTHER_SITE_WORDING = [
  /\bASAP\b/,
  /Academics Stand/i,
  /academicsstand/i,
  /asap-logo/i,
  /Global Team/i,
  /povert/i,
  /scholarship/i,
  /solidarity/i,
  /chapter/i,
  /research/i,
  /global network/i,
  /Global Justice/i
];

const ROOT = path.resolve(import.meta.dir, '..', '..');
const SITE = 'Velvet Dinosaur';
const APP_URL = 'https://velvetdinosaur.com';
const LOGO_URL = `${APP_URL}/brand/mark-navy.png`;
const NAME_KEYS = ['SITE_NAME', 'NEXT_PUBLIC_SITE_NAME'] as const;
const saved: Record<string, string | undefined> = {};

// Production sets neither, so the tests run without them too.
beforeEach(() => {
  for (const key of NAME_KEYS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of NAME_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

function listFiles(dir: string, filter: (name: string) => boolean) {
  return readdirSync(path.join(ROOT, dir))
    .filter(filter)
    .map((name) => path.join(dir, name));
}

// Every file that writes, sends or previews an email, or the consent text
// beside the newsletter sign-up.
function emailSourceFiles() {
  const isSource = (name: string) => /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name);
  return [
    ...listFiles('components/email', isSource),
    ...listFiles('lib/email', isSource),
    ...listFiles('lib', (name) => /^(email.*|system-email-template.*|contact-email-templates)\.ts$/.test(name) && isSource(name)),
    'lib/event-registration/default-campaign-template.ts',
    'lib/content/newsletter-gdpr.ts',
    'lib/content/event-registration-gdpr.ts'
  ];
}

function findOtherSiteWording(text: string) {
  return OTHER_SITE_WORDING.filter((pattern) => pattern.test(text)).map(String);
}

describe('emails speak for this site, not the one the code came from', () => {
  test('no email source line names the other site or uses its wording', () => {
    const files = emailSourceFiles();
    expect(files.length).toBeGreaterThan(40);
    const hits: string[] = [];
    for (const file of files) {
      readFileSync(path.join(ROOT, file), 'utf8')
        .split('\n')
        .forEach((line, index) => {
          // Comments may explain the history; only what the code says counts.
          if (/^\s*(\/\/|\/\*|\*|\{\/\*)/.test(line)) return;
          const found = findOtherSiteWording(line);
          if (found.length) hits.push(`${file}:${index + 1} ${found.join(' ')} | ${line.trim()}`);
        });
    }
    expect(hits).toEqual([]);
  });

  test('emails come from, and are signed by, this site’s team', () => {
    expect(resolveSiteName()).toBe(SITE);
    expect(resolveTeamName()).toBe('The Velvet Dinosaur team');
  });

  test('the invite and welcome text name this site', () => {
    const invite = buildInviteTextBody({
      firstName: 'Sam',
      invitedByName: 'Ian',
      siteName: SITE,
      roleName: 'Editor',
      permissions: ['Edit Pages: Create and edit the pages of the website.'],
      inviteUrl: `${APP_URL}/sign-up?invite=token`,
      recipientEmail: 'sam@example.com',
      appUrl: APP_URL
    });
    expect(invite).toContain('Ian has invited you to help edit the website, in the Editor role.');
    expect(invite).toContain('Best,\nThe Velvet Dinosaur team');

    const welcome = buildWelcomeTextBody({ firstName: 'Sam', roleName: 'Editor', siteName: SITE, appUrl: APP_URL });
    expect(welcome).toContain('you have access to the Velvet Dinosaur website backend.');
    expect(welcome).toContain('Best,\nThe Velvet Dinosaur team');
    expect(findOtherSiteWording(invite + welcome)).toEqual([]);
  });

  test('the rendered emails name this site and nobody else', async () => {
    const brand = { siteName: SITE, appUrl: APP_URL, logoUrl: LOGO_URL };
    const rendered = {
      invite: await render(
        InviteEmail({
          firstName: 'Sam',
          email: 'sam@example.com',
          appName: SITE,
          appUrl: APP_URL,
          roleName: 'Editor',
          permissions: ['Edit Pages: Create and edit the pages of the website.'],
          inviteUrl: `${APP_URL}/sign-up?invite=token`,
          invitedByName: 'Ian',
          logoUrl: LOGO_URL
        })
      ),
      welcome: await render(WelcomeConfirmationEmail({ ...brand, subject: 'Welcome', firstName: 'Sam', roleName: 'Editor' })),
      googleLinked: await render(GoogleAccountStatusEmail({ ...brand, subject: 'Linked', firstName: 'Sam', status: 'linked' })),
      googleUnlinked: await render(GoogleAccountStatusEmail({ ...brand, subject: 'Unlinked', firstName: 'Sam', status: 'unlinked' })),
      reviewLink: await render(
        ReviewLinkEmail({ ...brand, subject: 'Review', greeting: 'Hello Sam,', startsLabel: 'Mon', deadlineLabel: 'Fri', reviewUrl: `${APP_URL}/review/t` })
      ),
      reviewReminder: await render(
        ReviewReminderEmail({ ...brand, subject: 'Reminder', remaining: '1 day', deadlineLabel: 'Fri', reviewUrl: `${APP_URL}/review/t` })
      ),
      waitlist: await render(
        WaitlistSignupNotificationEmail({ ...brand, subject: 'Waitlist', email: 'new@example.com', source: 'home', userAgent: 'test', createdAt: 'now' })
      ),
      newsletter: await render(
        NewsletterSubscribeConfirmationEmail({ ...brand, subject: 'Subscribed', firstName: 'Sam', unsubscribeUrl: `${APP_URL}/u` })
      )
    };
    for (const [name, html] of Object.entries(rendered)) {
      expect({ name, wording: findOtherSiteWording(html) }).toEqual({ name, wording: [] });
      expect({ name, namesSite: html.includes(SITE) }).toEqual({ name, namesSite: true });
    }
    expect(rendered.googleLinked).toContain('<strong>Velvet Dinosaur</strong> profile.');
    expect(rendered.waitlist).toContain('the <strong>Velvet Dinosaur</strong> platform.');
  });

  // Saving a template in the editor stores these defaults, and a stored
  // template overrides the code, so they must be as clean as the code.
  test('every editor default and sample is clean and resolves to this site', async () => {
    for (const key of TEMPLATE_ORDER) {
      const defaults = await buildDefaultSystemEmailTemplateContent(key);
      expect({ key, wording: findOtherSiteWording(defaults.html + defaults.text) }).toEqual({ key, wording: [] });

      const samples = resolveEditorSampleValues(getSystemEmailTemplateDefinition(key).sampleValues, {
        siteName: SITE,
        appUrl: APP_URL,
        logoUrl: LOGO_URL
      });
      const joined = Object.values(samples).join('\n');
      expect({ key, wording: findOtherSiteWording(joined), unresolved: joined.includes('{{siteName}}') }).toEqual({
        key,
        wording: [],
        unresolved: false
      });
    }

    const verification = resolveEditorSampleValues(getSystemEmailTemplateDefinition('verification').sampleValues, {
      siteName: SITE,
      appUrl: APP_URL,
      logoUrl: LOGO_URL
    });
    expect(verification['{{subject}}']).toBe('Verify your email for Velvet Dinosaur');

    const welcome = await buildDefaultSystemEmailTemplateContent('welcome');
    expect(welcome.text).toContain('The {{siteName}} team');
    const enquiry = await buildDefaultSystemEmailTemplateContent('contact-enquiry');
    expect(enquiry.text).toContain('a new contact enquiry from the {{appName}} website.');

    for (const kind of ['update', 'joining-instructions'] as const) {
      const campaign = buildDefaultEventCampaignTemplateContent(kind);
      expect(campaign.textBody).toContain('The {{siteName}} team');
      expect(campaign.htmlBody).toContain('The {{siteName}} team');
    }
  });
});
