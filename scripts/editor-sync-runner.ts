import { spawnSync } from 'node:child_process';
import path from 'node:path';
import {
  appendEditorSyncLog,
  readEditorSyncJob,
  updateEditorSyncJob
} from '@/lib/editor-sync-jobs';
import {
  diffTouchesDenied,
  matchesAny,
  readEditorSyncManifest,
  resolveSitePath,
  runEditorSyncDryRun
} from '@/lib/editor-sync-service';
import { PLATFORM_ROOT } from '@/lib/installer-paths';

function formatLine(message: string) {
  const stamp = new Date().toISOString();
  return `[${stamp}] ${message}\n`;
}

async function logLine(jobId: string, message: string) {
  await appendEditorSyncLog(jobId, formatLine(message));
}

async function runCommand(jobId: string, command: string, cwd: string) {
  const result = spawnSync(command, {
    cwd,
    shell: true,
    encoding: 'utf8'
  });
  if (result.stdout) {
    await appendEditorSyncLog(jobId, result.stdout);
  }
  if (result.stderr) {
    await appendEditorSyncLog(jobId, result.stderr);
  }
  if (result.status !== 0) {
    throw new Error(`Command failed: ${command}`);
  }
  return result.stdout?.trim() || '';
}

function resolveBaseRef() {
  const baseRef = 'origin/main';
  const check = spawnSync('git', ['rev-parse', '--verify', baseRef], {
    cwd: PLATFORM_ROOT,
    stdio: 'ignore'
  });
  if (check.status === 0) return baseRef;
  return 'HEAD~1';
}

function listChangedFiles(baseRef: string) {
  const diff = spawnSync('git', ['diff', '--name-only', `${baseRef}...HEAD`], {
    cwd: PLATFORM_ROOT,
    encoding: 'utf8'
  });
  if (diff.status !== 0 || typeof diff.stdout !== 'string') {
    return [];
  }
  return diff.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function extractPrUrl(output: string) {
  const match = output.match(/https:\/\/github\.com\/[^\s]+\/pull\/\d+/);
  return match?.[0] || null;
}

function normalizePath(p: string) {
  return p.replace(/\\/g, '/');
}

async function runJob(jobId: string) {
  const job = await readEditorSyncJob(jobId);
  if (!job) {
    throw new Error(`Editor sync job not found: ${jobId}`);
  }

  await updateEditorSyncJob(jobId, (current) => ({
    ...current,
    status: 'running',
    startedAt: new Date().toISOString()
  }));

  await logLine(jobId, `Editor sync job started for site "${job.site.slug}"`);

  const manifest = readEditorSyncManifest();
  const deny = manifest.deny || [];

  if (job.mode !== 'pr') {
    await logLine(jobId, `Unsupported mode: ${job.mode}`);
    await updateEditorSyncJob(jobId, (current) => ({
      ...current,
      status: 'done',
      endedAt: new Date().toISOString(),
      exitCode: 1,
      error: `Unsupported mode: ${job.mode}`
    }));
    return;
  }

  try {
    await logLine(jobId, 'Running editor sync dry-run...');
    const diff = runEditorSyncDryRun(job.site.slug);
    const denied = diffTouchesDenied(diff, deny);
    if (denied.length > 0) {
      await logLine(jobId, `Denied paths detected: ${denied.join(', ')}`);
      throw new Error('Editor sync touches denied paths.');
    }

    await logLine(jobId, `Dry-run summary: +${diff.added.length} ~${diff.changed.length}`);

    const branch = job.branch || `chore/${job.site.slug}-editor-sync`;
    await logLine(jobId, `Running sync on branch ${branch}...`);
    await runCommand(jobId, `bun run sync:editor --site ${job.site.slug} --branch ${branch}`, PLATFORM_ROOT);

    const baseRef = resolveBaseRef();
    const changedFiles = listChangedFiles(baseRef);
    if (changedFiles.length === 0) {
      await logLine(jobId, 'No changes detected after sync; skipping PR creation.');
      await updateEditorSyncJob(jobId, (current) => ({
        ...current,
        status: 'done',
        endedAt: new Date().toISOString(),
        exitCode: 0,
        branch
      }));
      return;
    }

    const siteRoot = resolveSitePath(job.site.slug).root;
    const sitePrefix = `${normalizePath(path.relative(PLATFORM_ROOT, siteRoot))}/`;
    const deniedFiles: string[] = [];
    for (const file of changedFiles) {
      const normalized = normalizePath(file);
      if (!normalized.startsWith(sitePrefix)) {
        deniedFiles.push(file);
        continue;
      }
      const rel = normalized.slice(sitePrefix.length);
      if (matchesAny(deny, rel)) {
        deniedFiles.push(file);
      }
    }
    if (deniedFiles.length > 0) {
      await logLine(jobId, `Denied files in commit: ${deniedFiles.join(', ')}`);
      throw new Error('Editor sync produced denied file changes.');
    }

    await logLine(jobId, 'Pushing branch to origin...');
    await runCommand(jobId, `git push -u origin ${branch}`, PLATFORM_ROOT);

    const prTitle = `chore(${job.site.slug}): editor baseline sync`;
    const prBody = [
      'Editor baseline sync only (no public theme/components/content).',
      '',
      '- theme-smoke ran ✅',
      '- quality gates ran ✅',
      '',
      'Notes:',
      '- Denylist enforced: app/globals.css, app/(site)/**, components/blocks/**, registry/**, public/**'
    ].join('\n');

    await logLine(jobId, 'Creating PR via gh...');
    const prOutput = await runCommand(
      jobId,
      `gh pr create --title "${prTitle}" --body "${prBody.replace(/"/g, '\\"')}" --head ${branch} --base main`,
      PLATFORM_ROOT
    );
    const prUrl = extractPrUrl(prOutput);
    if (prUrl) {
      await logLine(jobId, `PR created: ${prUrl}`);
    } else {
      await logLine(jobId, 'PR created, but URL not detected in output.');
    }

    await updateEditorSyncJob(jobId, (current) => ({
      ...current,
      status: 'done',
      endedAt: new Date().toISOString(),
      exitCode: 0,
      prUrl: prUrl || current.prUrl,
      branch
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Editor sync failed.';
    await logLine(jobId, message);
    await updateEditorSyncJob(jobId, (current) => ({
      ...current,
      status: 'done',
      endedAt: new Date().toISOString(),
      exitCode: 1,
      error: message
    }));
  }
}

function getJobId() {
  const args = process.argv.slice(2);
  const idx = args.indexOf('--job');
  if (idx === -1 || !args[idx + 1]) return null;
  return args[idx + 1];
}

const jobId = getJobId();
if (!jobId) {
  console.error('Usage: bun scripts/editor-sync-runner.ts --job <id>');
  process.exit(1);
}

runJob(jobId).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
