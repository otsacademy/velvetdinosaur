import { z } from 'zod';
import { createAnalyticsLead, forwardAnalyticsEvent } from '@/lib/analytics';
import { sendContactEmail } from '@/lib/email';

const contactSchema = z.object({
  name: z.string().trim().min(1).max(120).optional().nullable(),
  topic: z.string().trim().min(1).max(120).optional().nullable(),
  email: z.string().trim().email(),
  message: z.string().trim().min(3).max(4000),
  formId: z.string().trim().min(1).max(120).optional().nullable()
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

  await Promise.allSettled([
    createAnalyticsLead(request, {
      leadType: 'contact_form',
      leadName: 'contact_enquiry',
      sourceRoute: '/api/contact',
      status: 'new',
      contact: {
        name: payload.name || undefined,
        email: payload.email
      },
      topic: payload.topic || undefined,
      messagePreview: payload.message.slice(0, 280),
      metadata: {
        formId: payload.formId || 'contact_form',
        delivery: 'contact_route'
      }
    }),
    forwardAnalyticsEvent(request, {
      eventType: 'conversion',
      eventName: 'form_submit_success',
      eventCategory: 'form',
      formId: payload.formId || 'contact_form',
      conversionName: 'contact_submit_success',
      metadata: {
        topic: payload.topic || null
      }
    })
  ]);

  return Response.json({ ok: true });
}
