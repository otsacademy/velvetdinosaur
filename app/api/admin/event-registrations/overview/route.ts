import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getEventRegistrationCampaignComposerDefaults } from '@/lib/event-registration/campaigns';
import { listLocalRegistrationEvents } from '@/lib/event-registration/registrations';
import { requireAdminFromHeaders } from '@/lib/newsletter/auth';
import { EventRegistration } from '@/models/EventRegistration';
import { EventRegistrationCampaign } from '@/models/EventRegistrationCampaign';

export async function GET(request: Request) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectDB();
  const [events, pending, confirmed, cancelled, draft, queued, sending, completed, cancelledCampaigns, updateDefaults, joiningDefaults] =
    await Promise.all([
      listLocalRegistrationEvents(200),
      EventRegistration.countDocuments({ status: 'pending' }),
      EventRegistration.countDocuments({ status: 'confirmed' }),
      EventRegistration.countDocuments({ status: 'cancelled' }),
      EventRegistrationCampaign.countDocuments({ status: 'draft' }),
      EventRegistrationCampaign.countDocuments({ status: 'queued' }),
      EventRegistrationCampaign.countDocuments({ status: 'sending' }),
      EventRegistrationCampaign.countDocuments({ status: 'completed' }),
      EventRegistrationCampaign.countDocuments({ status: 'cancelled' }),
      getEventRegistrationCampaignComposerDefaults('update'),
      getEventRegistrationCampaignComposerDefaults('joining-instructions')
    ]);

  return NextResponse.json({
    counts: {
      localEvents: events.length,
      pending,
      confirmed,
      cancelled
    },
    campaignStatus: {
      draft,
      queued,
      sending,
      completed,
      cancelled: cancelledCampaigns
    },
    defaults: {
      update: updateDefaults,
      'joining-instructions': joiningDefaults
    }
  });
}
