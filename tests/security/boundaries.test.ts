import { describe, expect, test } from 'bun:test';
import sharp from 'sharp';
import { assetResponseHeaders, assertAllowedAssetType, validateAssetBytes } from '@/lib/assets/file-safety';
import { getRequestIp } from '@/lib/security/rate-limit';
import { classifyPostmarkEvent } from '@/lib/newsletter/postmark-events';
import { rasterizeSafeSvg } from '@/lib/assets/svg-raster.server';

describe('upload trust boundary', () => {
  test('rejects active documents and HTML disguised as allowed media', async () => {
    for (const type of ['text/html', 'application/xhtml+xml', 'application/javascript', 'application/xml']) {
      expect(() => assertAllowedAssetType(type)).toThrow();
    }
    expect(() => assertAllowedAssetType('image/png', 'attack.html')).toThrow();
    await expect(validateAssetBytes(Buffer.from('<script>alert(1)</script>'), 'image/png')).rejects.toThrow();
    await expect(validateAssetBytes(Buffer.from('<svg onload="alert(1)"></svg>'), 'image/svg+xml')).rejects.toThrow();
    await expect(validateAssetBytes(Buffer.from('<svg><image href="https://attacker.invalid/image"/></svg>'), 'image/svg+xml')).rejects.toThrow();
  });
  test('accepts genuine raster bytes and refuses misleading MIME declarations', async () => {
    const png = await sharp({ create: { width: 2, height: 2, channels: 3, background: 'white' } }).png().toBuffer();
    await expect(validateAssetBytes(png, 'image/png')).resolves.toBeUndefined();
    await expect(validateAssetBytes(png, 'image/jpeg')).rejects.toThrow();
    const avif = await sharp(png).avif().toBuffer();
    await expect(validateAssetBytes(avif, 'image/avif')).resolves.toBeUndefined();
    expect(Bun.semver.satisfies(sharp.versions.heif || '0.0.0', '>=1.23.2')).toBe(true);
  });
  test('old active uploads are downloads in a sandbox; images remain displayable', () => {
    const headers = assetResponseHeaders('text/html', 'uploads/legacy.html');
    expect(headers['Content-Type']).toBe('application/octet-stream');
    expect(headers['Content-Disposition']).toStartWith('attachment');
    expect(headers['Content-Security-Policy']).toContain('sandbox');
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(assetResponseHeaders('image/png', 'uploads/image.png')['Content-Type']).toBe('image/png');
  });
  test('safe legacy SVG images remain displayable as pixels', async () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" fill="red"/></svg>');
    const png = await rasterizeSafeSvg(svg);
    expect((await sharp(png).metadata()).format).toBe('png');
    await expect(rasterizeSafeSvg(Buffer.from('<svg onload="alert(1)"/>'))).rejects.toThrow();
  });
});

test('only the proxy-overwritten IP controls request identity', () => {
  for (const forged of ['203.0.113.10', '203.0.113.11', 'attacker']) {
    expect(getRequestIp(new Headers({ 'x-real-ip': '192.0.2.1', 'cf-connecting-ip': forged,
      'x-forwarded-for': forged, 'true-client-ip': forged, 'x-client-ip': forged }))).toBe('192.0.2.1');
  }
  expect(getRequestIp(new Headers({ 'x-forwarded-for': '192.0.2.1' }))).toBe('');
  expect(getRequestIp(new Headers({ 'x-real-ip': 'invalid, 192.0.2.1' }))).toBe('');
});

describe('Postmark webhook contract', () => {
  const bounced = { RecordType: 'Bounce', MessageStream: 'outbound', Email: 'alex@example.test', Type: 'SoftBounce', Inactive: false, BouncedAt: '2026-09-26T12:00:00Z' };
  test('temporary bounces do not suppress; inactive bounces do', () => {
    expect(classifyPostmarkEvent(bounced)).toBeNull();
    expect(classifyPostmarkEvent({ ...bounced, Type: 'HardBounce', Inactive: true })?.active).toBe(true);
  });
  test('uses Recipient for subscription changes and rejects wrong streams/malformed events', () => {
    const changed = { RecordType: 'SubscriptionChange', MessageStream: 'outbound', Recipient: 'Alex@example.test', SuppressSending: true, ChangedAt: '2026-09-26T12:00:00Z' };
    expect(classifyPostmarkEvent(changed)?.email).toBe('alex@example.test');
    expect(classifyPostmarkEvent({ ...changed, SuppressSending: false })?.active).toBe(false);
    expect(classifyPostmarkEvent({ ...changed, SuppressSending: false, MessageID: null, SuppressionReason: null })?.active).toBe(false);
    expect(classifyPostmarkEvent({ ...changed, Origin: 'Recipient', SuppressionReason: 'ManualSuppression' })?.withdrawConsent).toBe(true);
    expect(classifyPostmarkEvent({ ...changed, Origin: 'Recipient', SuppressionReason: 'HardBounce' })?.withdrawConsent).toBe(false);
    expect(classifyPostmarkEvent({ ...changed, MessageStream: 'another-stream' })).toBeNull();
    expect(classifyPostmarkEvent({ ...changed, SuppressSending: 'false' })).toBeNull();
    expect(classifyPostmarkEvent({ ...changed, ChangedAt: 'invalid' })).toBeNull();
  });
});
