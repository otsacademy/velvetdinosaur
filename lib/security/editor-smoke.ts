import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/security/editor-smoke.ts');

const EDITOR_SMOKE_TOKEN = (process.env.VD_EDITOR_SMOKE_TOKEN || '').trim();
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const ALLOW_IN_PRODUCTION = process.env.VD_ALLOW_EDITOR_SMOKE_IN_PRODUCTION === 'true';

let warnedProductionToken = false;

function isSmokeEnabledInternal() {
  if (!EDITOR_SMOKE_TOKEN) return false;
  if (!IS_PRODUCTION) return true;
  if (ALLOW_IN_PRODUCTION) return true;
  if (!warnedProductionToken) {
    warnedProductionToken = true;
    console.warn(
      '[security] Ignoring VD_EDITOR_SMOKE_TOKEN in production. Set VD_ALLOW_EDITOR_SMOKE_IN_PRODUCTION=true only for emergency diagnostics.'
    );
  }
  return false;
}

export function isEditorSmokeEnabled() {
  return isSmokeEnabledInternal();
}

export function isEditorSmokeRequest(headersInit?: HeadersInit | null) {
  if (!isSmokeEnabledInternal() || !headersInit) return false;
  const headers = headersInit instanceof Headers ? headersInit : new Headers(headersInit);
  const token = headers.get('x-vd-editor-smoke');
  return Boolean(token && token === EDITOR_SMOKE_TOKEN);
}

export function resolveEditorSmokeSession(headersInit?: HeadersInit | null) {
  if (!isEditorSmokeRequest(headersInit)) return null;
  return {
    user: {
      id: 'editor-smoke',
      email: 'editor-smoke@local'
    }
  };
}
