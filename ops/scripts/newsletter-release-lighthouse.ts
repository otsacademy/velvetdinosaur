import { lstatSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { sha256 } from './newsletter-release-review';

const categories = ['performance', 'accessibility', 'best-practices', 'seo'] as const;
type Scores = Record<typeof categories[number], number>;
type Run = { fetchedAt: string; report: string; sha256: string; scores: Scores };
type Page = { url: string; runs: Run[]; categories: Record<string, { scores: number[]; median: number }> };
type Viewport = { viewport: string; configSha256: string; manifestSha256: string; pages: Page[] };
type Summary = {
  version: number; site: string; commit: string; qualityStartedAt: string; checkedAt: string;
  status: 'passed' | 'skipped' | 'failed'; reason?: string; viewports: Viewport[];
};

function readLocalJson(root: string, file: string) {
  const absolute = path.resolve(root, file);
  const relative = path.relative(realpathSync(root), realpathSync(absolute));
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error('Lighthouse evidence resolves outside the release checkout.');
  }
  const stat = lstatSync(absolute);
  if (!stat.isFile() || stat.size > 32 * 1024 * 1024) throw new Error('Invalid Lighthouse evidence file.');
  const bytes = readFileSync(absolute);
  try { return { value: JSON.parse(bytes.toString()), digest: sha256(bytes), relative }; }
  catch { throw new Error('Invalid Lighthouse evidence JSON.'); }
}

function reportUrl(value: unknown): URL {
  if (typeof value !== 'string') throw new Error('Missing Lighthouse report URL.');
  let url: URL;
  try { url = new URL(value); } catch { throw new Error('Invalid Lighthouse report URL.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error('Unsupported Lighthouse report URL fields.');
  }
  return url;
}

/** Read existing reports only. This supplements, and never alters, site LHCI gates. */
export function verifyNewsletterLighthouse(options: {
  clone: string; site: string; commit: string; qualityStartedAt: number; reportFile: string;
}): Summary {
  const checkedAt = Date.now();
  const summary: Summary = { version: 1, site: options.site, commit: options.commit,
    qualityStartedAt: new Date(options.qualityStartedAt).toISOString(), checkedAt: new Date(checkedAt).toISOString(),
    status: 'failed', viewports: [] };
  const save = () => {
    mkdirSync(path.dirname(options.reportFile), { recursive: true, mode: 0o700 });
    writeFileSync(options.reportFile, `${JSON.stringify(summary, null, 2)}\n`, { mode: 0o600 });
  };
  try {
    const manifest = readLocalJson(options.clone, 'quality/gates.json').value;
    if (!Array.isArray(manifest.targets) || !manifest.targets.length ||
      manifest.targets.some((target: { gates?: unknown }) => !Array.isArray(target.gates))) {
      throw new Error('Cannot determine required Lighthouse gates from the quality manifest.');
    }
    const names = manifest.targets.flatMap((target: { gates: (string | { name: string })[] }) =>
      target.gates.map((gate) => typeof gate === 'string' ? gate : gate.name));
    if (!names.some((name: string) => name === 'lighthouse' || name.startsWith('lighthouse:'))) {
      summary.status = 'skipped'; summary.reason = 'The site quality manifest declares no Lighthouse gate.'; save(); return summary;
    }
    for (const viewport of ['mobile', 'desktop']) {
      const config = readLocalJson(options.clone, `lighthouserc.${viewport}.json`);
      const collect = config.value.ci?.collect;
      const upload = config.value.ci?.upload;
      if (collect?.numberOfRuns !== 3 || collect.settings?.formFactor !== viewport ||
        !Array.isArray(collect.url) || !collect.url.length || upload?.target !== 'filesystem' || typeof upload.outputDir !== 'string') {
        throw new Error(`Unsupported ${viewport} Lighthouse report configuration.`);
      }
      for (const category of categories) {
        const assertion = config.value.ci?.assert?.assertions?.[`categories:${category}`];
        if (!Array.isArray(assertion) || assertion[0] !== 'error' || assertion[1]?.minScore !== 1) {
          throw new Error(`Missing required ${viewport} Lighthouse category assertion: ${category}.`);
        }
      }
      const urls = collect.url.map((value: unknown) => reportUrl(value).href) as string[];
      if (new Set(urls).size !== urls.length) throw new Error('Duplicate configured Lighthouse URL.');
      const exported = readLocalJson(options.clone, path.join(upload.outputDir, 'manifest.json'));
      if (!Array.isArray(exported.value)) throw new Error('Invalid Lighthouse export manifest.');
      const evidence: Viewport = { viewport, configSha256: config.digest, manifestSha256: exported.digest,
        pages: urls.map((url) => ({ url: reportUrl(url).pathname, runs: [], categories: {} })) };
      summary.viewports.push(evidence);
      const files = new Set<string>(); const hashes = new Set<string>(); const runs = new Set<string>();
      for (const entry of exported.value) {
        const url = reportUrl(entry.url).href;
        const index = urls.indexOf(url);
        if (index === -1 || typeof entry.jsonPath !== 'string') throw new Error('Unconfigured Lighthouse report in export manifest.');
        const report = readLocalJson(options.clone, entry.jsonPath);
        if (files.has(report.relative) || hashes.has(report.digest)) throw new Error('Duplicate Lighthouse report.');
        files.add(report.relative); hashes.add(report.digest);
        const data = report.value;
        const fetchedAt = typeof data.fetchTime === 'string' ? Date.parse(data.fetchTime) : NaN;
        if (!Number.isFinite(fetchedAt) || fetchedAt < options.qualityStartedAt || fetchedAt > checkedAt) {
          throw new Error('Lighthouse reports must be fresh for this quality run.');
        }
        if (data.runtimeError || data.configSettings?.formFactor !== viewport || reportUrl(data.requestedUrl).href !== url) {
          throw new Error('Lighthouse report does not match its configured URL and viewport.');
        }
        const identity = `${url}:${fetchedAt}`;
        if (runs.has(identity)) throw new Error('Duplicate Lighthouse run timestamp.');
        runs.add(identity);
        const scores = {} as Scores;
        for (const category of categories) {
          const score = data.categories?.[category]?.score;
          if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 1) {
            throw new Error(`Missing or invalid Lighthouse category score: ${category}.`);
          }
          scores[category] = score;
        }
        evidence.pages[index].runs.push({ fetchedAt: new Date(fetchedAt).toISOString(), report: report.relative, sha256: report.digest, scores });
      }
      for (const page of evidence.pages) {
        if (page.runs.length !== 3) throw new Error('Exactly three fresh Lighthouse reports are required per URL and viewport.');
        page.runs.sort((a, b) => a.fetchedAt.localeCompare(b.fetchedAt));
        for (const category of categories) {
          const scores = page.runs.map((run) => run.scores[category]);
          const median = [...scores].sort((a, b) => a - b)[1];
          page.categories[category] = { scores, median };
        }
      }
    }
    if (summary.viewports.some((viewport) => viewport.pages.some((page) =>
      Object.values(page.categories).some((category) => category.median !== 1)))) {
      throw new Error('Lighthouse category medians must be exactly 100 before promotion or deployment.');
    }
    summary.status = 'passed'; save(); return summary;
  } catch (error) {
    // Filesystem/JSON errors can contain raw paths or contents; retain only our own safe messages.
    summary.reason = error instanceof Error && !('code' in error) ? error.message : 'Lighthouse evidence file is missing or unreadable.';
    save(); throw new Error(summary.reason);
  }
}
