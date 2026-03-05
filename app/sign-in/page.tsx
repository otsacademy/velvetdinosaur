import { Suspense } from 'react';
import { AuthForm } from '@/components/auth/auth-form';

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--vd-bg)] px-4">
      <div className="w-full max-w-md rounded-[calc(var(--vd-radius)+6px)] border border-[var(--vd-border)] bg-white/80 p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="mt-2 text-sm text-[var(--vd-muted-fg)]">Access the Velvet Dinosaur editor.</p>
        <div className="mt-6">
          <Suspense fallback={<div className="text-sm text-[var(--vd-muted-fg)]">Loading...</div>}>
            <AuthForm mode="sign-in" />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
