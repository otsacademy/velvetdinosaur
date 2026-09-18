import { assertServerOnly } from '@/lib/_server/guard';
import mongoose, { Schema, model } from 'mongoose';
assertServerOnly('models/AssetUploadReceipt.ts');

// A presign receipt is issued by this database before an upload. Completion
// cannot turn knowledge of somebody else's bucket key into ownership.
const AssetUploadReceiptSchema = new Schema({
  key: { type: String, required: true, unique: true },
  bucket: { type: String, required: true },
  ownerSite: { type: String, required: true },
  userId: { type: String, required: true },
  mime: { type: String, required: true },
  expiresAt: { type: Date, required: true, expires: 0 },
}, { timestamps: true });
export const AssetUploadReceipt = mongoose.models.AssetUploadReceipt || model('AssetUploadReceipt', AssetUploadReceiptSchema);
