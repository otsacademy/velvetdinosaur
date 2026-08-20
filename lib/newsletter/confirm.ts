import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/newsletter/confirm.ts');

import { sendNewsletterSubscribeConfirmationEmail } from '@/lib/email/newsletter-lifecycle';
import {
  getNewsletterPreferenceByEmail,
  getNewsletterPreferenceForUser,
  setNewsletterConsentForUser
} from '@/lib/newsletter/consent';
import { clean } from '@/lib/newsletter/shared';
import { validateNewsletterConfirmToken } from '@/lib/newsletter/confirm-token';
import { clearNewsletterSuppression } from '@/lib/newsletter/suppression';

export type NewsletterConfirmResult =
  | {
      ok: true;
      email: string;
      userId: string;
      status: 'confirmed' | 'already-subscribed';
    }
  | {
      ok: false;
      error: 'invalid-token' | 'expired-token' | 'misconfigured' | 'not-pending';
    };

export async function confirmNewsletterSubscriptionWithToken(
  rawToken: string,
  options?: { source?: string; actorType?: string; actorId?: string }
): Promise<NewsletterConfirmResult> {
  const validated = validateNewsletterConfirmToken(rawToken);
  if (!validated.ok) {
    if (validated.reason === 'expired') return { ok: false, error: 'expired-token' };
    if (validated.reason === 'misconfigured') return { ok: false, error: 'misconfigured' };
    return { ok: false, error: 'invalid-token' };
  }

  const preference = await getNewsletterPreferenceForUser(validated.userId);
  const byEmail = preference || (await getNewsletterPreferenceByEmail(validated.email));
  const current = byEmail;
  if (!current) return { ok: false, error: 'not-pending' };
  if (current.email !== validated.email) return { ok: false, error: 'invalid-token' };

  if (current.status === 'subscribed') {
    return {
      ok: true,
      email: current.email,
      userId: current.userId,
      status: 'already-subscribed'
    };
  }

  if (current.status !== 'pending') {
    return { ok: false, error: 'not-pending' };
  }

  const updated = await setNewsletterConsentForUser({
    userId: current.userId,
    email: current.email,
    firstName: current.firstName,
    status: 'subscribed',
    source: clean(options?.source) || 'newsletter-confirm-link',
    legalTextVersion: current.legalTextVersion || 'v1',
    actorType: clean(options?.actorType) || 'token',
    actorId: clean(options?.actorId) || current.userId,
    reason: 'double-opt-in-confirmed'
  });

  if (!updated || updated.status !== 'subscribed') {
    return { ok: false, error: 'not-pending' };
  }

  await clearNewsletterSuppression({
    email: updated.email,
    source: 'double-opt-in-confirmed',
    reason: 'user-confirmed-subscription'
  });

  void sendNewsletterSubscribeConfirmationEmail({
    email: updated.email,
    firstName: updated.firstName || ''
  }).catch((error) => {
    console.error('[newsletter] subscribe confirmation send failed', error);
  });

  return {
    ok: true,
    email: updated.email,
    userId: updated.userId,
    status: 'confirmed'
  };
}
