'use client';

import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthForm } from '@/components/auth/auth-form';

function InviteForm() {
  const searchParams = useSearchParams();
  const inviteToken = useMemo(() => (searchParams.get('invite') || '').trim(), [searchParams]);
  const hasInvite = inviteToken.length > 0;

  if (!hasInvite) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--vd-border)] bg-white p-4 text-sm text-[var(--vd-muted-fg)]">
        You need an invite link to create an account. Ask an administrator to generate one for you.
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="text-sm text-[var(--vd-muted-fg)]">Loading...</div>}>
      <AuthForm mode="sign-up" inviteToken={inviteToken} inviteEmail={null} />
    </Suspense>
  );
}

export default function SignupClient() {
  return (
    <Suspense fallback={<div className="text-sm text-[var(--vd-muted-fg)]">Loading...</div>}>
      <InviteForm />
    </Suspense>
  );
}
