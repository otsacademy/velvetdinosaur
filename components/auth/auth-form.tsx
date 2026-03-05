'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

type AuthFormProps = {
  mode: 'sign-in' | 'sign-up';
  inviteToken?: string | null;
  inviteEmail?: string | null;
};

export function AuthForm({ mode, inviteToken, inviteEmail }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const adminOnly = process.env.NEXT_PUBLIC_ADMIN_ONLY === 'true';
  const next = searchParams.get('next') || (adminOnly ? '/admin/sites' : '/edit');

  const [email, setEmail] = useState(inviteEmail || '');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'sign-up') {
        if (!inviteToken) {
          setError('An invite is required to sign up.');
          return;
        }
        const res = await fetch('/api/invite/accept', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ token: inviteToken, email, password, name })
        });
        const json = await res.json();
        if (!res.ok || json?.error) {
          setError(json?.error || 'Sign up failed');
          return;
        }
        setSuccess('Account created. Check your email for the verification link.');
      } else {
        const res = await authClient.signIn.email({
          email,
          password
        });
        if (res?.error) {
          setError(res.error.message || 'Sign in failed');
        } else {
          router.push(next);
        }
      }
    } catch (err) {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {mode === 'sign-up' ? (
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
          />
        </div>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          readOnly={Boolean(inviteEmail)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
          required
        />
      </div>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      {success ? <p className="text-sm text-green-600">{success}</p> : null}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Please wait...' : mode === 'sign-up' ? 'Create account' : 'Sign in'}
      </Button>
      <p className="text-center text-xs text-[var(--vd-muted-fg)]">
        {mode === 'sign-up' ? (
          <>
            Already have an account? <Link href="/sign-in">Sign in</Link>
          </>
        ) : (
          <>
            Need an invite? <Link href="/sign-up">Request access</Link>
          </>
        )}
      </p>
    </form>
  );
}
