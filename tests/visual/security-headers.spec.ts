import { chromium, expect, test, type Browser } from '@playwright/test';

// The proxy's security headers (lib/security-headers.ts, SECURITY_HEADERS in proxy.ts) over real HTTP from
// `next start`, and what a browser does with them.
const EDITOR_ORIGIN = 'https://theme.velvetdinosaur.com';
const FRAMING = `frame-ancestors 'self' ${EDITOR_ORIGIN}`;
const HSTS = 'max-age=31536000';
const STATIC_HEADERS: Record<string, string> = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'x-permitted-cross-domain-policies': 'none',
  'cross-origin-opener-policy': 'same-origin'
};
const FILE_SANDBOX = "sandbox; default-src 'none'; base-uri 'none'; form-action 'none'";

function expectStaticHeaders(headers: Record<string, string>) {
  for (const [name, value] of Object.entries(STATIC_HEADERS)) expect(headers[name], name).toBe(value);
}

test('a public page, an API route and an uploaded file carry the security headers', async ({ request }) => {
  const page = await request.get('/');
  expect(page.status()).toBe(200);
  const headers = page.headers();
  expectStaticHeaders(headers);
  expect(headers['content-security-policy']).toBe(FRAMING);
  expect(headers['x-frame-options']).toBeUndefined();
  expect(headers['strict-transport-security']).toBe(HSTS);
  const policy = (headers['content-security-policy-report-only'] || '').split('; ');
  for (const directive of ["default-src 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'self'", 'report-uri /api/csp-report']) {
    expect(policy).toContain(directive);
  }
  expect(policy.find((directive) => directive.startsWith('script-src '))).toContain("'unsafe-inline'");

  const api = await request.get('/api/vd-telemetry');
  expect(api.status()).toBe(405);
  expectStaticHeaders(api.headers());
  expect(api.headers()['content-security-policy']).toBe(FRAMING);

  const file = await request.get('/api/assets/file');
  expect(file.status()).toBe(400);
  expectStaticHeaders(file.headers());
  expect(file.headers()['content-security-policy']).toBe(FILE_SANDBOX);
  expect(file.headers()['content-security-policy-report-only']).toBeUndefined();

  // Where browsers send what the report-only policy would have blocked: always 204, whatever is sent.
  const report = await request.post('/api/csp-report', {
    headers: { 'content-type': 'application/csp-report' },
    data: JSON.stringify({ 'csp-report': { 'effective-directive': 'img-src', 'blocked-uri': 'https://images.invalid/a.png' } })
  });
  expect(report.status()).toBe(204);
  expectStaticHeaders(report.headers());
});

test('the theme editor may frame a page and another site may not', async ({ baseURL, browserName }) => {
  test.skip(browserName !== 'chromium', 'framing is checked in Chromium');
  const target = new URL('/', baseURL).toString();
  // Chromium refuses a public page framing this loopback test server before the site's own policy is consulted
  // (local network access). Production pages are public, so that check is off in this browser only.
  const browser: Browser = await chromium.launch({
    args: ['--disable-features=LocalNetworkAccessChecks,PrivateNetworkAccessForNavigations,BlockInsecurePrivateNetworkRequests']
  });
  try {
    const frameFrom = async (parentOrigin: string) => {
      const page = await browser.newPage();
      const parent = `${parentOrigin}/security-headers-frame-check`;
      // The parent page is answered here and never fetched; only the framed page comes from the site.
      await page.route(parent, (route) =>
        route.fulfill({ contentType: 'text/html', body: `<!doctype html><iframe src="${target}"></iframe>` })
      );
      await page.goto(parent, { waitUntil: 'load' });
      const frame = page.frames().find((candidate) => candidate !== page.mainFrame());
      const result = { url: frame?.url() ?? '', text: '' };
      if (frame && result.url === target) result.text = (await frame.locator('body').textContent()) ?? '';
      await page.close();
      return result;
    };
    const editor = await frameFrom(EDITOR_ORIGIN);
    expect(editor.url).toBe(target);
    expect(editor.text.length).toBeGreaterThan(0);
    const own = await frameFrom(new URL(target).origin);
    expect(own.url).toBe(target);
    const other = await frameFrom('https://another-site.example');
    expect(other.url).not.toBe(target);
  } finally {
    await browser.close();
  }
});

test('the home page raises no report-only policy violations', async ({ page }) => {
  await page.addInitScript(() => {
    const store = window as unknown as { __cspViolations: string[] };
    store.__cspViolations = [];
    document.addEventListener('securitypolicyviolation', (event) => {
      store.__cspViolations.push(`${event.disposition} ${event.effectiveDirective} ${event.blockedURI}`);
    });
  });
  await page.goto('/', { waitUntil: 'load' });
  // Scrolling is what loads the site's analytics and lazy media; their sources must be allowed too.
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => (window as unknown as { __cspViolations: string[] }).__cspViolations)).toEqual([]);
});
