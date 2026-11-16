import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { existsSync } from 'node:fs';
import path from 'node:path';

import { contactEmailSubject, defaultContactEmailTemplates } from './contact-email-templates';
import { resolveLogoUrl, resolveSiteName } from './email-branding';

const ROOT = path.resolve(import.meta.dir, '..');
const NAME_KEYS = ['SITE_NAME', 'NEXT_PUBLIC_SITE_NAME', 'CONTACT_FORM_SUBJECT'] as const;
const saved: Record<string, string | undefined> = {};

// Production sets none of these, so the tests run without them too.
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

describe('enquiry emails carry this site’s name and logo', () => {
  test('the default name and logo are Velvet Dinosaur’s own', () => {
    expect(resolveSiteName()).toBe('Velvet Dinosaur');
    const logo = resolveLogoUrl(undefined, 'https://velvetdinosaur.com');
    expect(logo).toBe('https://velvetdinosaur.com/brand/mark-navy.png');
    expect(existsSync(path.join(ROOT, 'public', 'brand', 'mark-navy.png'))).toBe(true);
  });

  test('the enquiry email never mentions ASAP', async () => {
    const { html, text } = await defaultContactEmailTemplates();
    expect(text).toContain('from the Velvet Dinosaur website');
    for (const body of [html, text]) {
      expect(body).not.toContain('ASAP');
      expect(body).not.toContain('Academics Stand Against Poverty');
      expect(body).not.toContain('asap-logo');
    }
  });

  test('the subject names the enquiry, so a lead stands out in the inbox', () => {
    expect(contactEmailSubject('Free preview: Acme Ltd')).toBe(
      'New enquiry via Velvet Dinosaur: Free preview: Acme Ltd'
    );
    expect(contactEmailSubject('  Question\n about   hosting ')).toBe(
      'New enquiry via Velvet Dinosaur: Question about hosting'
    );
    expect(contactEmailSubject(null)).toBe('New contact enquiry via Velvet Dinosaur');
    process.env.CONTACT_FORM_SUBJECT = 'Fixed subject';
    expect(contactEmailSubject('Anything')).toBe('Fixed subject');
  });
});
