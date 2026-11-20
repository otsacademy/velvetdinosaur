import { afterEach, beforeEach, expect, test } from 'bun:test';
import { sendPostmarkEmail } from '@/lib/email/postmark';

const originalFetch = globalThis.fetch;
const originalEnv = { ...process.env };
const input = { to: 'recipient@example.test', subject: 'Test', htmlBody: '<p>Test</p>', textBody: 'Test' };
beforeEach(() => { process.env.POSTMARK_SERVER_TOKEN = 'test-only'; process.env.POSTMARK_FROM_EMAIL = 'sender@example.test'; });
afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const key of Object.keys(process.env)) if (!(key in originalEnv)) delete process.env[key];
  Object.assign(process.env, originalEnv);
});
function response(body: unknown, status = 200) {
  globalThis.fetch = (async () => Response.json(body, { status })) as unknown as typeof fetch;
}
test('missing credentials cannot report a successful send or make a request', async () => {
  delete process.env.POSTMARK_SERVER_TOKEN;
  globalThis.fetch = (() => { throw new Error('Network must not be used'); }) as unknown as typeof fetch;
  expect(await sendPostmarkEmail(input)).toMatchObject({ ok: false, retryable: true });
});
test('only an explicit provider acknowledgement counts as accepted', async () => {
  response({ ErrorCode: 0, MessageID: 'provider-id' });
  expect(await sendPostmarkEmail(input)).toMatchObject({ ok: true, messageId: 'provider-id' });
  response({ ErrorCode: 0 });
  expect(await sendPostmarkEmail(input)).toMatchObject({ ok: false, ambiguous: true });
});
test('rejections, server errors and network failures never report success', async () => {
  response({}, 422); expect(await sendPostmarkEmail(input)).toMatchObject({ ok: false, ambiguous: false });
  response({}, 429); expect(await sendPostmarkEmail(input)).toMatchObject({ ok: false, retryable: true });
  response({}, 503); expect(await sendPostmarkEmail(input)).toMatchObject({ ok: false, ambiguous: true });
  globalThis.fetch = (() => { throw new Error('Connection lost'); }) as unknown as typeof fetch;
  expect(await sendPostmarkEmail(input)).toMatchObject({ ok: false, ambiguous: true });
});
