import { NextResponse } from 'next/server';
import { checkDurableRateLimit } from '@/lib/security/durable-rate-limit';
import { CSP_REPORT_MAX_BYTES, recordCspReport, summarizeCspReport } from '@/lib/security/csp-reports';
import { getRequestIp } from '@/lib/security/rate-limit';

const REPORT_TYPES = new Set(['application/csp-report', 'application/reports+json', 'application/json']);

async function readLimited(request: Request) {
  if (Number(request.headers.get('content-length') || '0') > CSP_REPORT_MAX_BYTES) return null;
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > CSP_REPORT_MAX_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf8');
}

// Browsers post report-only policy violations here. The answer is always 204: a browser does nothing with it,
// and nobody learns whether a report was counted.
export async function POST(request: Request) {
  const type = (request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  const raw = REPORT_TYPES.has(type) ? await readLimited(request).catch(() => null) : null;
  const summary = raw ? summarizeCspReport(raw) : null;
  if (summary) {
    try {
      const perAddress = await checkDurableRateLimit({
        id: 'csp-report',
        key: getRequestIp(request.headers) || 'unknown',
        limit: 20,
        windowMs: 10 * 60 * 1000
      });
      if (perAddress.ok) await recordCspReport(summary);
    } catch {
      // Counting is best effort; a report is never worth an error.
    }
  }
  return new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
}
