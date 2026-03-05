import SignupClient from '@/components/auth/signup-client';

export default function SignUpPage() {
  // Render a client-side handler so the invite token from the query string is respected
  // even when the page is prerendered.
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--vd-bg)] px-4">
      <div className="w-full max-w-md rounded-[calc(var(--vd-radius)+6px)] border border-[var(--vd-border)] bg-white/80 p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Create an account</h1>
        <p className="mt-2 text-sm text-[var(--vd-muted-fg)]">Use your invite link to continue.</p>
        <div className="mt-6">
          <SignupClient />
        </div>
      </div>
    </main>
  );
}
