import { describe, expect, test } from 'bun:test';
import { visualValueToBodyHtml, visualValueToPlainText } from '../email-template-visual';
import { visualValueToBodyHtml as demoHtml, visualValueToPlainText as demoText } from '../demo-email-template-visual';
import { deriveNewsletterComposerSource } from './composer-source';
import { validateNewsletterAttachments } from './media-client-types';
const image = { type: 'img', assetKey: 'uploads/news/example.webp', renditionId: 'immutable-123', url: '/untrusted.jpg', alt: 'A "quiet" room <view>', caption: [{ text: 'Caption & credit' }], initialWidth: 1120, initialHeight: 700, width: 560, align: 'right', link: 'https://example.com/?a=1&b=2', children: [{ text: '' }] };
const source = { name: 'Draft', subject: 'Hello', preheader: '', visualBody: [image], htmlBody: '<p>Custom HTML</p>', textBody: 'Custom text' };
describe('newsletter image serialization', () => {
  test('emits immutable origin-token images with email-safe size, link, alt and caption', () => {
    const html = visualValueToBodyHtml([image]);
    expect(html).toContain('src="{{appUrl}}/api/newsletter/media/immutable-123"');
    expect(html).not.toContain('/untrusted.jpg');
    expect(html).toContain('width="560" height="350"');
    expect(html).toContain('alt="A &quot;quiet&quot; room &lt;view&gt;"');
    expect(html).toContain('Caption &amp; credit');
    expect(html).toContain('align="right"');
    expect(html).toContain('href="https://example.com/?a=1&amp;b=2"');
  });
  test('requires alt text or deliberate decoration', () => {
    expect(() => visualValueToBodyHtml([{ ...image, alt: '' }])).toThrow('alternative text');
    const decorative = { ...image, decorative: true, caption: [], link: '' };
    expect(visualValueToBodyHtml([decorative])).toContain('alt=""');
    expect(visualValueToPlainText([decorative])).toBe('');
  });
  test('rejects unprepared sources and removes unsafe links', () => {
    expect(() => visualValueToBodyHtml([{ ...image, renditionId: undefined, url: 'javascript:alert(1)' }])).toThrow('media library');
    expect(visualValueToBodyHtml([{ ...image, link: 'javascript:alert(1)' }])).not.toContain('<a ');
  });
  test('production and demo serializers agree, including plain text', () => {
    expect(demoHtml([image])).toBe(visualValueToBodyHtml([image]));
    expect(demoText([image])).toBe(visualValueToPlainText([image]));
    expect(demoText([image])).toContain('[Image: A "quiet" room <view>]');
    expect(demoText([image])).toContain('Caption & credit');
  });
});
describe('newsletter source authority', () => {
  test('HTML edits survive reload while visual images stay intact', () => {
    const prepared = deriveNewsletterComposerSource({ ...source, bodySource: 'html' });
    expect(prepared.htmlBody).toBe(source.htmlBody);
    expect(prepared.visualBody).toEqual([image]);
    expect(deriveNewsletterComposerSource(JSON.parse(JSON.stringify({ ...source, ...prepared })))).toEqual(prepared);
  });
  test('plain text generates delivery HTML without replacing saved visual nodes', () => {
    const prepared = deriveNewsletterComposerSource({ ...source, bodySource: 'text' });
    expect(prepared.htmlBody).toContain('Custom text');
    expect(prepared.htmlBody).not.toContain('immutable-123');
    expect(prepared.visualBody).toEqual([image]);
  });
  test('explicit visual resume restores images', () => {
    const prepared = deriveNewsletterComposerSource({ ...source, bodySource: 'html' }, [image]);
    expect(prepared.bodySource).toBe('visual');
    expect(prepared.htmlBody).toContain('immutable-123');
  });
});
test('attachment count, duplicates, MIME and combined size are checked', () => {
  const file = { assetKey: 'uploads/a.pdf', name: 'a.pdf', mime: 'application/pdf', size: 1024 };
  expect(validateNewsletterAttachments([file])).toBe('');
  expect(validateNewsletterAttachments([file, file])).toContain('already');
  expect(validateNewsletterAttachments([{ ...file, mime: 'application/zip' }])).toContain('PDF');
  expect(validateNewsletterAttachments([{ ...file, size: 5 * 1024 * 1024 + 1 }])).toContain('5 MiB');
  expect(validateNewsletterAttachments(Array.from({ length: 6 }, (_, n) => ({ ...file, assetKey: `uploads/${n}.pdf` })))).toContain('five');
});
