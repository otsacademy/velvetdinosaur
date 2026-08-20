'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, UserCircle2 } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { clearAllStoredReviewTokens } from '@/lib/review/review-token-storage';
import { resolveAssetImageUrl } from '@/lib/uploads';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

type SessionControlsProps = {
  className?: string;
  showAccountLink?: boolean;
  showIdentity?: boolean;
  variant?: 'pill' | 'inline' | 'sidebar';
};

type ProfilePayload = {
  profile?: {
    displayName?: string;
    avatarUrl?: string;
  };
  user?: {
    email?: string | null;
  };
};

function initials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'AS';
}

export function SessionControls({
  className,
  showAccountLink = true,
  showIdentity = true,
  variant = 'pill'
}: SessionControlsProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('');

  useEffect(() => {
    if (!showIdentity) return;
    let active = true;
    void (async () => {
      try {
        const response = await fetch('/api/account/profile', { cache: 'no-store', credentials: 'include' });
        if (!response.ok) return;
        const payload = (await response.json().catch(() => ({}))) as ProfilePayload;
        if (!active) return;
        setProfileName((payload.profile?.displayName || '').trim());
        setProfileEmail((payload.user?.email || '').trim());
        setProfileAvatar((payload.profile?.avatarUrl || '').trim());
      } catch {
        // Silent fallback: controls still work without identity details.
      }
    })();

    return () => {
      active = false;
    };
  }, [showIdentity]);

  const resolvedIdentity = useMemo(() => {
    return profileName || profileEmail || 'Account';
  }, [profileEmail, profileName]);

  const avatarSrc = useMemo(() => {
    if (!profileAvatar) return '';
    return resolveAssetImageUrl(profileAvatar, { width: 96, height: 96, fit: 'cover' });
  }, [profileAvatar]);

  async function handleSignOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    clearAllStoredReviewTokens();
    try {
      const signOut = (authClient as unknown as { signOut?: (input?: unknown) => Promise<unknown> }).signOut;
      if (typeof signOut === 'function') {
        await signOut({});
      } else {
        await fetch('/api/auth/sign-out', { method: 'POST' });
      }
    } catch {
      await fetch('/api/auth/sign-out', { method: 'POST' }).catch(() => null);
    } finally {
      router.push('/sign-in');
      router.refresh();
      setIsSigningOut(false);
    }
  }

  const isSidebar = variant === 'sidebar';
  const containerClassName =
    variant === 'inline'
      ? 'flex items-center gap-2'
      : isSidebar
        ? 'flex flex-col gap-2 rounded-xl bg-white/8 p-3'
        : 'flex items-center gap-2 rounded-full border border-border/70 bg-background/95 px-2 py-1 shadow-sm backdrop-blur';
  const identityClassName = isSidebar
    ? 'flex items-center gap-2 rounded-lg bg-white/10 px-2.5 py-2 text-white'
    : 'flex items-center gap-2 rounded-full bg-[var(--vd-muted)]/70 px-2.5 py-1.5 text-[var(--vd-fg)]';
  const accountButtonClassName = isSidebar
    ? 'h-8 rounded-lg px-3 text-xs text-white hover:bg-white/15 hover:text-white'
    : 'h-8 rounded-full px-3 text-xs';
  const signOutButtonClassName = isSidebar
    ? 'h-8 rounded-lg border-white/35 bg-white/10 px-3 text-xs text-white hover:bg-white/20 hover:text-white'
    : 'h-8 rounded-full px-3 text-xs';

  return (
    <div className={cn(containerClassName, className)}>
      {showIdentity ? (
        <div className={identityClassName}>
          <Avatar className={cn('h-7 w-7 border', isSidebar ? 'border-white/30' : 'border-border/70')}>
            <AvatarImage src={avatarSrc} alt={resolvedIdentity} className="object-cover" />
            <AvatarFallback className={cn(isSidebar ? 'bg-white/15 text-white' : '')}>
              {initials(resolvedIdentity)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className={cn('truncate text-xs font-semibold', isSidebar ? 'text-white' : 'text-[var(--vd-fg)]')}>
              {resolvedIdentity}
            </p>
            {profileEmail ? (
              <p className={cn('truncate text-[11px]', isSidebar ? 'text-white/75' : 'text-[var(--vd-muted-fg)]')}>
                {profileEmail}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
      {showAccountLink ? (
        <Button size="sm" variant="ghost" asChild className={accountButtonClassName}>
          <Link href="/account">
            <UserCircle2 className="h-4 w-4" />
            Account
          </Link>
        </Button>
      ) : null}
      <Button
        type="button"
        size="sm"
        variant={isSidebar ? 'ghost' : 'outline'}
        className={signOutButtonClassName}
        onClick={handleSignOut}
        disabled={isSigningOut}
      >
        <LogOut className="h-4 w-4" />
        {isSigningOut ? 'Signing out…' : 'Sign out'}
      </Button>
    </div>
  );
}
