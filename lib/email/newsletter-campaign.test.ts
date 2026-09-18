import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { prepareNewsletterCampaignEmail, renderNewsletterCampaignEmail, sendNewsletterCampaignEmail } from './newsletter-campaign';
import { getNewsletterSocialLinks } from './newsletter-social';
import { assertNewsletterSendingAllowed } from '@/lib/newsletter/send-policy';

const original = { ...process.env };
beforeEach(() => {
  process.env.POSTMARK_SERVER_TOKEN = 'mock-token-never-used';
  process.env.POSTMARK_FROM_EMAIL = 'sender@example.test';
  process.env.NEXT_PUBLIC_BASE_URL = 'https://news.example.test';
  process.env.NEWSLETTER_UNSUBSCRIBE_SECRET = 'local-test-signing-secret';
  process.env.VD_DEMO_SITE = 'false';
  for (const name of ['FACEBOOK', 'INSTAGRAM', 'X', 'BLUESKY', 'LINKEDIN']) delete process.env[`NEWSLETTER_SOCIAL_${name}_URL`];
});
afterEach(() => {
  for (const name of Object.keys(process.env)) if (!(name in original)) delete process.env[name];
  Object.assign(process.env, original);
});

const body = { subject: 'Hello {{firstName}}', htmlBody: '<p>Hello {{firstName}}</p><img src="{{appUrl}}/api/newsletter/media/immutable-version" />', textBody: 'Hello {{firstName}}', campaignId: 'campaign-test' };

describe('newsletter prepared payloads', () => {
  test('test and campaign sends share exact attachment bytes and recipient-specific links', async () => {
    const attachment = { Name: 'report.pdf', Content: Buffer.from('%PDF-1.7\nfixture\n%%EOF').toString('base64'), ContentType: 'application/pdf', ContentID: null };
    const prepared = await prepareNewsletterCampaignEmail({ ...body, attachments: [attachment] });
    const messages: Array<Parameters<NonNullable<Parameters<typeof sendNewsletterCampaignEmail>[1]>>[0]> = [];
    const transport: NonNullable<Parameters<typeof sendNewsletterCampaignEmail>[1]> = async (message) => { messages.push(message); return { MessageID: `mock-${messages.length}` }; };
    expect((await sendNewsletterCampaignEmail({ ...body, to: 'alice@example.test', firstName: 'Alice', prepared, metadata: { sendType: 'test' } }, transport)).ok).toBe(true);
    expect((await sendNewsletterCampaignEmail({ ...body, to: 'bob@example.test', firstName: 'Bob', prepared }, transport)).ok).toBe(true);
    expect(messages[0].Attachments).toEqual([attachment]);
    expect(messages[1].Attachments).toEqual([attachment]);
    expect(messages[0].HtmlBody).toContain('Hello Alice');
    expect(messages[1].HtmlBody).toContain('Hello Bob');
    expect(messages[0].HtmlBody).toContain('https://news.example.test/api/newsletter/media/immutable-version');
    expect(messages[0].Headers).not.toEqual(messages[1].Headers);
  });

  test('social icons are prepared once and merged with user attachments', async () => {
    process.env.NEWSLETTER_SOCIAL_FACEBOOK_URL = 'https://www.facebook.com/example';
    let loads = 0;
    const prepared = await prepareNewsletterCampaignEmail({ ...body, attachments: [{ Name: 'report.pdf', Content: 'ZmlsZQ==', ContentType: 'application/pdf', ContentID: null }] }, async () => {
      loads++;
      return { attachments: [{ Name: 'facebook.png', Content: 'aWNvbg==', ContentType: 'image/png', ContentID: 'cid:facebook' }], iconSrcByLabel: { Facebook: 'cid:facebook' } };
    });
    expect(prepared.icons.attachments.length).toBe(1);
    const rendered = await renderNewsletterCampaignEmail({ ...body, to: 'a@example.test', prepared });
    expect(rendered?.attachments.map((item) => item.Name)).toEqual(['facebook.png', 'report.pdf']);
    expect(rendered?.htmlBody).toContain('https://www.facebook.com/example');
    expect(rendered?.htmlBody).not.toContain('AcademicsStand');
    await renderNewsletterCampaignEmail({ ...body, to: 'b@example.test', prepared });
    expect(loads).toBe(1);
  });

  test('unset social accounts are omitted and unsafe social URL schemes are ignored', () => {
    expect(getNewsletterSocialLinks()).toEqual([]);
    process.env.NEWSLETTER_SOCIAL_FACEBOOK_URL = 'javascript:alert(1)';
    expect(getNewsletterSocialLinks()).toEqual([]);
  });

  test('demo identity disables sending without blocking previews', async () => {
    process.env.VD_DEMO_SITE = 'true';
    delete process.env.NEWSLETTER_ALLOW_DEMO_SEND;
    let calls = 0;
    const result = await sendNewsletterCampaignEmail({ ...body, to: 'a@example.test' }, async () => { calls++; return { MessageID: 'no' }; });
    expect(result.ok).toBe(false);
    expect(calls).toBe(0);
    expect(await renderNewsletterCampaignEmail({ ...body, to: 'a@example.test' }, { inlineSocialIcons: false })).not.toBeNull();
    process.env.NEWSLETTER_ALLOW_DEMO_SEND = 'true';
    expect(() => assertNewsletterSendingAllowed()).not.toThrow();
  });

  test('ambiguous provider errors are classified for manual review', async () => {
    const result = await sendNewsletterCampaignEmail({ ...body, to: 'a@example.test' }, async () => { throw new Error('socket closed after submit'); });
    expect(result.ambiguous).toBe(true);
    expect(result.ok).toBe(false);
  });

  test('recipient expansion exceeding the final size limit fails before transport without ambiguity', async () => {
    let submitted = false;
    const result = await sendNewsletterCampaignEmail({
      ...body, to: 'a@example.test', firstName: 'A'.repeat(120),
      htmlBody: `<p>${'{{firstName}}'.repeat(20_000)}</p>`
    }, async () => { submitted = true; return { MessageID: 'must-not-send' }; });
    expect(result.ok).toBe(false);
    expect(result.ambiguous).toBe(false);
    expect(result.error).toContain('smaller than 1 MiB');
    expect(submitted).toBe(false);
  });
});
