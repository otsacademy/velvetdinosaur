import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/security/asset-live-capture.ts');

import type { NextRequest } from 'next/server';
import { isSafeVideoSlug } from '@/lib/video-project/slug';
import { validateVideoLiveCaptureToken } from '@/lib/video-live-capture/token';

type AssetLiveCaptureRequest = Request | NextRequest;

function readCookie(request: AssetLiveCaptureRequest, name: string) {
  const nextRequest = request as NextRequest & {
    cookies?: { get?: (cookieName: string) => { value?: string } | undefined };
  };
  const cookieValue = nextRequest.cookies?.get?.(name)?.value;
  if (cookieValue) return cookieValue.trim();

  const rawCookieHeader = request.headers.get('cookie') || '';
  for (const pair of rawCookieHeader.split(';')) {
    const [cookieName, ...cookieValueParts] = pair.trim().split('=');
    if (cookieName !== name) continue;
    return decodeURIComponent(cookieValueParts.join('=')).trim();
  }
  return '';
}

export async function isAssetLiveCaptureAllowed(request: AssetLiveCaptureRequest) {
  const url = new URL(request.url);
  if (url.searchParams.get('capture') !== '1' || url.searchParams.get('live') !== '1') return false;

  const videoSlug = String(url.searchParams.get('video') || '').trim();
  if (!isSafeVideoSlug(videoSlug)) return false;

  const token =
    String(request.headers.get('x-vd-live-capture-token') || '').trim() ||
    readCookie(request, 'vd_live_capture_token');
  if (!token) return false;

  const referer = request.headers.get('referer') || '';
  let refPath = '';
  try {
    refPath = referer ? new URL(referer).pathname : '';
  } catch {
    refPath = '';
  }
  if (!refPath.startsWith('/edit')) return false;

  const result = await validateVideoLiveCaptureToken({ token, slug: videoSlug, path: refPath });
  return result.ok;
}
