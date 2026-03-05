import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/audit.ts');

import { connectDB } from '@/lib/db';
import { AuditLog } from '@/models/AuditLog';

type AuditInput = {
  action: string;
  actorUserId?: string | null;
  targetUserId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function logAudit(entry: AuditInput) {
  await connectDB();
  await AuditLog.create({
    action: entry.action,
    actorUserId: entry.actorUserId ?? null,
    targetUserId: entry.targetUserId ?? null,
    metadata: entry.metadata || {}
  });
}
