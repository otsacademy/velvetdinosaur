import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminFromHeaders } from '@/lib/support/auth';
import { getSupportTicketById, listSupportTicketRatings, submitSupportTicketRating } from '@/lib/support/tickets';

const RatingSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional()
});

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: Params) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const id = (await params).id;
  const [ticket, items] = await Promise.all([getSupportTicketById(id), listSupportTicketRatings(id, 120)]);
  if (!ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
  }
  return NextResponse.json({ items });
}

export async function POST(request: Request, { params }: Params) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = RatingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const id = (await params).id;
  const item = await submitSupportTicketRating({
    ticketId: id,
    actorUserId: admin.id,
    actorEmail: admin.email,
    actorName: admin.name,
    actorRole: admin.actorRole,
    rating: parsed.data.rating,
    comment: parsed.data.comment
  });
  if (!item) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
  }
  return NextResponse.json({ item });
}
