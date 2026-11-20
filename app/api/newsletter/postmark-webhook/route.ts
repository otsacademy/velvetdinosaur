import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { clean } from "@/lib/newsletter/shared";
import { classifyPostmarkEvent } from "@/lib/newsletter/postmark-events";
import { applyPostmarkEvent } from "@/lib/newsletter/postmark-suppression";

function configuredSecret() {
  return (process.env.POSTMARK_NEWSLETTER_WEBHOOK_SECRET || process.env.POSTMARK_WEBHOOK_SECRET || '').trim();
}

function readProvidedSecret(request: Request, url: URL) {
  const direct = request.headers.get('x-webhook-secret') || request.headers.get('x-postmark-webhook-secret');
  if (direct) return direct.trim();
  const bearer = request.headers.get('authorization') || '';
  const match = /^Bearer\s+(.+)$/i.exec(bearer);
  if (match?.[1]) return match[1].trim();
  return clean(url.searchParams.get('secret'));
}


export async function POST(request: Request) {
  const expected = Buffer.from(configuredSecret());
  const provided = Buffer.from(readProvidedSecret(request, new URL(request.url)));
  if (!expected.length || expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const events = Array.isArray(body) ? body : body && typeof body === "object" ? [body] : [];
  if (!events.length || events.length > 100) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  const summary = { received: events.length, processed: 0, ignored: 0 };
  for (const raw of events) {
    const event = classifyPostmarkEvent(raw);
    if (!event || !await applyPostmarkEvent(event)) summary.ignored++;
    else summary.processed++;
  }
  return NextResponse.json(summary, { headers: { "Cache-Control": "no-store" } });
}
