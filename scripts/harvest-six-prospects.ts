import { chromium, type BrowserContext, type Page } from 'playwright';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
type SiteConfig = { id: string; name: string; origin: string; seeds?: string[]; crawlLinks?: boolean; discoverSitemaps?: boolean; includeHome?: boolean };
type Candidate = { url: string; source: string; html?: string; status?: number; finalUrl?: string; title?: string; contentType?: string };
type Exclusion = { url: string; reason: string; source: string }; type AssetRef = { url: string; sourcePages: Set<string>; source: Set<string> };
const BROWSER_USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0 Safari/537.36';
const MAX_BODY_BYTES = 100 * 1024 * 1024;
const args = process.argv.slice(2); const refreshArg = args.includes('--refresh'); const directUrls = args.filter((arg) => arg.startsWith('--direct-url=')).map((arg) => arg.slice('--direct-url='.length));
const batchArg = args.find((arg) => arg.startsWith('--batch='))?.slice('--batch='.length) || 'first';
const batches = JSON.parse(await fs.readFile(new URL('prospect-harvest-batches.json', import.meta.url), 'utf8')) as Record<string, { output: string; sites: SiteConfig[] }>;
const batch = batches[batchArg]; if (!batch) throw new Error(`Unknown --batch=${batchArg}`);
const DEFAULT_OUTPUT = path.resolve(`output/playwright/${batch.output}`);
const outputArg = args.find((arg) => arg.startsWith('--output='))?.slice('--output='.length); const siteArg = args.find((arg) => arg.startsWith('--site='))?.slice('--site='.length);
const OUTPUT_ROOT = path.resolve(outputArg || DEFAULT_OUTPUT);
const sites = batch.sites;
const SALUTATION_THEME_PATHS = new Set([
  '/buttons-icons-2/', '/blog/', '/timeline-blog/', '/social-sharing/', '/special-headings/', '/tables/',
  '/tabs-tours/', '/toggles-accordions/', '/standard-blog/', '/icon-boxes/', '/icon-lists/', '/images/',
  '/notice-boxes/', '/pricing-tables/', '/profiles/', '/sidebar/', '/sliders/', '/buttons-icons/',
  '/contact-forms/', '/custom-html-css-js/', '/featured-blocks/', '/gallery/', '/links/', '/shop/',
  '/sample-page/',
]);
function sha(value: string | Buffer) {
  return createHash('sha256').update(value).digest('hex');
}
function sameSite(a: string, b: string) {
  const left = new URL(a).hostname.replace(/^www\./, '');
  const right = new URL(b).hostname.replace(/^www\./, '');
  return left === right;
}
function normalizeUrl(value: string, base: string) {
  const url = new URL(value, base);
  url.hash = '';
  for (const key of [...url.searchParams.keys()]) {
    if (/^(utm_|fbclid|gclid|mc_)/i.test(key)) url.searchParams.delete(key);
  }
  return url.toString();
}

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parsePageLocs(xml: string) {
  return [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].map((match) => decodeXml(match[1].trim()));
}

function parseImageLocs(xml: string) {
  return [...xml.matchAll(/<image:loc>([\s\S]*?)<\/image:loc>/gi)].map((match) =>
    decodeXml(match[1].trim()),
  );
}

function htmlLinks(html: string, pageUrl: string) {
  const links = new Set<string>();
  const declaredBase = html.match(/<base\s+[^>]*href\s*=\s*["']([^"']+)["']/i)?.[1];
  let resolutionBase = pageUrl;
  if (declaredBase) {
    try {
      resolutionBase = new URL(declaredBase, pageUrl).toString();
    } catch {}
  }
  for (const match of html.matchAll(/(?:href|src)\s*=\s*["']([^"'#]+)["']/gi)) {
    try {
      links.add(normalizeUrl(decodeXml(match[1]), resolutionBase));
    } catch {}
  }
  return links;
}

function titleFromHtml(html: string) {
  return decodeXml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').replace(/\s+/g, ' ').trim();
}

function looksLikeDocument(url: string) {
  return /\.(?:avif|bmp|gif|ico|jpe?g|png|svg|webp|pdf|docx?|xlsx?|pptx?|zip|m4v|mov|mp4|webm|mp3|ogg|wav)(?:$|[/?#])/i.test(url);
}
const looksLikeAssetUrl = (url: string) => looksLikeDocument(url) || /\/img(?:\/|$)/i.test(new URL(url).pathname);
function pageDecision(site: SiteConfig, urlValue: string, html = ''): { include: boolean; reason?: string } {
  const url = new URL(urlValue);
  const pathname = url.pathname.replace(/\/{2,}/g, '/');
  if (!sameSite(url.toString(), site.origin)) return { include: false, reason: 'external URL' };
  if (looksLikeAssetUrl(url.toString())) return { include: false, reason: 'direct asset URL' };
  if (/\.(?:css|js|json|xml|txt|woff2?|ttf|eot)(?:$|\?)/i.test(url.toString())) {
    return { include: false, reason: 'non-page resource' };
  }
  if (/\/(?:wp-admin|wp-json|feed)(?:\/|$)/i.test(pathname)) return { include: false, reason: 'system route' };
  if (/\.(?:webmanifest)(?:$|\?)/i.test(pathname)) return { include: false, reason: 'non-page resource' };
  if (/^\/m(?:\/|$)/i.test(pathname)) return { include: false, reason: 'CMS account route' };
  if (/^\/xmlrpc\.php/i.test(pathname)) return { include: false, reason: 'WordPress system endpoint' };

  if (site.id === 'francis-george-solicitors-witney') {
    if (/^\/(?:404|cart|home)\/?$/i.test(pathname)) return { include: false, reason: 'system or homepage-alias route' };
    if ([...url.searchParams.keys()].some((key) => /^(?:author|offset|category)$/i.test(key))) return { include: false, reason: 'structural archive query' };
    if (/^\/solicitors-swindon-witney\/category\//i.test(pathname)) return { include: false, reason: 'team category archive duplicate' };
  }
  if (site.id === 'fringe-hair-beauty-minster-lovell') {
    if (/^\/(?:author|category|tag|\d{4}\/\d{2})(?:\/|$)/i.test(pathname)) return { include: false, reason: 'structural archive duplicate' };
    if (url.searchParams.has('et_blog')) return { include: false, reason: 'blog archive duplicate' };
    if (/^\/(?:booking-my-account|thank-you-for-booking|dev)(?:\/|$)/i.test(pathname)) return { include: false, reason: 'account, form-response, or development utility route' };
  }
  if (site.id === 'jamesons-witney') {
    if (/\/using-joomla(?:\/|$)/i.test(pathname)) return { include: false, reason: 'Joomla example content' };
    if (/view=(?:login|register)/i.test(url.search)) return { include: false, reason: 'authentication duplicate' };
    if (/command=viewitem/i.test(url.search)) return { include: true };
    if (/\/(?:index\.php\/)?component\//i.test(pathname)) return { include: false, reason: 'component/system duplicate' };
  }
  if (/<body[^>]+class=["'][^"']*\battachment\b/i.test(html)) {
    return { include: false, reason: 'WordPress attachment page' };
  }
  if (site.id === 'salutation-inn-pembrokeshire') {
    if (SALUTATION_THEME_PATHS.has(pathname)) return { include: false, reason: 'theme demonstration page' };
    if (/^\/(?:project|profile|event|events)(?:\/|$)/i.test(pathname)) {
      return { include: false, reason: 'theme demonstration custom content' };
    }
    if (/^\/(?:about-us-2|author|custom-html-css-js|home-store|pj-categs|pl-categs|sample-page)(?:\/|$)/i.test(pathname)) {
      return { include: false, reason: 'theme demonstration/archive content' };
    }
  }
  return { include: true };
}

async function fetchResource(url: string, timeoutMs = 30000, referer = '', userAgent = BROWSER_USER_AGENT) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': userAgent, accept: 'text/html,application/xhtml+xml,application/xml,*/*', ...(referer ? { referer } : {}) },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function discoverSitemaps(site: SiteConfig, inventoryDir: string, assetRefs: Map<string, AssetRef>) {
  const sitemapSeeds = new Set<string>();
  let robots = '';
  try {
    robots = await (await fetchResource(`${site.origin}/robots.txt`)).text();
  } catch {}
  await fs.writeFile(path.join(inventoryDir, 'robots.txt'), robots);
  for (const match of robots.matchAll(/^sitemap:\s*(\S+)/gim)) sitemapSeeds.add(normalizeUrl(match[1], site.origin));
  for (const pathname of ['/sitemap.xml', '/wp-sitemap.xml', '/sitemap_index.xml']) {
    sitemapSeeds.add(`${site.origin}${pathname}`);
  }

  const queue = [...sitemapSeeds];
  const visited = new Set<string>();
  const pages = new Map<string, Candidate>();
  let fileIndex = 0;
  while (queue.length && visited.size < 80) {
    const sitemapUrl = queue.shift()!;
    if (visited.has(sitemapUrl)) continue;
    visited.add(sitemapUrl);
    try {
      const response = await fetchResource(sitemapUrl, 20000);
      const xml = await response.text();
      if (!response.ok || !/<(?:sitemapindex|urlset)[\s>]/i.test(xml)) continue;
      fileIndex += 1;
      await fs.writeFile(path.join(inventoryDir, `sitemap-${String(fileIndex).padStart(2, '0')}.xml`), xml);
      if (/<sitemapindex[\s>]/i.test(xml)) {
        for (const loc of parsePageLocs(xml)) if (sameSite(loc, site.origin)) queue.push(normalizeUrl(loc, site.origin));
      } else {
        for (const loc of parsePageLocs(xml)) {
          const url = normalizeUrl(loc, site.origin);
          if (sameSite(url, site.origin)) {
            if (looksLikeAssetUrl(url)) addAsset(assetRefs, url, sitemapUrl, 'sitemap asset', true);
            else pages.set(url, { url, source: `sitemap:${sitemapUrl}` });
          }
        }
        for (const loc of parseImageLocs(xml)) addAsset(assetRefs, loc, sitemapUrl, 'sitemap image');
      }
    } catch {}
  }
  return pages;
}

function addAsset(refs: Map<string, AssetRef>, value: string, pageUrl: string, source: string, acceptExtensionless = false) {
  try {
    const url = normalizeUrl(value, pageUrl);
    if (!/^(?:https?|data):/i.test(url)) return;
    if (!acceptExtensionless && !url.startsWith('data:') && !looksLikeDocument(url)) return;
    const existing = refs.get(url) || { url, sourcePages: new Set<string>(), source: new Set<string>() };
    existing.sourcePages.add(pageUrl);
    existing.source.add(source);
    refs.set(url, existing);
  } catch {}
}
async function discoverCandidates(site: SiteConfig, inventoryDir: string, assetRefs: Map<string, AssetRef>) {
  if (directUrls.length) return new Map<string, Candidate>(directUrls.map((url) => [normalizeUrl(url, site.origin), { url: normalizeUrl(url, site.origin), source: 'manual:direct' }]));
  const sitemapPages = site.discoverSitemaps === false ? new Map<string, Candidate>() : await discoverSitemaps(site, inventoryDir, assetRefs);
  const candidates = new Map(sitemapPages);
  if (site.includeHome !== false) candidates.set(`${site.origin}/`, { url: `${site.origin}/`, source: 'manual:home' });
  for (const seed of site.seeds || []) {
    const url = normalizeUrl(seed, site.origin);
    candidates.set(url, { url, source: 'manual:seed' });
  }

  if (site.crawlLinks) {
    const queue = [...candidates.values()].map((entry) => entry.url);
    const visited = new Set<string>();
    while (queue.length && visited.size < 180) {
      const url = queue.shift()!;
      if (visited.has(url)) continue;
      visited.add(url);
      try {
        const response = await fetchResource(url, 20000);
        const contentType = response.headers.get('content-type') || '';
        if (contentType && !/(?:text\/html|application\/xhtml\+xml)/i.test(contentType)) {
          Object.assign(candidates.get(url) || { url, source: 'link crawl' }, {
            status: response.status, finalUrl: response.url, contentType, html: '',
          });
          addAsset(assetRefs, response.url || url, url, 'content-type asset', true);
          continue;
        }
        const html = await response.text();
        const current = candidates.get(url) || { url, source: 'link crawl' };
        Object.assign(current, { html, status: response.status, finalUrl: response.url, title: titleFromHtml(html), contentType });
        candidates.set(url, current);
        for (const link of htmlLinks(html, response.url)) {
          if (sameSite(link, site.origin) && !looksLikeAssetUrl(link)) {
            const decision = pageDecision(site, link);
            if (decision.include && !candidates.has(link)) {
              candidates.set(link, { url: link, source: `link:${url}` });
              queue.push(link);
            }
          } else if (looksLikeAssetUrl(link)) addAsset(assetRefs, link, url, 'HTML link/source', true);
        }
      } catch {}
    }
  }
  return candidates;
}

function pageFileBase(index: number, urlValue: string) {
  const url = new URL(urlValue);
  const raw = url.pathname === '/' ? 'home' : url.pathname.replace(/^\/|\/$/g, '').replace(/[^a-z0-9]+/gi, '-');
  const query = url.searchParams.get('id') ? `-item-${url.searchParams.get('id')}` : '';
  return `${String(index + 1).padStart(3, '0')}-${(raw || 'page').slice(0, 90)}${query}-${sha(urlValue).slice(0, 8)}`;
}
const fileExists = (file: string) => fs.access(file).then(() => true).catch(() => false);

async function settlePage(page: Page) {
  await page.waitForTimeout(500);
  await page.evaluate(async () => {
    const step = Math.max(500, Math.floor(window.innerHeight * 0.8));
    const max = Math.min(document.documentElement.scrollHeight, 60000);
    for (let y = 0; y < max; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 35));
    }
    window.scrollTo(0, 0);
    document.querySelectorAll<HTMLElement>('.running-animation, .is-entrance-animating, .et-pb-before-scroll-animation').forEach((node) => { node.style.opacity = '1'; node.style.transform = 'none'; });
  });
  await page.waitForTimeout(250);
}

async function dismissCookieCover(page: Page) {
  for (const label of [/accept all/i, /accept cookies/i, /allow all/i, /i understand/i, /got it/i, /dismiss/i]) {
    const button = page.getByRole('button', { name: label }).first();
    try {
      if (await button.isVisible({ timeout: 250 })) {
        await button.click({ timeout: 1000 });
        return;
      }
    } catch {}
  }
  await page.addStyleTag({
    content: `#cookie-notice, .cookie-notice-container, [id*="cookie-banner" i], [class*="cookie-banner" i],
      #CybotCookiebotDialog, .cc-window, #d-notification-bar, [id*="consent-banner" i], [class*="consent-banner" i],
      [data-rule-type="notification"], body.et_bloom .et_bloom_popup.et_bloom_visible { display: none !important; }
      body.et_bloom_popup_active { overflow: auto !important; }`,
  }).catch(() => undefined);
}

async function renderedData(page: Page) {
  return page.evaluate(() => {
    const assets = new Set<string>();
    const add = (value: string | null | undefined) => {
      if (!value) return;
      if (value.trim().startsWith('data:')) { assets.add(value.trim()); return; }
      try { assets.add(new URL(value.trim(), document.baseURI).href); } catch {}
    };
    document.querySelectorAll('img').forEach((node) => {
      const image = node as HTMLImageElement;
      add(image.currentSrc); add(image.src);
    });
    document.querySelectorAll('video').forEach((node) => add((node as HTMLVideoElement).poster));
    document.querySelectorAll('meta[property="og:image"],meta[name="twitter:image"]').forEach((node) =>
      add(node.getAttribute('content')),
    );
    document.querySelectorAll('*').forEach((node) => {
      const background = getComputedStyle(node).backgroundImage;
      for (const match of background.matchAll(/url\(["']?([^"')]+)["']?\)/g)) add(match[1]);
    });
    const documents = [...document.querySelectorAll('a[href]')]
      .map((node) => (node as HTMLAnchorElement).href)
      .filter((href) => /\.(?:pdf|docx?|xlsx?|pptx?|zip)(?:$|\?)/i.test(href));
    const links = [...document.querySelectorAll('a[href]')].map((node) => (node as HTMLAnchorElement).href);
    return {
      url: location.href,
      title: document.title,
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '',
      text: document.body?.innerText.replace(/\n{3,}/g, '\n\n').trim() || '',
      assets: [...assets],
      documents,
      links,
      html: document.documentElement.outerHTML,
    };
  });
}

async function newContext(browser: Awaited<ReturnType<typeof chromium.launch>>, mobile: boolean): Promise<BrowserContext> {
  return browser.newContext({
    ignoreHTTPSErrors: true,
    userAgent: BROWSER_USER_AGENT,
    viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
    isMobile: mobile,
    deviceScaleFactor: 1,
  });
}

async function capturePages(site: SiteConfig, selected: Candidate[], siteDir: string, assetRefs: Map<string, AssetRef>) {
  const htmlDir = path.join(siteDir, 'pages/html');
  const textDir = path.join(siteDir, 'pages/text');
  const jsonDir = path.join(siteDir, 'pages/json');
  const desktopDir = path.join(siteDir, 'screenshots/desktop');
  const mobileDir = path.join(siteDir, 'screenshots/mobile');
  await Promise.all([htmlDir, textDir, jsonDir, desktopDir, mobileDir].map((dir) => fs.mkdir(dir, { recursive: true })));

  const browser = await chromium.launch({ headless: true });
  const desktopContext = await newContext(browser, false);
  const mobileContext = await newContext(browser, true);
  const results: Record<string, unknown>[] = [];

  for (const [index, candidate] of selected.entries()) {
    const base = pageFileBase(index, candidate.url);
    const record: Record<string, unknown> = { sourceUrl: candidate.url, source: candidate.source, fileBase: base };
    const files = { html: path.join(htmlDir, `${base}.html`), text: path.join(textDir, `${base}.txt`), json: path.join(jsonDir, `${base}.json`), desktop: path.join(desktopDir, `${base}.png`), mobile: path.join(mobileDir, `${base}.png`) };
    if (!refreshArg && (await Promise.all(Object.values(files).map(fileExists))).every(Boolean)) {
      const cached = JSON.parse(await fs.readFile(files.json, 'utf8'));
      for (const asset of cached.assets || []) addAsset(assetRefs, asset, candidate.url, 'rendered image/background');
      for (const document of cached.documents || []) addAsset(assetRefs, document, candidate.url, 'rendered document link');
      results.push(cached); console.log(`[${site.id}] ${index + 1}/${selected.length} cached ${candidate.url}`); continue;
    }
    console.log(`[${site.id}] ${index + 1}/${selected.length} ${candidate.url}`);
    const desktop = await desktopContext.newPage(); const mobile = await mobileContext.newPage();
    const pageTimer = setTimeout(() => { void desktop.close(); void mobile.close(); }, 120000);
    try {
      let response = await desktop.goto(candidate.url, { waitUntil: 'domcontentloaded', timeout: 45000 }); for (let attempt = 0; (response?.status() || 0) >= 500 && attempt < 2; attempt++) response = await desktop.goto(candidate.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await dismissCookieCover(desktop);
      await settlePage(desktop);
      const data = await renderedData(desktop);
      Object.assign(record, { status: response?.status() || null, finalUrl: data.url, title: data.title, canonical: data.canonical });
      for (const asset of data.assets) addAsset(assetRefs, asset, candidate.url, 'rendered image/background');
      for (const document of data.documents) addAsset(assetRefs, document, candidate.url, 'rendered document link');
      await fs.writeFile(files.html, data.html);
      await fs.writeFile(files.text, data.text);
      await fs.writeFile(files.json, JSON.stringify({ ...record, links: data.links, assets: data.assets, documents: data.documents }, null, 2));
      await desktop.screenshot({ path: files.desktop, fullPage: true, timeout: 45000 });

      let mobileResponse = await mobile.goto(candidate.url, { waitUntil: 'domcontentloaded', timeout: 45000 }); for (let attempt = 0; (mobileResponse?.status() || 0) >= 500 && attempt < 2; attempt++) mobileResponse = await mobile.goto(candidate.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await dismissCookieCover(mobile);
      await settlePage(mobile);
      await mobile.screenshot({ path: files.mobile, fullPage: true, timeout: 45000 });
    } catch (error) {
      record.error = error instanceof Error ? error.message : String(error);
    }
    clearTimeout(pageTimer); await Promise.race([Promise.allSettled([desktop.close(), mobile.close()]), new Promise((resolve) => setTimeout(resolve, 5000))]);
    results.push(record);
  }
  await Promise.race([browser.close(), new Promise((resolve) => setTimeout(resolve, 10000))]);
  return results;
}

function extensionFor(contentType: string, urlValue: string) {
  const byMime: Record<string, string> = {
    'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif',
    'image/svg+xml': '.svg', 'image/avif': '.avif', 'application/pdf': '.pdf',
    'application/zip': '.zip',
  };
  const mime = contentType.split(';')[0].trim().toLowerCase();
  if (byMime[mime]) return byMime[mime];
  const ext = path.extname(new URL(urlValue).pathname).toLowerCase();
  return /^\.[a-z0-9]{2,6}$/.test(ext) ? ext : '.bin';
}

function decodeDataAsset(url: string) {
  const match = url.match(/^data:([^;,]+)?(;base64)?,(.*)$/s);
  if (!match) throw new Error('invalid data URL');
  const body = match[2] ? match[3] : decodeURIComponent(match[3]);
  return { contentType: match[1] || 'application/octet-stream', bytes: Buffer.from(body, match[2] ? 'base64' : 'utf8') };
}

async function downloadAssets(siteDir: string, refs: Map<string, AssetRef>) {
  const imageDir = path.join(siteDir, 'assets/images'); const documentDir = path.join(siteDir, 'assets/documents'); const mediaDir = path.join(siteDir, 'assets/media');
  await Promise.all([imageDir, documentDir, mediaDir].map((dir) => fs.mkdir(dir, { recursive: true })));
  const entries = [...refs.values()].sort((a, b) => a.url.localeCompare(b.url));
  const results: Record<string, unknown>[] = new Array(entries.length);
  let cursor = 0;
  const workers = Array.from({ length: 5 }, async () => {
    while (cursor < entries.length) {
      const index = cursor++;
      const entry = entries[index];
      const record: Record<string, unknown> = {
        url: entry.url,
        sourcePages: [...entry.sourcePages],
        discovery: [...entry.source],
      };
      try {
        let status = 200; let contentType = ''; let bytes: Buffer;
        if (entry.url.startsWith('data:')) ({ contentType, bytes } = decodeDataAsset(entry.url));
        else {
          const referer = [...entry.sourcePages][0] || '';
          const response = await fetchResource(entry.url, 45000, referer, BROWSER_USER_AGENT).catch(() =>
            fetchResource(entry.url, 45000, referer, BROWSER_USER_AGENT).catch(() => fetchResource(entry.url, 45000, referer, BROWSER_USER_AGENT)),
          );
          status = response.status; contentType = response.headers.get('content-type') || '';
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          if (Number(response.headers.get('content-length') || 0) > MAX_BODY_BYTES) throw new Error(`asset exceeds ${MAX_BODY_BYTES} bytes`);
          bytes = Buffer.from(await response.arrayBuffer());
        }
        if (bytes.byteLength > MAX_BODY_BYTES) throw new Error(`asset exceeds ${MAX_BODY_BYTES} bytes`);
        const ext = extensionFor(contentType, entry.url);
        const isDocument = /^(application\/(?:pdf|zip|msword|vnd\.)|text\/)/i.test(contentType) || /\.(?:pdf|docx?|xlsx?|pptx?|zip)$/i.test(ext);
        const isMedia = /^(?:audio|video)\//i.test(contentType) || /\.(?:m4v|mov|mp4|webm|mp3|ogg|wav)$/i.test(ext);
        const original = entry.url.startsWith('data:') ? 'inline' : decodeURIComponent(path.basename(new URL(entry.url).pathname)).replace(/[^a-z0-9._-]+/gi, '-');
        const stem = (path.basename(original, path.extname(original)) || 'asset').slice(0, 80);
        const filename = `${String(index + 1).padStart(4, '0')}-${stem}-${sha(entry.url).slice(0, 8)}${ext}`;
        const relativePath = path.join('assets', isMedia ? 'media' : isDocument ? 'documents' : 'images', filename);
        await fs.writeFile(path.join(siteDir, relativePath), bytes);
        Object.assign(record, { ok: true, status, contentType, bytes: bytes.byteLength, localPath: relativePath });
      } catch (error) {
        Object.assign(record, { ok: false, error: error instanceof Error ? error.message : String(error) });
      }
      results[index] = record;
    }
  });
  await Promise.all(workers);
  return results;
}

function csvCell(value: unknown) {
  const text = Array.isArray(value) ? value.join(' | ') : String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(rows: Record<string, unknown>[], keys: string[]) {
  return [keys.map(csvCell).join(','), ...rows.map((row) => keys.map((key) => csvCell(row[key])).join(','))].join('\n');
}

async function harvestSite(site: SiteConfig) {
  const siteDir = path.join(OUTPUT_ROOT, site.id);
  const inventoryDir = path.join(siteDir, 'inventory');
  await fs.mkdir(inventoryDir, { recursive: true });
  const assetRefs = new Map<string, AssetRef>();
  console.log(`[${site.id}] discovering URLs`);
  const candidates = await discoverCandidates(site, inventoryDir, assetRefs);
  const selected: Candidate[] = [];
  const exclusions: Exclusion[] = [];
  const contentHashes = new Map<string, string>();
  const effectivePages = new Map<string, string>();
  const jamesonsNewsItems = new Map<string, string>();

  for (const candidate of [...candidates.values()].sort((a, b) => a.url.localeCompare(b.url))) {
    try {
      if (site.id === 'salutation-inn-pembrokeshire' && candidate.url.startsWith('http:') && candidates.has(candidate.url.replace(/^http:/, 'https:'))) { exclusions.push({ url: candidate.url, reason: 'HTTP protocol duplicate of HTTPS page', source: candidate.source }); continue; }
      if (site.id === 'jamesons-witney' && /command=viewitem/i.test(new URL(candidate.url).search)) {
        const itemId = new URL(candidate.url).searchParams.get('id');
        const representative = itemId ? jamesonsNewsItems.get(itemId) : undefined;
        if (itemId && representative) {
          exclusions.push({
            url: candidate.url,
            reason: `structural duplicate of news item ${representative}`,
            source: candidate.source,
          });
          continue;
        }
        if (itemId) jamesonsNewsItems.set(itemId, candidate.url);
      }
      if (!candidate.html) {
        let response = await fetchResource(candidate.url, 25000); for (let attempt = 0; response.status >= 500 && attempt < 2; attempt++) response = await fetchResource(candidate.url, 25000);
        candidate.status = response.status;
        candidate.finalUrl = response.url;
        candidate.contentType = response.headers.get('content-type') || '';
        if (candidate.contentType && !/(?:text\/html|application\/xhtml\+xml)/i.test(candidate.contentType)) {
          addAsset(assetRefs, response.url || candidate.url, candidate.url, 'content-type asset', true);
          candidate.html = '';
          exclusions.push({ url: candidate.url, reason: `non-page content type ${candidate.contentType}`, source: candidate.source });
          continue;
        }
        candidate.html = await response.text();
        candidate.title = titleFromHtml(candidate.html);
      }
      const effectiveUrl = normalizeUrl(candidate.finalUrl || candidate.url, site.origin);
      const existingEffective = effectivePages.get(effectiveUrl);
      if (existingEffective) {
        exclusions.push({ url: candidate.url, reason: `redirect/route duplicate of ${existingEffective}`, source: candidate.source });
        continue;
      }
      candidate.url = effectiveUrl; effectivePages.set(effectiveUrl, effectiveUrl);
      for (const link of htmlLinks(candidate.html, candidate.finalUrl || candidate.url)) {
        if (looksLikeAssetUrl(link)) addAsset(assetRefs, link, candidate.url, 'HTML link/source', true);
      }
      if (!candidate.status || candidate.status >= 400) {
        exclusions.push({ url: candidate.url, reason: `HTTP ${candidate.status || 'error'}`, source: candidate.source });
        continue;
      }
      const decision = pageDecision(site, candidate.url, candidate.html);
      if (!decision.include) {
        exclusions.push({ url: candidate.url, reason: decision.reason || 'filtered', source: candidate.source });
        continue;
      }
      const hash = sha(candidate.html.replace(/\s+/g, ' '));
      const duplicate = contentHashes.get(hash);
      if (duplicate) {
        exclusions.push({ url: candidate.url, reason: `exact duplicate of ${duplicate}`, source: candidate.source });
        continue;
      }
      contentHashes.set(hash, candidate.url);
      selected.push(candidate);
    } catch (error) {
      exclusions.push({ url: candidate.url, reason: `fetch error: ${error instanceof Error ? error.message : String(error)}`, source: candidate.source });
    }
  }

  await fs.writeFile(path.join(inventoryDir, 'discovered-urls.json'), JSON.stringify([...candidates.values()].map(({ html, ...entry }) => entry), null, 2));
  await fs.writeFile(path.join(inventoryDir, 'selected-pages.json'), JSON.stringify(selected.map(({ html, ...entry }) => entry), null, 2));
  await fs.writeFile(path.join(inventoryDir, 'excluded-urls.json'), JSON.stringify(exclusions, null, 2));
  await fs.writeFile(path.join(inventoryDir, 'excluded-urls.csv'), toCsv(exclusions, ['url', 'reason', 'source']));

  console.log(`[${site.id}] capturing ${selected.length} pages`);
  const pageResults = await capturePages(site, selected, siteDir, assetRefs);
  console.log(`[${site.id}] downloading ${assetRefs.size} assets`);
  const assetResults = await downloadAssets(siteDir, assetRefs);
  await fs.writeFile(path.join(inventoryDir, 'captured-pages.json'), JSON.stringify(pageResults, null, 2));
  await fs.writeFile(path.join(inventoryDir, 'captured-pages.csv'), toCsv(pageResults, ['sourceUrl', 'status', 'finalUrl', 'title', 'fileBase', 'error']));
  await fs.writeFile(path.join(inventoryDir, 'assets.json'), JSON.stringify(assetResults, null, 2));
  await fs.writeFile(path.join(inventoryDir, 'assets.csv'), toCsv(assetResults, ['url', 'ok', 'status', 'contentType', 'bytes', 'localPath', 'error', 'sourcePages', 'discovery']));

  const captured = pageResults.filter((page) => !page.error).length;
  const assetsOk = assetResults.filter((asset) => asset.ok).length;
  const assetBytes = assetResults.reduce((sum, asset) => sum + Number(asset.bytes || 0), 0);
  const summary = [
    `# ${site.name} — refreshed source pack`, '',
    `- Captured: ${new Date().toISOString()}`,
    `- Live origin: ${site.origin}`,
    `- URLs discovered: ${candidates.size}`,
    `- Business-relevant unique pages selected: ${selected.length}`,
    `- Desktop full-page screenshots completed: ${captured}`,
    `- Mobile full-page screenshots completed: ${captured}`,
    `- URLs excluded or failed: ${exclusions.length}`,
    `- Original assets/documents downloaded: ${assetsOk}/${assetResults.length}`,
    `- Downloaded asset bytes: ${assetBytes}`,
    '',
    'The exclusions ledger records system routes, duplicate pages, attachment-only pages, theme demonstration content, and failures. HTML, rendered text, screenshots, and original media are mapped through the CSV/JSON inventory files.',
    '',
  ].join('\n');
  await fs.writeFile(path.join(siteDir, 'README.md'), summary);
  return { site: site.id, name: site.name, discovered: candidates.size, selected: selected.length, captured, excluded: exclusions.length, assets: assetResults.length, assetsOk, assetBytes };
}

async function main() {
  await fs.mkdir(OUTPUT_ROOT, { recursive: true });
  const selectedSites = siteArg ? sites.filter((site) => site.id === siteArg) : sites;
  if (!selectedSites.length) throw new Error(`Unknown --site=${siteArg}`);
  const results = [];
  for (const site of selectedSites) results.push(await harvestSite(site));
  const previous = siteArg
    ? await fs.readFile(path.join(OUTPUT_ROOT, 'manifest.json'), 'utf8').then(JSON.parse).catch(() => ({ results: [] }))
    : { results: [] };
  const mergedResults = [...(previous.results || []).filter((entry: { site: string }) => entry.site !== siteArg), ...results].sort((left: { site: string }, right: { site: string }) => sites.findIndex((site) => site.id === left.site) - sites.findIndex((site) => site.id === right.site));
  await fs.writeFile(path.join(OUTPUT_ROOT, 'manifest.json'), JSON.stringify({ createdAt: new Date().toISOString(), results: mergedResults }, null, 2));
  await fs.writeFile(
    path.join(OUTPUT_ROOT, 'README.md'),
    [
      '# Velvet Dinosaur — refreshed prospect source packs', '',
      `Created: ${new Date().toISOString()}`, '',
      'Each folder contains desktop and mobile full-page screenshots, rendered HTML and text, original images/documents, URL inventories, and an explicit exclusions ledger.', '',
      ...mergedResults.map((result) => `- ${result.name}: ${result.captured}/${result.selected} pages captured; ${result.assetsOk}/${result.assets} assets downloaded`),
      '',
    ].join('\n'),
  );
  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
