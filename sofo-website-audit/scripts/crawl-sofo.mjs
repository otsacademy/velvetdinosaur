import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const SITE_ORIGIN = "https://www.sofo.org.uk";
const AUDIT_ROOT = path.resolve("sofo-website-audit");
const EVIDENCE_DIR = path.join(AUDIT_ROOT, "evidence");
const HTML_DIR = path.join(EVIDENCE_DIR, "html");
const TEXT_DIR = path.join(EVIDENCE_DIR, "text");
const PAGE_DIR = path.join(EVIDENCE_DIR, "pages");
const SCREENSHOT_DIR = path.join(AUDIT_ROOT, "screenshots");
const NOTES_DIR = path.join(AUDIT_ROOT, "notes");
const USER_AGENT =
  "VelvetDinosaurAudit/1.0 (+https://velvetdinosaur.com; respectful website audit)";

const includedSitemapPattern =
  /\/wp-sitemap-posts-(post|page|product|staff|exhibits|galleryimages|soldiers|supporters)-\d+\.xml$/;

const manualUrls = [
  "/",
  "/visit-us/",
  "/whats-on/",
  "/galleries/",
  "/learning-at-sofo/",
  "/activities-for-schools/",
  "/family-fun-at-sofo/",
  "/become-a-friend/",
  "/support-us/",
  "/volunteers/",
  "/become-a-volunteer/",
  "/collection/",
  "/research/",
  "/soldier-search/",
  "/onlinetalks/",
  "/about/",
  "/shop/",
  "/basket/",
  "/checkout/",
  "/archive-enquiry/",
  "/pastexhibits/",
  "/onlineexhibits/",
].map((url) => new URL(url, SITE_ORIGIN).toString());

const screenshotPaths = new Set([
  "/",
  "/visit-us/",
  "/whats-on/",
  "/galleries/",
  "/learning-at-sofo/",
  "/activities-for-schools/",
  "/family-fun-at-sofo/",
  "/become-a-friend/",
  "/support-us/",
  "/collection/",
  "/research/",
  "/soldier-search/",
  "/onlinetalks/",
  "/about/",
  "/shop/",
  "/archive-enquiry/",
  "/pastexhibits/",
  "/onlineexhibits/",
  "/product/research-enquiry-fee/",
  "/product/the-rise-fall-of-the-british-army-1975-2025-talk-2pm-13-june-2026/",
]);

async function ensureDirs() {
  await Promise.all(
    [
      EVIDENCE_DIR,
      HTML_DIR,
      TEXT_DIR,
      PAGE_DIR,
      path.join(SCREENSHOT_DIR, "desktop"),
      path.join(SCREENSHOT_DIR, "mobile"),
      NOTES_DIR,
    ].map((dir) => fs.mkdir(dir, { recursive: true }))
  );
}

function normalizeUrl(value) {
  const url = new URL(value, SITE_ORIGIN);
  url.hash = "";
  const looksLikeFile = /\.[a-z0-9]{2,8}$/i.test(url.pathname);
  if (url.origin === SITE_ORIGIN && url.pathname !== "/" && !url.pathname.endsWith("/") && !looksLikeFile) {
    url.pathname = `${url.pathname}/`;
  }
  return url.toString();
}

function slugForUrl(value) {
  const url = new URL(value);
  if (url.pathname === "/" || url.pathname === "") return "home";
  return url.pathname
    .replace(/^\/|\/$/g, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 120);
}

function xmlText(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseUrlSet(xml) {
  const entries = [];
  const blocks = xml.match(/<url>[\s\S]*?<\/url>/g) || [];
  for (const block of blocks) {
    const loc = block.match(/<loc>([\s\S]*?)<\/loc>/)?.[1];
    if (!loc) continue;
    const lastmod = block.match(/<lastmod>([\s\S]*?)<\/lastmod>/)?.[1] || null;
    entries.push({
      loc: normalizeUrl(xmlText(loc.trim())),
      lastmod: lastmod ? xmlText(lastmod.trim()) : null,
    });
  }
  return entries;
}

function parseLocs(xml) {
  return Array.from(xml.matchAll(/<loc>([\s\S]*?)<\/loc>/g), (match) => normalizeUrl(xmlText(match[1].trim())));
}

function parseRobots(robotsText) {
  const disallow = [];
  const allow = [];
  for (const rawLine of robotsText.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const [key, ...rest] = line.split(":");
    const value = rest.join(":").trim();
    if (/^disallow$/i.test(key) && value) disallow.push(value);
    if (/^allow$/i.test(key) && value) allow.push(value);
  }
  return { disallow, allow };
}

function isAllowedByRobots(value, robotsRules) {
  const url = new URL(value);
  const pathname = url.pathname;
  const allowedMatch = robotsRules.allow.find((rule) => pathname.startsWith(rule));
  const disallowedMatch = robotsRules.disallow.find((rule) => pathname.startsWith(rule));
  if (!disallowedMatch) return true;
  if (!allowedMatch) return false;
  return allowedMatch.length >= disallowedMatch.length;
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 30000);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "user-agent": USER_AGENT,
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        ...(options.headers || {}),
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function discoverSitemapEntries(robotsText) {
  const sitemapUrls = new Set(parseLocs(robotsText).filter((url) => url.includes("sitemap")));
  sitemapUrls.add(`${SITE_ORIGIN}/wp-sitemap.xml`);
  sitemapUrls.add(`${SITE_ORIGIN}/sitemap.xml`);

  const queue = Array.from(sitemapUrls);
  const visited = new Set();
  const entries = [];

  while (queue.length > 0) {
    const sitemapUrl = queue.shift();
    if (visited.has(sitemapUrl)) continue;
    visited.add(sitemapUrl);

    let xml = "";
    try {
      const response = await fetchWithTimeout(sitemapUrl, { timeoutMs: 25000 });
      xml = await response.text();
      await fs.writeFile(path.join(EVIDENCE_DIR, `${slugForUrl(sitemapUrl)}.xml`), xml);
    } catch (error) {
      console.warn(`Skipping sitemap ${sitemapUrl}: ${error.message}`);
      continue;
    }

    if (/<sitemapindex[\s>]/i.test(xml)) {
      for (const loc of parseLocs(xml)) {
        const locUrl = new URL(loc);
        if (locUrl.origin === SITE_ORIGIN && includedSitemapPattern.test(locUrl.pathname)) {
          queue.push(loc);
        }
      }
      continue;
    }

    entries.push(...parseUrlSet(xml));
  }

  for (const url of manualUrls) entries.push({ loc: normalizeUrl(url), lastmod: null, manual: true });
  return Array.from(new Map(entries.map((entry) => [entry.loc, entry])).values()).filter((entry) => {
    const url = new URL(entry.loc);
    if (url.origin !== SITE_ORIGIN) return false;
    if (!isAllowedByRobots(entry.loc, parseRobots(robotsText))) return false;
    if (/\/wp-admin\//.test(url.pathname)) return false;
    return true;
  });
}

async function collectRenderedPage(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(800);
  return page.evaluate(() => {
    const clean = (value) => (value || "").replace(/\s+/g, " ").trim();
    const visible = (el) => {
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
    };
    const labelFor = (input) => {
      if (input.id) {
        const label = document.querySelector(`label[for="${CSS.escape(input.id)}"]`);
        if (label) return clean(label.textContent);
      }
      return clean(input.closest("label")?.textContent || "");
    };
    const links = Array.from(document.querySelectorAll("a")).map((anchor) => ({
      text: clean(anchor.innerText || anchor.getAttribute("aria-label") || anchor.getAttribute("title") || ""),
      href: anchor.href,
      pathname: anchor.pathname,
      rel: anchor.rel || "",
      target: anchor.target || "",
      visible: visible(anchor),
    }));
    const navLinks = Array.from(
      document.querySelectorAll("nav a, header a, .menu a, .main-navigation a, [role='navigation'] a")
    ).map((anchor) => ({
      text: clean(anchor.innerText || anchor.getAttribute("aria-label") || anchor.getAttribute("title") || ""),
      href: anchor.href,
      visible: visible(anchor),
    }));
    const headings = Array.from(document.querySelectorAll("h1,h2,h3,h4")).map((heading) => ({
      level: heading.tagName.toLowerCase(),
      text: clean(heading.textContent),
    }));
    const images = Array.from(document.querySelectorAll("img")).map((image) => ({
      src: image.currentSrc || image.src,
      alt: image.getAttribute("alt"),
      width: image.getAttribute("width"),
      height: image.getAttribute("height"),
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      visible: visible(image),
    }));
    const forms = Array.from(document.querySelectorAll("form")).map((form) => ({
      action: form.action,
      method: form.method,
      text: clean(form.innerText).slice(0, 1000),
      inputs: Array.from(form.querySelectorAll("input,textarea,select")).map((input) => ({
        type: input.getAttribute("type") || input.tagName.toLowerCase(),
        name: input.getAttribute("name") || "",
        placeholder: input.getAttribute("placeholder") || "",
        ariaLabel: input.getAttribute("aria-label") || "",
        label: labelFor(input),
        id: input.id || "",
        required: input.required || input.getAttribute("aria-required") === "true",
      })),
    }));
    const buttons = Array.from(document.querySelectorAll("button, input[type='submit'], [role='button']")).map(
      (button) => ({
        text: clean(button.innerText || button.getAttribute("value") || button.getAttribute("aria-label") || ""),
        type: button.getAttribute("type") || "",
        visible: visible(button),
      })
    );
    const bodyText = document.body ? document.body.innerText.replace(/\n{3,}/g, "\n\n").trim() : "";
    const metaDescription =
      document.querySelector("meta[name='description']")?.getAttribute("content") ||
      document.querySelector("meta[property='og:description']")?.getAttribute("content") ||
      "";
    return {
      url: window.location.href,
      title: document.title || "",
      metaDescription,
      canonical: document.querySelector("link[rel='canonical']")?.getAttribute("href") || "",
      headings,
      links,
      navLinks,
      images,
      forms,
      buttons,
      wordCount: bodyText.split(/\s+/).filter(Boolean).length,
      bodyText,
      footerText: clean(document.querySelector("footer")?.innerText || ""),
    };
  });
}

async function checkInternalLinks(pageSummaries, robotsRules) {
  const urls = new Set();
  for (const pageSummary of pageSummaries) {
    for (const link of pageSummary.links || []) {
      if (!link.href || /^(mailto|tel|javascript):/i.test(link.href)) continue;
      let linkUrl;
      try {
        linkUrl = new URL(link.href);
      } catch {
        continue;
      }
      if (linkUrl.origin !== SITE_ORIGIN) continue;
      linkUrl.hash = "";
      if (!isAllowedByRobots(linkUrl.toString(), robotsRules)) continue;
      urls.add(normalizeUrl(linkUrl.toString()));
    }
  }

  const results = [];
  for (const url of Array.from(urls).sort()) {
    try {
      const response = await fetchWithTimeout(url, { method: "GET", timeoutMs: 20000 });
      results.push({
        url,
        status: response.status,
        ok: response.ok,
        finalUrl: response.url,
        contentType: response.headers.get("content-type") || "",
      });
    } catch (error) {
      results.push({ url, status: null, ok: false, finalUrl: null, error: error.message });
    }
  }
  return results;
}

function writeAutomatedNotes({ sitemapEntries, pages, linkChecks }) {
  const visibleNavLinks = new Set(
    pages.flatMap((page) =>
      page.navLinks
        .filter((link) => link.visible && link.href?.startsWith(SITE_ORIGIN))
        .map((link) => normalizeUrl(link.href))
    )
  );
  const hiddenFromNav = sitemapEntries.map((entry) => entry.loc).filter((url) => !visibleNavLinks.has(url));
  const missingDescriptions = pages.filter((page) => !page.metaDescription);
  const imageAltIssues = pages
    .map((page) => ({
      url: page.url,
      missingAlt: page.images.filter((image) => image.visible && (!image.alt || image.alt.trim() === "")).length,
      totalImages: page.images.filter((image) => image.visible).length,
    }))
    .filter((entry) => entry.missingAlt > 0);
  const formLabelIssues = pages
    .map((page) => ({
      url: page.url,
      unlabeledInputs: page.forms.flatMap((form) =>
        form.inputs.filter(
          (input) =>
            !["hidden", "submit", "button", "checkbox", "radio"].includes(input.type) &&
            !input.label &&
            !input.ariaLabel &&
            !input.placeholder
        )
      ).length,
    }))
    .filter((entry) => entry.unlabeledInputs > 0);
  const failedLinks = linkChecks.filter((link) => !link.ok);

  const noteLines = [
    "# Automated Finding Seeds",
    "",
    `Captured at: ${new Date().toISOString()}`,
    `Sitemap URLs selected for crawl: ${sitemapEntries.length}`,
    `Rendered pages captured: ${pages.length}`,
    `Screenshot page sets: ${
      pages.filter((page) => screenshotPaths.has(new URL(page.sitemap.loc).pathname)).length
    }`,
    `Internal links checked: ${linkChecks.length}`,
    `Internal link failures/errors: ${failedLinks.length}`,
    `Rendered pages without meta descriptions: ${missingDescriptions.length}`,
    `Pages with visible images missing alt text: ${imageAltIssues.length}`,
    `Pages with likely unlabeled text inputs: ${formLabelIssues.length}`,
    "",
    "## Navigation Coverage Sample",
    ...hiddenFromNav.slice(0, 120).map((url) => `- Sitemap URL not present in visible nav capture: ${url}`),
    hiddenFromNav.length > 120 ? `- ...${hiddenFromNav.length - 120} more` : "",
    "",
    "## Missing Meta Descriptions",
    ...missingDescriptions.map((page) => `- ${page.url}`),
    "",
    "## Image Alt Issues",
    ...imageAltIssues.map(
      (entry) => `- ${entry.url}: ${entry.missingAlt}/${entry.totalImages} visible images missing alt text`
    ),
    "",
    "## Form Label Issues",
    ...formLabelIssues.map((entry) => `- ${entry.url}: ${entry.unlabeledInputs} likely unlabeled text input(s)`),
    "",
    "## Failed Internal Links",
    ...failedLinks.map((link) => `- ${link.url}: ${link.status || link.error}`),
    "",
  ];
  return noteLines.filter(Boolean).join("\n");
}

async function main() {
  await ensureDirs();

  const robotsResponse = await fetchWithTimeout(`${SITE_ORIGIN}/robots.txt`);
  const robotsText = await robotsResponse.text();
  await fs.writeFile(path.join(EVIDENCE_DIR, "robots.txt"), robotsText);
  const robotsRules = parseRobots(robotsText);
  await fs.writeFile(path.join(EVIDENCE_DIR, "robots-rules.json"), JSON.stringify(robotsRules, null, 2));

  const sitemapEntries = (await discoverSitemapEntries(robotsText)).sort((a, b) => {
    if (a.loc === `${SITE_ORIGIN}/`) return -1;
    if (b.loc === `${SITE_ORIGIN}/`) return 1;
    return a.loc.localeCompare(b.loc);
  });
  await fs.writeFile(path.join(EVIDENCE_DIR, "sitemap-urls.json"), JSON.stringify(sitemapEntries, null, 2));
  await fs.writeFile(
    path.join(EVIDENCE_DIR, "sitemap-urls.txt"),
    sitemapEntries.map((entry) => `${entry.loc}${entry.lastmod ? `\t${entry.lastmod}` : ""}`).join("\n")
  );

  const browser = await chromium.launch({
    executablePath: "/snap/bin/chromium",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({ userAgent: USER_AGENT, ignoreHTTPSErrors: true });
  const page = await context.newPage();

  const pageSummaries = [];
  for (const [index, entry] of sitemapEntries.entries()) {
    const slug = slugForUrl(entry.loc);
    console.log(`Capturing ${index + 1}/${sitemapEntries.length}: ${entry.loc}`);
    let fetchMeta = {};
    try {
      const htmlResponse = await fetchWithTimeout(entry.loc, { timeoutMs: 30000 });
      const html = await htmlResponse.text();
      await fs.writeFile(path.join(HTML_DIR, `${slug}.html`), html);
      fetchMeta = {
        status: htmlResponse.status,
        ok: htmlResponse.ok,
        finalUrl: htmlResponse.url,
        contentType: htmlResponse.headers.get("content-type") || "",
        xRobotsTag: htmlResponse.headers.get("x-robots-tag") || "",
      };
    } catch (error) {
      fetchMeta = { status: null, ok: false, error: error.message };
    }

    let rendered;
    try {
      rendered = await collectRenderedPage(page, entry.loc);
    } catch (error) {
      rendered = {
        url: entry.loc,
        title: "",
        metaDescription: "",
        canonical: "",
        headings: [],
        links: [],
        navLinks: [],
        images: [],
        forms: [],
        buttons: [],
        wordCount: 0,
        bodyText: "",
        footerText: "",
        renderError: error.message,
      };
    }

    const summary = { sitemap: entry, capturedAt: new Date().toISOString(), fetch: fetchMeta, ...rendered };
    pageSummaries.push(summary);
    await fs.writeFile(path.join(TEXT_DIR, `${slug}.txt`), rendered.bodyText || "");
    await fs.writeFile(path.join(PAGE_DIR, `${slug}.json`), JSON.stringify(summary, null, 2));

    const pathname = new URL(entry.loc).pathname;
    if (screenshotPaths.has(pathname)) {
      for (const [viewportName, viewportConfig] of Object.entries({
        desktop: { viewport: { width: 1440, height: 1100 }, isMobile: false },
        mobile: { viewport: { width: 390, height: 844 }, isMobile: true },
      })) {
        const shotContext = await browser.newContext({
          userAgent: USER_AGENT,
          viewport: viewportConfig.viewport,
          isMobile: viewportConfig.isMobile,
          ignoreHTTPSErrors: true,
        });
        const shotPage = await shotContext.newPage();
        await shotPage.goto(entry.loc, { waitUntil: "domcontentloaded", timeout: 45000 });
        await shotPage.waitForTimeout(1000);
        await shotPage.screenshot({
          path: path.join(SCREENSHOT_DIR, viewportName, `${slug}.png`),
          fullPage: true,
        });
        await shotContext.close();
      }
    }
  }

  await browser.close();

  const linkChecks = await checkInternalLinks(pageSummaries, robotsRules);
  await fs.writeFile(path.join(EVIDENCE_DIR, "internal-link-checks.json"), JSON.stringify(linkChecks, null, 2));

  const crawlSummary = {
    capturedAt: new Date().toISOString(),
    siteOrigin: SITE_ORIGIN,
    sitemapUrlCount: sitemapEntries.length,
    pageCount: pageSummaries.length,
    screenshotPages: pageSummaries
      .filter((pageSummary) => screenshotPaths.has(new URL(pageSummary.sitemap.loc).pathname))
      .map((pageSummary) => pageSummary.sitemap.loc),
    pages: pageSummaries.map((pageSummary) => ({
      url: pageSummary.sitemap.loc,
      lastmod: pageSummary.sitemap.lastmod,
      status: pageSummary.fetch.status,
      title: pageSummary.title,
      metaDescription: pageSummary.metaDescription,
      h1: pageSummary.headings.filter((heading) => heading.level === "h1").map((heading) => heading.text),
      h2: pageSummary.headings.filter((heading) => heading.level === "h2").map((heading) => heading.text),
      wordCount: pageSummary.wordCount,
      links: pageSummary.links.length,
      visibleImages: pageSummary.images.filter((image) => image.visible).length,
      visibleImagesMissingAlt: pageSummary.images.filter(
        (image) => image.visible && (!image.alt || image.alt.trim() === "")
      ).length,
      forms: pageSummary.forms.length,
    })),
    linkChecks: {
      total: linkChecks.length,
      failed: linkChecks.filter((link) => !link.ok),
    },
  };
  await fs.writeFile(path.join(EVIDENCE_DIR, "crawl-summary.json"), JSON.stringify(crawlSummary, null, 2));
  await fs.writeFile(
    path.join(NOTES_DIR, "automated-finding-seeds.md"),
    writeAutomatedNotes({ sitemapEntries, pages: pageSummaries, linkChecks })
  );

  console.log(`Captured ${pageSummaries.length} pages and ${crawlSummary.screenshotPages.length} screenshot page sets.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
