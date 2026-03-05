import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/Invite.ts');

import { Schema, model, models } from 'mongoose';

const InviteSchema = new Schema(
  {
    tokenHash: { type: String, required: true, unique: true },
    tokenShownAt: { type: Date, default: null },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null },
    createdByUserId: { type: String, default: null },
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

InviteSchema.index({ expiresAt: 1 });

export const Invite = models.Invite || model('Invite', InviteSchema);
