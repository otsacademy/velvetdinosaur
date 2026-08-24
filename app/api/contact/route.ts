import { z } from 'zod';
import { createAnalyticsLead, forwardAnalyticsEvent } from '@/lib/analytics';
import { sendContactEmail } from '@/lib/email';
import {
  composeProjectMessage,
  composeQuestionMessage,
  featureLabel
} from '@/lib/enquiry-options';

const projectSchema = z.object({
  business: z.string().trim().min(1).max(160),
  businessType: z.string().trim().max(160).optional().nullable(),
  websiteStatus: z.string().trim().max(40).optional().nullable(),
  websiteUrl: z.string().trim().max(300).optional().nullable(),
  features: z.array(z.string().trim().max(60)).max(30).optional().nullable()
});

const contactSchema = z.object({
  name: z.string().trim().min(1).max(120).optional().nullable(),
  topic: z.string().trim().min(1).max(120).optional().nullable(),
  email: z.string().trim().email(),
  message: z.string().trim().min(3).max(4000),
  formId: z.string().trim().min(1).max(120).optional().nullable(),
  enquiryType: z.enum(['project', 'question']).optional().nullable(),
  contactMethod: z.string().trim().max(40).optional().nullable(),
  phone: z.string().trim().max(60).optional().nullable(),
  project: projectSchema.optional().nullable()
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
  const project = payload.enquiryType === 'project' ? payload.project ?? null : null;
  const message = project
    ? composeProjectMessage(
        { ...project, contactMethod: payload.contactMethod, phone: payload.phone },
        payload.message
      )
    : composeQuestionMessage(payload.contactMethod, payload.phone, payload.message);
  // `topic` is the at-a-glance line in the notification and the lead record.
  const topic = project
    ? `Free preview — ${project.business}`
    : payload.topic || (payload.enquiryType === 'question' ? 'Question' : null);

  await sendContactEmail({
    name: payload.name || null,
    topic,
    email: payload.email,
    message
  });

  await Promise.allSettled([
    createAnalyticsLead(request, {
      leadType: 'contact_form',
      leadName: project ? 'free_preview_request' : 'contact_enquiry',
      sourceRoute: '/api/contact',
      status: 'new',
      contact: {
        name: payload.name || undefined,
        email: payload.email
      },
      topic: topic || undefined,
      messagePreview: message.slice(0, 280),
      metadata: {
        formId: payload.formId || 'contact_form',
        delivery: 'contact_route',
        enquiryType: payload.enquiryType || 'question',
        business: project?.business || null,
        businessType: project?.businessType || null,
        websiteStatus: project?.websiteStatus || null,
        websiteUrl: project?.websiteUrl || null,
        contactMethod: payload.contactMethod || null,
        phone: payload.phone || null,
        features: project?.features?.map(featureLabel).join('; ') || null
      }
    }),
    forwardAnalyticsEvent(request, {
      eventType: 'conversion',
      eventName: 'form_submit_success',
      eventCategory: 'form',
      formId: payload.formId || 'contact_form',
      conversionName: project ? 'free_preview_request' : 'contact_submit_success',
      metadata: {
        topic: topic || null,
        enquiryType: payload.enquiryType || 'question'
      }
    })
  ]);

  return Response.json({ ok: true });
}
