import fs from "node:fs/promises";
import path from "node:path";

const AUDIT_ROOT = path.resolve("idea-website-audit");
const PAGE_DIR = path.join(AUDIT_ROOT, "evidence", "pages");
const OUTPUT_PATH = path.join(AUDIT_ROOT, "evidence", "external-link-checks.json");
const SITE_ORIGIN = "https://developmentethics.org";
const USER_AGENT =
  "VelvetDinosaurAudit/1.0 (+https://velvetdinosaur.com; respectful website audit)";

async function fetchWithTimeout(url, timeoutMs = 25000) {
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

async function loadLinks() {
  const files = (await fs.readdir(PAGE_DIR)).filter((file) => file.endsWith(".json"));
  const links = new Map();
  for (const file of files) {
    const page = JSON.parse(await fs.readFile(path.join(PAGE_DIR, file), "utf8"));
    for (const link of page.links || []) {
      if (!link.visible || !link.href) continue;
      if (/^(mailto|tel|javascript):/i.test(link.href)) continue;
      let url;
      try {
        url = new URL(link.href);
      } catch {
        continue;
      }
      if (url.origin === SITE_ORIGIN) continue;
      url.hash = "";
      const normalized = url.toString();
      if (!links.has(normalized)) {
        links.set(normalized, { url: normalized, sourcePages: [], linkTexts: [] });
      }
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

async function main() {
  const links = await loadLinks();
  const results = [];
  for (const link of links) {
    console.log(`Checking ${link.url}`);
    try {
      const response = await fetchWithTimeout(link.url);
      results.push({
        ...link,
        status: response.status,
        ok: response.ok,
        finalUrl: response.url,
        contentType: response.headers.get("content-type") || "",
      });
    } catch (error) {
      results.push({ ...link, status: null, ok: false, finalUrl: null, error: error.message });
    }
  }
  await fs.writeFile(
    OUTPUT_PATH,
    JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        checked: results.length,
        failed: results.filter((result) => !result.ok).length,
        results,
      },
      null,
      2
    )
  );
  console.log(`Checked ${results.length} external links; ${results.filter((result) => !result.ok).length} failed.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
