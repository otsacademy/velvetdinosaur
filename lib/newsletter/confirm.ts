import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/newsletter/confirm.ts');

import { clean } from '@/lib/newsletter/shared';
import { validateNewsletterConfirmToken } from '@/lib/newsletter/confirm-token';
import { confirmNewsletterTransition } from "./confirm-transition";
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

  return confirmNewsletterTransition({ ...validated, source: clean(options?.source) || "newsletter-confirm", actorType: clean(options?.actorType) || "token", actorId: clean(options?.actorId) || "" });
}
