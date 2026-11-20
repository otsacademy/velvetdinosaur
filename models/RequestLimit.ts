import { Schema, model, models } from 'mongoose';
const schema = new Schema({
  _id: { type: String, required: true },
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true }
});
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const RequestLimit = models.RequestLimit || model('RequestLimit', schema);
