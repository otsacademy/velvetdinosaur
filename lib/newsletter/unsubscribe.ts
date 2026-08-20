import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/newsletter/unsubscribe.ts');

import { sendNewsletterUnsubscribeConfirmationEmail } from '@/lib/email/newsletter-lifecycle';
import {
  getNewsletterPreferenceByEmail,
  unsubscribeNewsletterByEmail
} from '@/lib/newsletter/consent';
import { clean } from '@/lib/newsletter/shared';
import { validateNewsletterUnsubscribeToken } from '@/lib/newsletter/unsubscribe-token';

export type NewsletterUnsubscribeResult =
  | {
      ok: true;
      email: string;
      updated: number;
      campaignId: string;
    }
  | {
      ok: false;
      error: 'invalid-token' | 'expired-token' | 'misconfigured';
    };

export async function unsubscribeNewsletterWithToken(
  rawToken: string,
  options?: { source?: string; actorType?: string; actorId?: string; reason?: string }
): Promise<NewsletterUnsubscribeResult> {
  const validated = validateNewsletterUnsubscribeToken(rawToken);
  if (!validated.ok) {
    if (validated.reason === 'expired') {
      return { ok: false, error: 'expired-token' };
    }
    if (validated.reason === 'misconfigured') {
      return { ok: false, error: 'misconfigured' };
    }
    return { ok: false, error: 'invalid-token' };
  }

  const source = clean(options?.source) || 'newsletter-unsubscribe-link';
  const actorType = clean(options?.actorType) || 'token';
  const actorId = clean(options?.actorId) || validated.campaignId;
  const reason = clean(options?.reason) || `campaign:${validated.campaignId || 'unknown'}`;

  const result = await unsubscribeNewsletterByEmail({
    email: validated.email,
    source,
    actorType,
    actorId,
    reason
  });

  if (result.updated > 0) {
    const latestPreference = await getNewsletterPreferenceByEmail(validated.email);
    void sendNewsletterUnsubscribeConfirmationEmail({
      email: validated.email,
      firstName: latestPreference?.firstName || ''
    }).catch((error) => {
      console.error('[newsletter] unsubscribe confirmation send failed', error);
    });
  }

  return {
    ok: true,
    email: validated.email,
    updated: result.updated,
    campaignId: validated.campaignId
  };
}
