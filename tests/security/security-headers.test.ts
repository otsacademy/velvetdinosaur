import { describe, expect, test } from 'bun:test';
import { NextRequest } from 'next/server';
import { proxy } from '@/proxy';
import { securityHeaders, type SecurityHeaderEnv, type SiteSecurityHeaders } from '@/lib/security-headers';
import { summarizeCspReport } from '@/lib/security/csp-reports';

const EDITOR_FRAMING = "frame-ancestors 'self' https://theme.velvetdinosaur.com";
const STATIC = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'x-permitted-cross-domain-policies': 'none',
  'cross-origin-opener-policy': 'same-origin'
};
const production: SecurityHeaderEnv = { production: true, ga4: 'G-TEST', clarity: 'clarity-test' };
const template: SiteSecurityHeaders = { themeEditorPreview: true };

function get(path: string, accept = 'text/html', host = 'velvetdinosaur.com') {
  return proxy(new NextRequest(`https://${host}${path}`, { headers: { accept, host } }));
}

describe('security headers through the proxy', () => {
  test('a public page gets the static headers and frame protection that lets only the theme editor frame it', async () => {
    const response = await get('/');
    for (const [name, value] of Object.entries(STATIC)) expect(response.headers.get(name)).toBe(value);
    expect(response.headers.get('content-security-policy')).toBe(EDITOR_FRAMING);
    expect(response.headers.get('x-frame-options')).toBeNull();
  });

  test('an API route gets the same headers', async () => {
    const response = await get('/api/vd-telemetry', 'application/json');
    for (const [name, value] of Object.entries(STATIC)) expect(response.headers.get(name)).toBe(value);
    expect(response.headers.get('content-security-policy')).toBe(EDITOR_FRAMING);
  });

  test('uploaded files keep their sandbox and emailed links keep no-referrer', async () => {
    const file = await get('/api/assets/file', '*/*');
    expect(file.headers.get('content-security-policy')).toBe("sandbox; default-src 'none'; base-uri 'none'; form-action 'none'");
    expect(file.headers.get('x-content-type-options')).toBe('nosniff');
    expect(file.headers.get('cross-origin-opener-policy')).toBe('same-origin');
    const link = await get('/newsletter/unsubscribe');
    expect(link.headers.get('referrer-policy')).toBe('no-referrer');
  });

  test('the NFC redirects and the demo host get them too', async () => {
    const nfc = await get('/NFC');
    expect(nfc.status).toBe(308);
    expect(nfc.headers.get('location')).toEndWith('/nfc');
    expect(nfc.headers.get('content-security-policy')).toBe(EDITOR_FRAMING);
    const demo = await get('/', 'text/html', 'demo.velvetdinosaur.com');
    expect(demo.headers.get('x-middleware-rewrite')).toEndWith('/demo');
    expect(demo.headers.get('x-content-type-options')).toBe('nosniff');
  });
});

describe('security header rules', () => {
  test('production adds HSTS for this host only and the report-only policy', () => {
    const headers = securityHeaders('/', template, production);
    expect(headers['Strict-Transport-Security']).toBe('max-age=31536000');
    const policy = headers['Content-Security-Policy-Report-Only'];
    for (const directive of [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline' https:",
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.clarity.ms https://scripts.clarity.ms",
      "connect-src 'self' https: wss:",
      "frame-src 'self' https:",
      'report-uri /api/csp-report'
    ]) {
      expect(policy.split('; ')).toContain(directive);
    }
    // Enforced already; Safari logs an error for frame-ancestors in a report-only policy.
    expect(policy).not.toContain('frame-ancestors');
    expect(headers['Content-Security-Policy']).toBe(EDITOR_FRAMING);
    expect(securityHeaders('/', template, { production: false })['Content-Security-Policy-Report-Only']).toBeUndefined();
  });

  test('analytics hosts are allowed only when their ids are set', () => {
    const policy = securityHeaders('/', template, { production: true })['Content-Security-Policy-Report-Only'];
    expect(policy).toContain("script-src 'self' 'unsafe-inline'; ");
    expect(policy).not.toContain('googletagmanager');
    const all = securityHeaders('/', template, { ...production, metaPixel: '1', linkedIn: '2' })['Content-Security-Policy-Report-Only'];
    expect(all).toContain('https://connect.facebook.net');
    expect(all).toContain('https://snap.licdn.com');
  });

  test('site sources, the configured editor origin and headers nginx already sends', () => {
    const site: SiteSecurityHeaders = {
      themeEditorPreview: true,
      sentByWebServer: ['Strict-Transport-Security'],
      reportOnlySources: { 'script-src': ['https://www.youtube.com'], 'media-src': ['https:'] }
    };
    const headers = securityHeaders('/', site, { ...production, themeEditorOrigin: 'http://localhost:3015/editor' });
    expect(headers['Strict-Transport-Security']).toBeUndefined();
    expect(headers['Content-Security-Policy']).toBe(`${EDITOR_FRAMING} http://localhost:3015`);
    expect(headers['Content-Security-Policy-Report-Only']).toContain("https://scripts.clarity.ms https://www.youtube.com; ");
    expect(headers['Content-Security-Policy-Report-Only']).toEndWith("; media-src 'self' https:; report-uri /api/csp-report");
    const ignored = securityHeaders('/', template, { production: true, themeEditorOrigin: 'javascript:alert(1)' });
    expect(ignored['Content-Security-Policy']).toBe(EDITOR_FRAMING);
  });

  test('a site the editor does not frame sends SAMEORIGIN, unless nginx already does', () => {
    const own = securityHeaders('/', { themeEditorPreview: false }, production);
    expect(own['X-Frame-Options']).toBe('SAMEORIGIN');
    expect(own['Content-Security-Policy']).toBe("frame-ancestors 'self'");
    const nginx = securityHeaders('/', {
      themeEditorPreview: false,
      sentByWebServer: ['X-Frame-Options', 'Content-Security-Policy', 'X-Content-Type-Options', 'Referrer-Policy', 'Strict-Transport-Security']
    }, production);
    expect(Object.keys(nginx).sort()).toEqual([
      'Content-Security-Policy-Report-Only', 'Cross-Origin-Opener-Policy', 'Permissions-Policy', 'X-Permitted-Cross-Domain-Policies'
    ]);
  });

  test('uploaded files get no page policy', () => {
    const headers = securityHeaders('/api/assets/file', template, production);
    expect(headers['Content-Security-Policy']).toBeUndefined();
    expect(headers['Content-Security-Policy-Report-Only']).toBeUndefined();
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
  });
});

describe('report-only violation reports', () => {
  test('keep the directive and the blocked scheme and host, nothing else', () => {
    const legacy = JSON.stringify({ 'csp-report': {
      'document-uri': 'https://site.example/newsletter/confirm?token=secret',
      'violated-directive': 'script-src-elem',
      'effective-directive': 'script-src-elem',
      'blocked-uri': 'https://Tracker.example:8443/collect?visitor=alex@example.test'
    } });
    expect(summarizeCspReport(legacy)).toEqual({ directive: 'script-src-elem', blocked: 'https://tracker.example:8443' });
    const reportingApi = JSON.stringify([{ type: 'csp-violation', body: { effectiveDirective: 'img-src', blockedURL: 'data' } }]);
    expect(summarizeCspReport(reportingApi)).toEqual({ directive: 'img-src', blocked: 'data' });
  });

  test('reduce keywords, extensions and odd values to a few fixed words', () => {
    const blocked = (value: string) =>
      summarizeCspReport(JSON.stringify({ 'csp-report': { 'effective-directive': 'script-src', 'blocked-uri': value } }))?.blocked;
    expect(blocked('inline')).toBe('inline');
    expect(blocked('eval')).toBe('eval');
    expect(blocked('chrome-extension://abcdef/script.js')).toBe('extension');
    expect(blocked('blob:https://site.example/1234')).toBe('blob');
    expect(blocked('')).toBe('none');
    expect(blocked('not a url')).toBe('other');
  });

  test('refuse anything that is not a known directive or not JSON', () => {
    expect(summarizeCspReport('{"csp-report":{"effective-directive":"made-up-src","blocked-uri":"https://a.example"}}')).toBeNull();
    expect(summarizeCspReport('not json')).toBeNull();
    expect(summarizeCspReport('[]')).toBeNull();
    expect(summarizeCspReport('{"other":{}}')).toBeNull();
  });
});
