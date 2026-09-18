/** Claim before side effects. Never put an uncertain delivery back into pending. */
export type DeliverySendResult = { ok: boolean; messageId: string; error: string; ambiguous?: boolean };
export type DeliveryCompletion = { status: 'sent' | 'failed' | 'needs_review' | 'skipped_no_consent' | 'skipped_unsubscribed' | 'skipped_suppressed'; error: string; postmarkMessageId?: string; sentAt?: Date };
export type ClaimedDelivery = { id: string; email: string; firstName: string; userId: string };
export type DeliveryWorker = {
  claim: () => Promise<ClaimedDelivery | null>;
  permitted: (delivery: ClaimedDelivery) => Promise<DeliveryCompletion | null>;
  send: (delivery: ClaimedDelivery) => Promise<DeliverySendResult>;
  complete: (delivery: ClaimedDelivery, outcome: DeliveryCompletion) => Promise<void>;
};

export async function runOneNewsletterDelivery(worker: DeliveryWorker) {
  const delivery = await worker.claim();
  if (!delivery) return null;
  let attempted = false;
  try {
    const skipped = await worker.permitted(delivery);
    if (skipped) {
      await worker.complete(delivery, skipped);
      return skipped.status;
    }
    attempted = true;
    const result = await worker.send(delivery);
    const outcome: DeliveryCompletion = result.ok
      ? { status: 'sent', error: '', postmarkMessageId: result.messageId, sentAt: new Date() }
      : { status: result.ambiguous ? 'needs_review' : 'failed', error: result.error || 'Delivery failed' };
    await worker.complete(delivery, outcome);
    return outcome.status;
  } catch (error) {
    const outcome: DeliveryCompletion = {
      status: attempted ? 'needs_review' : 'failed',
      error: attempted ? 'Delivery outcome is uncertain. Check provider activity before any manual retry.' : error instanceof Error ? error.message : 'Delivery validation failed'
    };
    // If this write also fails, the processing claim remains. Recovery marks it needs_review.
    await worker.complete(delivery, outcome);
    return outcome.status;
  }
}
