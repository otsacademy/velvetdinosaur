'use client';

import { createAuthClient } from 'better-auth/react';

function resolveAuthBaseUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_BETTERAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL;
}

export const authClient = createAuthClient({
  baseURL: resolveAuthBaseUrl()
});
