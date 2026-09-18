import { describe, expect, test } from 'bun:test';
import { runOneNewsletterDelivery, type DeliveryWorker, type DeliveryCompletion } from './delivery-worker';

function memoryWorker(send: DeliveryWorker['send']) {
  let state: string = 'pending';
  let completeCalls = 0;
  const worker: DeliveryWorker = {
    claim: async () => {
      if (state !== 'pending') return null;
      state = 'processing';
      return { id: 'one', email: 'recipient@example.test', firstName: 'Test', userId: 'user' };
    },
    permitted: async () => null,
    send,
    complete: async (_, outcome) => { completeCalls++; state = outcome.status; }
  };
  return { worker, state: () => state, completeCalls: () => completeCalls };
}

describe('newsletter delivery claim and crash boundaries', () => {
  test('overlapping dispatch workers can send a pending recipient only once', async () => {
    let sends = 0;
    let release!: () => void;
    const barrier = new Promise<void>((resolve) => { release = resolve; });
    const store = memoryWorker(async () => { sends++; await barrier; return { ok: true, messageId: 'accepted', error: '' }; });
    const first = runOneNewsletterDelivery(store.worker);
    const second = runOneNewsletterDelivery(store.worker);
    release();
    expect(await Promise.all([first, second])).toEqual(['sent', null]);
    expect(sends).toBe(1);
    expect(await runOneNewsletterDelivery(store.worker)).toBeNull();
  });

  test('provider timeout remains needs_review and is never automatically reclaimed', async () => {
    let sends = 0;
    const store = memoryWorker(async () => { sends++; return { ok: false, messageId: '', error: 'connection closed after submit', ambiguous: true }; });
    expect(await runOneNewsletterDelivery(store.worker)).toBe('needs_review');
    expect(await runOneNewsletterDelivery(store.worker)).toBeNull();
    expect(sends).toBe(1);
  });

  test('accepted message followed by persistence failure becomes needs_review', async () => {
    const store = memoryWorker(async () => ({ ok: true, messageId: 'provider-id', error: '' }));
    const complete = store.worker.complete;
    store.worker.complete = async (row, result) => {
      if (result.status === 'sent') throw new Error('Database disconnected after provider accepted');
      await complete(row, result);
    };
    expect(await runOneNewsletterDelivery(store.worker)).toBe('needs_review');
    expect(store.state()).toBe('needs_review');
    expect(await runOneNewsletterDelivery(store.worker)).toBeNull();
  });

  test('crash before acknowledgement leaves a non-retriable processing claim', async () => {
    let sends = 0;
    const store = memoryWorker(async () => { sends++; return { ok: true, messageId: 'provider-id', error: '' }; });
    store.worker.complete = async () => { throw new Error('Database offline'); };
    await expect(runOneNewsletterDelivery(store.worker)).rejects.toThrow('Database offline');
    expect(store.state()).toBe('processing');
    expect(await runOneNewsletterDelivery(store.worker)).toBeNull();
    expect(sends).toBe(1);
  });

  test.each(['skipped_no_consent', 'skipped_unsubscribed', 'skipped_suppressed'] as const)('%s never invokes transport', async (status) => {
    let sends = 0;
    const store = memoryWorker(async () => { sends++; return { ok: true, messageId: '', error: '' }; });
    store.worker.permitted = async (): Promise<DeliveryCompletion> => ({ status, error: status });
    expect(await runOneNewsletterDelivery(store.worker)).toBe(status);
    expect(sends).toBe(0);
  });
});
