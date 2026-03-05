import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/AuditLog.ts');

import { Schema, model, models } from 'mongoose';

const AuditLogSchema = new Schema(
  {
    action: { type: String, required: true },
    actorUserId: { type: String, default: null },
    targetUserId: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: () => new Date() }
  },
  {
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        const safeRet = ret as {
          _id?: { toString?: () => string } | string;
          id?: string;
          __v?: unknown;
        };
        const rawId = safeRet._id;
        safeRet.id = typeof rawId === 'string' ? rawId : rawId?.toString?.();
        delete safeRet._id;
        delete safeRet.__v;
      }
    }
  }
);

AuditLogSchema.index({ action: 1, createdAt: -1 });

export const AuditLog = models.AuditLog || model('AuditLog', AuditLogSchema);
