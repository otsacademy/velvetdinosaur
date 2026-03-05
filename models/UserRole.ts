import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('models/UserRole.ts');

import { Schema, model, models } from 'mongoose';

const UserRoleSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' }
  },
  {
    timestamps: true,
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

export const UserRole = models.UserRole || model('UserRole', UserRoleSchema);
