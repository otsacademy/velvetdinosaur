import { z } from 'zod';
import { sendContactEmail } from '@/lib/email';

const contactSchema = z.object({
  name: z.string().trim().min(1).max(120).optional().nullable(),
  topic: z.string().trim().min(1).max(120).optional().nullable(),
  email: z.string().trim().email(),
  message: z.string().trim().min(3).max(4000)
});

function parseBody(request: Request) {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return request.json().catch(() => ({}));
  }
  return request.formData().then((form) => Object.fromEntries(form.entries()));
}

export async function POST(request: Request) {
  const body = await parseBody(request);
  const result = contactSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { error: 'Invalid contact form submission.' },
      { status: 400 }
    );
  }

  const payload = result.data;
  await sendContactEmail({
    name: payload.name || null,
    topic: payload.topic || null,
    email: payload.email,
    message: payload.message
  });

  return Response.json({ ok: true });
}
