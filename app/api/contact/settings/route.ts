import { unstable_noStore } from 'next/cache';
import { z } from 'zod';
import { authorize } from '@/lib/authz';
import { connectDB } from '@/lib/db';
import { ContactSettings } from '@/models/ContactSettings';
import { defaultContactEmailTemplates } from '@/lib/contact-email-templates';

const templateSchema = z.object({
  html: z.string().min(1).max(20000),
  text: z.string().min(1).max(20000)
});

export async function GET(request: Request) {
  unstable_noStore();
  const gate = await authorize(request, 'role:admin');
  if (!gate.ok) return gate.response;

  await connectDB();
  const doc = (await ContactSettings.findOne({}).lean()) as
    | { contactEmailHtml?: string; contactEmailText?: string; updatedAt?: Date }
    | null;
  const defaults = await defaultContactEmailTemplates();
  return Response.json({
    html: doc?.contactEmailHtml || defaults.html,
    text: doc?.contactEmailText || defaults.text,
    defaultHtml: defaults.html,
    defaultText: defaults.text,
    updatedAt: doc?.updatedAt || null
  });
}

export async function PUT(request: Request) {
  const gate = await authorize(request, 'role:admin');
  if (!gate.ok) return gate.response;

  const payload = await request.json().catch(() => ({}));
  const parsed = templateSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid template payload.' }, { status: 400 });
  }

  await connectDB();
  const updated = await ContactSettings.findOneAndUpdate(
    {},
    {
      contactEmailHtml: parsed.data.html,
      contactEmailText: parsed.data.text
    },
    { upsert: true, new: true }
  );

  return Response.json({
    ok: true,
    updatedAt: updated.updatedAt
  });
}
