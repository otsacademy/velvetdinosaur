import { z } from 'zod';

const base = { MessageStream: z.string().min(1).max(120), MessageID: z.string().max(200).nullable().optional() };
const timestamp = z.string().datetime({ offset: true });
export const PostmarkEventSchema = z.discriminatedUnion('RecordType', [
  z.object({ ...base, RecordType: z.literal('Bounce'), Email: z.string().email(), Type: z.string(), Inactive: z.boolean(), BouncedAt: timestamp }),
  z.object({ ...base, RecordType: z.literal('SpamComplaint'), Email: z.string().email(), BouncedAt: timestamp }),
  z.object({ ...base, RecordType: z.literal('SubscriptionChange'), Recipient: z.string().email(), SuppressSending: z.boolean(), ChangedAt: timestamp,
    SuppressionReason: z.string().nullable().optional(), Origin: z.string().optional() })
]);

export function classifyPostmarkEvent(body: unknown, expectedStream = 'outbound') {
  const parsed = PostmarkEventSchema.safeParse(body);
  if (!parsed.success) return null;
  const event = parsed.data;
  if (event.MessageStream !== expectedStream) return null;
  if (event.RecordType === 'Bounce' && !event.Inactive) return null;
  return {
    email: (event.RecordType === 'SubscriptionChange' ? event.Recipient : event.Email).trim().toLowerCase(),
    active: event.RecordType === 'SubscriptionChange' ? event.SuppressSending : true,
    at: new Date(event.RecordType === 'SubscriptionChange' ? event.ChangedAt : event.BouncedAt),
    eventType: event.RecordType.toLowerCase(),
    reason: event.RecordType === 'SubscriptionChange' ? event.SuppressionReason || 'provider-change' : event.RecordType === 'Bounce' ? event.Type : 'SpamComplaint',
    withdrawConsent: event.RecordType === 'SpamComplaint' || (event.RecordType === 'SubscriptionChange' && event.SuppressSending &&
      (event.SuppressionReason === 'SpamComplaint' || (event.SuppressionReason === 'ManualSuppression' && event.Origin === 'Recipient'))),
    messageId: event.MessageID || '', messageStream: event.MessageStream
  };
}
