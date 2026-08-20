import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/newsletter/suppression.ts');

import { connectDB } from '@/lib/db';
import { NewsletterSuppression } from '@/models/NewsletterSuppression';
import { clean, normalizeEmail } from '@/lib/newsletter/shared';

export async function upsertNewsletterSuppression(input: {
  email: string;
  source?: string;
  reason?: string;
  eventType?: string;
  messageId?: string;
}) {
  await connectDB();
  const email = normalizeEmail(input.email);
  if (!email) return null;

  const now = new Date();
  return NewsletterSuppression.findOneAndUpdate(
    { email },
    {
      $set: {
        active: true,
        source: clean(input.source),
        reason: clean(input.reason),
        eventType: clean(input.eventType),
        messageId: clean(input.messageId),
        lastEventAt: now
      },
      $setOnInsert: {
        suppressedAt: now
      }
    },
    { upsert: true, new: true }
  ).lean();
}

export async function clearNewsletterSuppression(input: {
  email: string;
  source?: string;
  reason?: string;
}) {
  await connectDB();
  const email = normalizeEmail(input.email);
  if (!email) return { updated: 0 };

  const result = await NewsletterSuppression.updateOne(
    { email, active: true },
    {
      $set: {
        active: false,
        source: clean(input.source) || 'manual-clear',
        reason: clean(input.reason),
        lastEventAt: new Date()
      }
    }
  );
  return { updated: Math.max(0, Number(result.modifiedCount || 0)) };
}

export async function isNewsletterSuppressedEmail(email: string) {
  await connectDB();
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  const row = await NewsletterSuppression.findOne(
    { email: normalized, active: true },
    { _id: 1 }
  ).lean();
  return Boolean(row);
}

export async function mapSuppressedEmails(emails: string[]) {
  await connectDB();
  const normalized = Array.from(new Set(emails.map((value) => normalizeEmail(value)).filter(Boolean)));
  if (!normalized.length) return new Set<string>();

  const rows = (await NewsletterSuppression.find(
    { email: { $in: normalized }, active: true },
    { email: 1 }
  ).lean()) as Array<{ email?: string }>;

  return new Set(rows.map((row) => normalizeEmail(row.email)).filter(Boolean));
}

export async function getNewsletterSuppressionCounts() {
  await connectDB();
  const [active, total] = await Promise.all([
    NewsletterSuppression.countDocuments({ active: true }),
    NewsletterSuppression.countDocuments({})
  ]);
  return { active, total };
}
