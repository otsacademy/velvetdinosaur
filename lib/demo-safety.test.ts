import { describe, expect, test } from 'bun:test';
import {
  isBlockedPublicActionHref,
  isBlockedPublicActionLabel,
  isPublicDemoPath,
  shouldBlockDemoSideEffect
} from './demo-safety';

describe('demo public-safety policy', () => {
  test('blocks representative public mutations before route execution', () => {
    const blocked = [
      ['/api/contact', 'POST'],
      ['/api/auth/sign-up/email', 'POST'],
      ['/api/newsletter/subscribe', 'POST'],
      ['/api/events/summer/register', 'POST'],
      ['/api/stays/enquiry', 'POST'],
      ['/api/basket', 'PATCH'],
      ['/api/orders', 'POST'],
      ['/api/payments/intent', 'POST']
    ];
    for (const [pathname, method] of blocked) {
      expect(shouldBlockDemoSideEffect(pathname!, method!)).toBe(true);
    }
  });

  test('keeps authenticated CMS, media and support mutations available', () => {
    const allowed = ['/api/cms/pages/home', '/api/assets/upload', '/api/support/tickets', '/api/theme/save'];
    for (const pathname of allowed) expect(shouldBlockDemoSideEffect(pathname, 'POST')).toBe(false);
  });

  test('leaves reads and searches safe while identifying public action UI', () => {
    expect(shouldBlockDemoSideEffect('/api/orders', 'GET')).toBe(false);
    expect(isPublicDemoPath('/')).toBe(true);
    expect(isPublicDemoPath('/edit')).toBe(false);
    expect(isPublicDemoPath('/sign-in')).toBe(false);
    expect(isPublicDemoPath('/sign-up')).toBe(false);
    expect(isPublicDemoPath('/reset-password')).toBe(false);
    expect(isBlockedPublicActionHref('mailto:hello@example.test')).toBe(true);
    expect(isBlockedPublicActionHref('https://wa.me/441234567890')).toBe(true);
    expect(isBlockedPublicActionHref('https://widgets.resdiary.com/Widget/Standard/Test/1')).toBe(true);
    expect(isBlockedPublicActionHref('/checkout')).toBe(true);
    expect(isBlockedPublicActionHref('/search?q=cake')).toBe(false);
    expect(isBlockedPublicActionLabel('Book a table')).toBe(true);
  });
});
