import fs from "node:fs/promises";
import path from "node:path";

const lighthouseDir = path.resolve("idea-website-audit/evidence/lighthouse");
const outputPath = path.join(lighthouseDir, "lighthouse-summary.json");

function score(value) {
  return value == null ? null : Math.round(value * 100);
}

async function main() {
  const files = (await fs.readdir(lighthouseDir)).filter((file) => file.endsWith(".report.json")).sort();
  const reports = [];
  for (const file of files) {
    const report = JSON.parse(await fs.readFile(path.join(lighthouseDir, file), "utf8"));
    reports.push({
      file,
      requestedUrl: report.requestedUrl,
      fetchTime: report.fetchTime,
      scores: Object.fromEntries(
        Object.entries(report.categories).map(([key, category]) => [key, score(category.score)])
      ),
      metrics: {
        firstContentfulPaint: report.audits["first-contentful-paint"]?.displayValue || null,
        largestContentfulPaint: report.audits["largest-contentful-paint"]?.displayValue || null,
        speedIndex: report.audits["speed-index"]?.displayValue || null,
        cumulativeLayoutShift: report.audits["cumulative-layout-shift"]?.displayValue || null,
        totalBlockingTime: report.audits["total-blocking-time"]?.displayValue || null,
      },
      failedBinaryAudits: Object.entries(report.audits)
        .filter(([, audit]) => audit.score === 0 && audit.scoreDisplayMode === "binary")
        .map(([id, audit]) => ({
          id,
          title: audit.title,
          itemCount: audit.details?.items?.length || 0,
        })),
      diagnostics: {
        totalByteWeight: report.audits["total-byte-weight"]?.displayValue || null,
        largestContentfulPaintElement:
          report.audits["largest-contentful-paint-element"]?.details?.items?.[0]?.node?.nodeLabel || null,
      },
    });
  }
  await fs.writeFile(
    outputPath,
    JSON.stringify({ capturedAt: new Date().toISOString(), reports }, null, 2)
  );
  console.log(`Wrote ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
