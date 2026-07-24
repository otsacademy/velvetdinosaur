import fs from "node:fs/promises";
import path from "node:path";

const AUDIT_ROOT = path.resolve("sofo-website-audit");
const EVIDENCE_DIR = path.join(AUDIT_ROOT, "evidence");
const PAGE_DIR = path.join(EVIDENCE_DIR, "pages");
const NOTES_DIR = path.join(AUDIT_ROOT, "notes");
const SITE_ORIGIN = "https://www.sofo.org.uk";
const USER_AGENT =
  "VelvetDinosaurAudit/1.0 (+https://velvetdinosaur.com; respectful website audit)";

async function fetchWithTimeout(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": USER_AGENT, accept: "text/html,application/pdf,*/*;q=0.8" },
    });
  } finally {
    clearTimeout(timeout);
  }
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

async function mapConcurrent(items, limit, worker) {
  const results = [];
  let index = 0;
  async function runNext() {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await worker(items[current], current);
    }
  }
  await Promise.all(Array.from({ length: limit }, runNext));
  return results;
}

async function loadPages() {
  const files = (await fs.readdir(PAGE_DIR)).filter((file) => file.endsWith(".json")).sort();
  return Promise.all(files.map(async (file) => JSON.parse(await fs.readFile(path.join(PAGE_DIR, file), "utf8"))));
}

function collectInternalLinks(pages) {
  const links = new Map();
  for (const page of pages) {
    for (const link of page.links || []) {
      if (!link.href || /^(mailto|tel|javascript):/i.test(link.href)) continue;
      let url;
      try {
        url = new URL(link.href);
      } catch {
        continue;
      }
      if (url.origin !== SITE_ORIGIN) continue;
      const normalized = normalizeUrl(url.toString());
      if (!links.has(normalized)) links.set(normalized, { url: normalized, sourcePages: [], linkTexts: [] });
      const record = links.get(normalized);
      record.sourcePages.push(page.url);
      if (link.text) record.linkTexts.push(link.text);
    }
  }
  return Array.from(links.values()).map((record) => ({
    ...record,
    sourcePages: Array.from(new Set(record.sourcePages)).sort(),
    linkTexts: Array.from(new Set(record.linkTexts)).sort(),
  }));
}

function noteLines({ pages, sitemapEntries, linkChecks }) {
  const visibleNavLinks = new Set(
    pages.flatMap((page) =>
      (page.navLinks || [])
        .filter((link) => link.visible && link.href?.startsWith(SITE_ORIGIN))
        .map((link) => normalizeUrl(link.href))
    )
  );
  const hiddenFromNav = sitemapEntries.map((entry) => entry.loc).filter((url) => !visibleNavLinks.has(url));
  const missingDescriptions = pages.filter((page) => !page.metaDescription);
  const imageAltIssues = pages
    .map((page) => ({
      url: page.url,
      missingAlt: (page.images || []).filter((image) => image.visible && (!image.alt || image.alt.trim() === ""))
        .length,
      totalImages: (page.images || []).filter((image) => image.visible).length,
    }))
    .filter((entry) => entry.missingAlt > 0);
  const formLabelIssues = pages
    .map((page) => ({
      url: page.url,
      unlabeledInputs: (page.forms || []).flatMap((form) =>
        (form.inputs || []).filter(
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

  return [
    "# Automated Finding Seeds",
    "",
    `Captured at: ${new Date().toISOString()}`,
    `Sitemap URLs selected for crawl: ${sitemapEntries.length}`,
    `Rendered pages captured: ${pages.length}`,
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
  ]
    .filter(Boolean)
    .join("\n");
}

async function main() {
  await fs.mkdir(NOTES_DIR, { recursive: true });
  const pages = await loadPages();
  const sitemapEntries = JSON.parse(await fs.readFile(path.join(EVIDENCE_DIR, "sitemap-urls.json"), "utf8"));
  const links = collectInternalLinks(pages);

  const linkChecks = await mapConcurrent(links, 12, async (link, index) => {
    if ((index + 1) % 50 === 0) console.log(`Checked ${index + 1}/${links.length} internal links`);
    try {
      const response = await fetchWithTimeout(link.url);
      return {
        ...link,
        status: response.status,
        ok: response.ok,
        finalUrl: response.url,
        contentType: response.headers.get("content-type") || "",
      };
    } catch (error) {
      return { ...link, status: null, ok: false, finalUrl: null, error: error.message };
    }
  });

  await fs.writeFile(path.join(EVIDENCE_DIR, "internal-link-checks.json"), JSON.stringify(linkChecks, null, 2));

  const crawlSummary = {
    capturedAt: new Date().toISOString(),
    siteOrigin: SITE_ORIGIN,
    sitemapUrlCount: sitemapEntries.length,
    pageCount: pages.length,
    screenshotPages: pages
      .filter((page) => {
        const slug = new URL(page.sitemap.loc).pathname.replace(/^\/|\/$/g, "").replace(/[^a-z0-9]+/gi, "-");
        return slug === "" || slug === "home";
      })
      .map((page) => page.sitemap.loc),
    pages: pages.map((page) => ({
      url: page.sitemap.loc,
      lastmod: page.sitemap.lastmod,
      status: page.fetch.status,
      title: page.title,
      metaDescription: page.metaDescription,
      h1: (page.headings || []).filter((heading) => heading.level === "h1").map((heading) => heading.text),
      h2: (page.headings || []).filter((heading) => heading.level === "h2").map((heading) => heading.text),
      wordCount: page.wordCount,
      links: (page.links || []).length,
      visibleImages: (page.images || []).filter((image) => image.visible).length,
      visibleImagesMissingAlt: (page.images || []).filter(
        (image) => image.visible && (!image.alt || image.alt.trim() === "")
      ).length,
      forms: (page.forms || []).length,
    })),
    linkChecks: {
      total: linkChecks.length,
      failed: linkChecks.filter((link) => !link.ok),
    },
  };

  await fs.writeFile(path.join(EVIDENCE_DIR, "crawl-summary.json"), JSON.stringify(crawlSummary, null, 2));
  await fs.writeFile(path.join(NOTES_DIR, "automated-finding-seeds.md"), noteLines({ pages, sitemapEntries, linkChecks }));
  console.log(`Checked ${links.length} internal links; ${linkChecks.filter((link) => !link.ok).length} failed.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
