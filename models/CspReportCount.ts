import { Schema, model, models } from 'mongoose';

// How often browsers reported that the report-only content security policy would have blocked something, per
// day, directive and blocked source (scheme and host only). Nothing about the visitor or the page is stored.
const schema = new Schema({
  day: { type: String, required: true },
  directive: { type: String, required: true },
  blocked: { type: String, required: true },
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true }
}, { collection: 'csp_report_counts', versionKey: false });
schema.index({ day: 1, directive: 1, blocked: 1 }, { unique: true });
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const CspReportCount = models.CspReportCount || model('CspReportCount', schema);
