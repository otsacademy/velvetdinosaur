import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const SITE_ORIGIN = "https://developmentethics.org";
const AUDIT_ROOT = path.resolve("idea-website-audit");
const EVIDENCE_DIR = path.join(AUDIT_ROOT, "evidence");
const HTML_DIR = path.join(EVIDENCE_DIR, "html");
const TEXT_DIR = path.join(EVIDENCE_DIR, "text");
const PAGE_DIR = path.join(EVIDENCE_DIR, "pages");
const SCREENSHOT_DIR = path.join(AUDIT_ROOT, "screenshots");
const NOTES_DIR = path.join(AUDIT_ROOT, "notes");
const USER_AGENT =
  "VelvetDinosaurAudit/1.0 (+https://velvetdinosaur.com; respectful website audit)";

const highPriorityPaths = new Set([
  "/",
  "/about/",
  "/officers-board/",
  "/joining-idea-2/",
  "/joining-idea/",
  "/member-resources/",
  "/past-events/",
  "/contact/",
  "/reading-list/",
  "/related-links/",
  "/news-and-events/",
  "/announcements/",
  "/idea-unaula-ibague-2021-congress-development-in-times-of-conflict/",
]);

async function ensureDirs() {
  const dirs = [
    EVIDENCE_DIR,
    HTML_DIR,
    TEXT_DIR,
    PAGE_DIR,
    path.join(SCREENSHOT_DIR, "desktop"),
    path.join(SCREENSHOT_DIR, "mobile"),
    NOTES_DIR,
  ];
  await Promise.all(dirs.map((dir) => fs.mkdir(dir, { recursive: true })));
}

function normalizeUrl(value) {
  const url = new URL(value, SITE_ORIGIN);
  url.hash = "";
  const looksLikeFile = /\.[a-z0-9]{2,6}$/i.test(url.pathname);
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
    .slice(0, 110);
}

function xmlText(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseSitemap(xml) {
  const entries = [];
  const blocks = xml.match(/<url>[\s\S]*?<\/url>/g) || [];
  for (const block of blocks) {
    const loc = block.match(/<loc>([\s\S]*?)<\/loc>/)?.[1];
    if (!loc) continue;
    const lastmod = block.match(/<lastmod>([\s\S]*?)<\/lastmod>/)?.[1] || null;
    const priority = block.match(/<priority>([\s\S]*?)<\/priority>/)?.[1] || null;
    const changefreq = block.match(/<changefreq>([\s\S]*?)<\/changefreq>/)?.[1] || null;
    entries.push({
      loc: normalizeUrl(xmlText(loc.trim())),
      lastmod: lastmod ? xmlText(lastmod.trim()) : null,
      priority,
      changefreq,
    });
  }
  return entries;
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
    const linkData = Array.from(document.querySelectorAll("a")).map((anchor) => ({
      text: clean(anchor.innerText || anchor.getAttribute("aria-label") || anchor.getAttribute("title") || ""),
      href: anchor.href,
      pathname: anchor.pathname,
      rel: anchor.rel || "",
      target: anchor.target || "",
      visible: visible(anchor),
    }));
    const headings = Array.from(document.querySelectorAll("h1,h2,h3")).map((heading) => ({
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
      text: clean(form.innerText).slice(0, 600),
      inputs: Array.from(form.querySelectorAll("input,textarea,select")).map((input) => ({
        type: input.getAttribute("type") || input.tagName.toLowerCase(),
        name: input.getAttribute("name") || "",
        placeholder: input.getAttribute("placeholder") || "",
        ariaLabel: input.getAttribute("aria-label") || "",
        id: input.id || "",
      })),
    }));
    const navLinks = Array.from(
      document.querySelectorAll("nav a, header a, .menu a, .main-navigation a, [role='navigation'] a")
    ).map((anchor) => ({
      text: clean(anchor.innerText || anchor.getAttribute("aria-label") || anchor.getAttribute("title") || ""),
      href: anchor.href,
      visible: visible(anchor),
    }));
    const bodyText = document.body ? document.body.innerText.replace(/\n{3,}/g, "\n\n").trim() : "";
    const metaDescription =
      document.querySelector("meta[name='description']")?.getAttribute("content") ||
      document.querySelector("meta[property='og:description']")?.getAttribute("content") ||
      "";
    const canonical = document.querySelector("link[rel='canonical']")?.getAttribute("href") || "";
    const title = document.title || "";
    return {
      url: window.location.href,
      title,
      metaDescription,
      canonical,
      headings,
      links: linkData,
      navLinks,
      images,
      forms,
      wordCount: bodyText.split(/\s+/).filter(Boolean).length,
      bodyText,
      footerText: clean(document.querySelector("footer")?.innerText || ""),
    };
  });
}

async function checkLinks(pageSummaries, robotsRules) {
  const urls = new Set();
  for (const pageSummary of pageSummaries) {
    for (const link of pageSummary.links || []) {
      if (!link.href || link.href.startsWith("mailto:") || link.href.startsWith("tel:")) continue;
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
      const response = await fetchWithTimeout(url, { method: "GET", redirect: "follow", timeoutMs: 20000 });
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

function writeAutomatedNotes({ sitemapEntries, pages, linkChecks, robotsText }) {
  const hiddenFromNav = sitemapEntries
    .map((entry) => entry.loc)
    .filter((url) => {
      const visibleNavLinks = new Set(
        pages.flatMap((page) =>
          page.navLinks
            .filter((link) => link.visible && link.href?.startsWith(SITE_ORIGIN))
            .map((link) => normalizeUrl(link.href))
        )
      );
      return !visibleNavLinks.has(url);
    });
  const oldPages = sitemapEntries.filter((entry) => {
    if (!entry.lastmod) return false;
    return new Date(entry.lastmod).getFullYear() <= 2022;
  });
  const missingDescriptions = pages.filter((page) => !page.metaDescription);
  const imageAltIssues = pages
    .map((page) => ({
      url: page.url,
      missingAlt: page.images.filter((image) => image.visible && (!image.alt || image.alt.trim() === "")).length,
      totalImages: page.images.filter((image) => image.visible).length,
    }))
    .filter((entry) => entry.missingAlt > 0);
  const failedLinks = linkChecks.filter((link) => !link.ok);
  const noteLines = [
    "# Automated Finding Seeds",
    "",
    `Captured at: ${new Date().toISOString()}`,
    `Robots source includes sitemap entries: ${/Sitemap:/i.test(robotsText) ? "yes" : "no"}`,
    `Main sitemap URLs: ${sitemapEntries.length}`,
    `Rendered pages captured: ${pages.length}`,
    `Internal links checked: ${linkChecks.length}`,
    `Internal link failures/errors: ${failedLinks.length}`,
    `Sitemap pages last modified in 2022 or earlier: ${oldPages.length}`,
    `Rendered pages without meta descriptions: ${missingDescriptions.length}`,
    `Pages with visible images missing alt text: ${imageAltIssues.length}`,
    "",
    "## Navigation Coverage",
    ...hiddenFromNav.map((url) => `- Sitemap URL not present in visible nav capture: ${url}`),
    "",
    "## Old Sitemap Entries",
    ...oldPages.map((entry) => `- ${entry.loc} (lastmod ${entry.lastmod})`),
    "",
    "## Missing Meta Descriptions",
    ...missingDescriptions.map((page) => `- ${page.url}`),
    "",
    "## Image Alt Issues",
    ...imageAltIssues.map((entry) => `- ${entry.url}: ${entry.missingAlt}/${entry.totalImages} visible images missing alt text`),
    "",
    "## Failed Internal Links",
    ...failedLinks.map((link) => `- ${link.url}: ${link.status || link.error}`),
    "",
  ];
  return noteLines.join("\n");
}

async function main() {
  await ensureDirs();

  const robotsUrl = `${SITE_ORIGIN}/robots.txt`;
  const robotsText = await (await fetchWithTimeout(robotsUrl)).text();
  await fs.writeFile(path.join(EVIDENCE_DIR, "robots.txt"), robotsText);
  const robotsRules = parseRobots(robotsText);
  await fs.writeFile(path.join(EVIDENCE_DIR, "robots-rules.json"), JSON.stringify(robotsRules, null, 2));

  const sitemapUrls = [`${SITE_ORIGIN}/sitemap.xml`, `${SITE_ORIGIN}/news-sitemap.xml`];
  const sitemapEntries = [];
  for (const sitemapUrl of sitemapUrls) {
    const response = await fetchWithTimeout(sitemapUrl);
    const xml = await response.text();
    const basename = sitemapUrl.endsWith("news-sitemap.xml") ? "news-sitemap.xml" : "sitemap.xml";
    await fs.writeFile(path.join(EVIDENCE_DIR, basename), xml);
    sitemapEntries.push(...parseSitemap(xml));
  }

  const uniqueEntries = Array.from(
    new Map(sitemapEntries.map((entry) => [entry.loc, entry])).values()
  ).filter((entry) => {
    const url = new URL(entry.loc);
    return url.origin === SITE_ORIGIN && isAllowedByRobots(entry.loc, robotsRules);
  });
  uniqueEntries.sort((a, b) => {
    if (a.loc === `${SITE_ORIGIN}/`) return -1;
    if (b.loc === `${SITE_ORIGIN}/`) return 1;
    return a.loc.localeCompare(b.loc);
  });

  await fs.writeFile(path.join(EVIDENCE_DIR, "sitemap-urls.json"), JSON.stringify(uniqueEntries, null, 2));
  await fs.writeFile(
    path.join(EVIDENCE_DIR, "sitemap-urls.txt"),
    uniqueEntries.map((entry) => `${entry.loc}${entry.lastmod ? `\t${entry.lastmod}` : ""}`).join("\n")
  );

  const browser = await chromium.launch({
    executablePath: "/snap/bin/chromium",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({
    userAgent: USER_AGENT,
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  const pageSummaries = [];
  for (const entry of uniqueEntries) {
    const slug = slugForUrl(entry.loc);
    console.log(`Capturing ${entry.loc}`);
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
        wordCount: 0,
        bodyText: "",
        footerText: "",
        renderError: error.message,
      };
    }

    const summary = {
      sitemap: entry,
      capturedAt: new Date().toISOString(),
      fetch: fetchMeta,
      ...rendered,
    };
    pageSummaries.push(summary);
    await fs.writeFile(path.join(TEXT_DIR, `${slug}.txt`), rendered.bodyText || "");
    await fs.writeFile(path.join(PAGE_DIR, `${slug}.json`), JSON.stringify(summary, null, 2));

    const pathName = new URL(entry.loc).pathname;
    if (highPriorityPaths.has(pathName)) {
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

  const linkChecks = await checkLinks(pageSummaries, robotsRules);
  await fs.writeFile(path.join(EVIDENCE_DIR, "internal-link-checks.json"), JSON.stringify(linkChecks, null, 2));

  const crawlSummary = {
    capturedAt: new Date().toISOString(),
    siteOrigin: SITE_ORIGIN,
    robots: robotsRules,
    sitemapUrlCount: uniqueEntries.length,
    pageCount: pageSummaries.length,
    screenshotPages: pageSummaries
      .filter((pageSummary) => highPriorityPaths.has(new URL(pageSummary.sitemap.loc).pathname))
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
    writeAutomatedNotes({ sitemapEntries: uniqueEntries, pages: pageSummaries, linkChecks, robotsText })
  );

  console.log(`Captured ${pageSummaries.length} pages and ${crawlSummary.screenshotPages.length} screenshot page sets.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
