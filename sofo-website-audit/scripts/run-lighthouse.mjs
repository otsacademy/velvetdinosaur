import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

const lighthouseDir = path.resolve("sofo-website-audit/evidence/lighthouse");
const chromeFlags = "--headless --no-sandbox --disable-dev-shm-usage";

const targets = [
  { slug: "home", url: "https://www.sofo.org.uk/" },
  { slug: "visit-us", url: "https://www.sofo.org.uk/visit-us/" },
  { slug: "whats-on", url: "https://www.sofo.org.uk/whats-on/" },
  { slug: "learning-at-sofo", url: "https://www.sofo.org.uk/learning-at-sofo/" },
  { slug: "shop", url: "https://www.sofo.org.uk/shop/" },
];

function score(value) {
  return value == null ? null : Math.round(value * 100);
}

function run(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("close", (code) => resolve(code));
  });
}

async function summarize() {
  const files = (await fs.readdir(lighthouseDir)).filter((file) => file.endsWith(".report.json")).sort();
  const reports = [];
  for (const file of files) {
    const report = JSON.parse(await fs.readFile(path.join(lighthouseDir, file), "utf8"));
    reports.push({
      file,
      requestedUrl: report.requestedUrl,
      finalDisplayedUrl: report.finalDisplayedUrl,
      fetchTime: report.fetchTime,
      scores: Object.fromEntries(
        Object.entries(report.categories || {}).map(([key, category]) => [key, score(category.score)])
      ),
      metrics: {
        firstContentfulPaint: report.audits["first-contentful-paint"]?.displayValue || null,
        largestContentfulPaint: report.audits["largest-contentful-paint"]?.displayValue || null,
        speedIndex: report.audits["speed-index"]?.displayValue || null,
        cumulativeLayoutShift: report.audits["cumulative-layout-shift"]?.displayValue || null,
        totalBlockingTime: report.audits["total-blocking-time"]?.displayValue || null,
      },
      diagnostics: {
        totalByteWeight: report.audits["total-byte-weight"]?.displayValue || null,
        largestContentfulPaintElement:
          report.audits["largest-contentful-paint-element"]?.details?.items?.[0]?.node?.nodeLabel || null,
      },
      failedBinaryAudits: Object.entries(report.audits || {})
        .filter(([, audit]) => audit.score === 0 && audit.scoreDisplayMode === "binary")
        .map(([id, audit]) => ({
          id,
          title: audit.title,
          itemCount: audit.details?.items?.length || 0,
        })),
    });
  }

  await fs.writeFile(
    path.join(lighthouseDir, "lighthouse-summary.json"),
    JSON.stringify({ capturedAt: new Date().toISOString(), reports }, null, 2)
  );
}

async function main() {
  await fs.mkdir(lighthouseDir, { recursive: true });

  for (const target of targets) {
    for (const profile of ["mobile", "desktop"]) {
      const outputPath = path.join(lighthouseDir, `${target.slug}-${profile}.report`);
      const args = [
        "lighthouse",
        target.url,
        "--quiet",
        "--output=json",
        "--output=html",
        `--output-path=${outputPath}`,
        `--chrome-flags=${chromeFlags}`,
      ];
      if (profile === "desktop") args.push("--preset=desktop");
      console.log(`Running Lighthouse ${profile}: ${target.url}`);
      const code = await run("bunx", args);
      if (code !== 0) console.warn(`Lighthouse exited with code ${code} for ${target.slug}-${profile}`);
    }
  }

  await summarize();
  console.log(`Wrote ${path.join(lighthouseDir, "lighthouse-summary.json")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
