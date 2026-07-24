import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const htmlPath = path.resolve("idea-website-audit/output/idea-free-website-audit.html");
const pdfPath = path.resolve("idea-website-audit/output/idea-free-website-audit.pdf");

async function main() {
  const browser = await chromium.launch({
    executablePath: "/snap/bin/chromium",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const page = await browser.newPage({ viewport: { width: 1240, height: 1754 } });
  await page.setContent(await fs.readFile(htmlPath, "utf8"), { waitUntil: "networkidle" });
  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: false,
  });
  await browser.close();
  console.log(pdfPath);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
