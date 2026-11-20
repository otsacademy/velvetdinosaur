import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/event-registration/confirm.ts');

import { validateEventRegistrationConfirmToken } from '@/lib/event-registration/confirm-token';
import { clean } from '@/lib/event-registration/shared';
import { confirmEventTransition } from "./confirm-transition";
export type EventRegistrationConfirmResult =
  | {
      ok: true;
      email: string;
      eventSlug: string;
      eventTitle: string;
      status: 'confirmed' | 'already-confirmed';
    }
  | {
      ok: false;
      error: 'invalid-token' | 'expired-token' | 'misconfigured' | 'not-pending';
    };

export async function confirmEventRegistrationWithToken(
  rawToken: string,
  options?: { source?: string; actorType?: string; actorId?: string }
): Promise<EventRegistrationConfirmResult> {
  const validated = validateEventRegistrationConfirmToken(rawToken);
  if (!validated.ok) {
    if (validated.reason === 'expired') return { ok: false, error: 'expired-token' };
    if (validated.reason === 'misconfigured') return { ok: false, error: 'misconfigured' };
    return { ok: false, error: 'invalid-token' };
  }

  return confirmEventTransition({ ...validated, source: clean(options?.source) || "event-registration-confirm", actorType: clean(options?.actorType) || "token", actorId: clean(options?.actorId) || "" });
}
