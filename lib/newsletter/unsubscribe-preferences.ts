import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/newsletter/unsubscribe-preferences.ts');

import { requireNewsletterDatabase } from './database';
import { validateNewsletterUnsubscribeToken } from './unsubscribe-token';
import type { UnsubscribePageState } from './unsubscribe-state';
import { NewsletterPreference } from '@/models/NewsletterPreference';

/** Rendering, prefetching and link scanners may call this. It must remain read-only. */
export async function readUnsubscribePreferences(token: string): Promise<UnsubscribePageState> {
  const validated = validateNewsletterUnsubscribeToken(token);
  if (!validated.ok) {
    return { status: validated.reason === 'expired' ? 'expired' : validated.reason === 'misconfigured' ? 'unavailable' : 'invalid' };
  }
  try {
    await requireNewsletterDatabase();
    const rows = await NewsletterPreference.find({ email: validated.email }).select('status').lean();
    const status = rows.some((row) => row.status === 'subscribed') ? 'subscribed'
      : rows.some((row) => row.status === 'unsubscribed') ? 'already' : 'inactive';
    return { status, email: validated.email };
  } catch {
    // Do not put the signed link or recipient in error logs.
    console.error('[newsletter] could not read unsubscribe preferences');
    return { status: 'unavailable' };
  }
}
