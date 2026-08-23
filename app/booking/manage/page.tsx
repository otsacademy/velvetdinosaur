import type { Metadata } from 'next';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { ManageBookingClient } from '@/components/booking/manage-booking.client';

export const metadata: Metadata = {
  title: 'Manage your booking',
  robots: { index: false, follow: false }
};

export default function BookingManagePage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <BookingManageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function BookingManageContent({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  await connection();
  const { token } = await searchParams;
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col gap-6 px-6 py-16">
      <h1 className="text-2xl font-bold tracking-tight">Manage your booking</h1>
      <ManageBookingClient token={(token ?? '').trim()} />
    </main>
  );
}
