import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { INSTALLER_ROOT } from '@/lib/installer-paths';

export type EditorSyncStatus = 'queued' | 'running' | 'done';

export type EditorSyncJobSummary = {
  id: string;
  status: EditorSyncStatus;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  exitCode?: number | null;
  site: { slug: string };
  mode: 'dry-run' | 'pr';
  branch?: string;
  prUrl?: string;
  error?: string;
};

type EditorSyncJob = EditorSyncJobSummary & {
  createdBy?: { email?: string; id?: string };
  input?: Record<string, unknown>;
};

const JOB_SUFFIX = '.json';
const EDITOR_SYNC_ROOT = path.join(INSTALLER_ROOT, 'editor-sync');
const EDITOR_SYNC_QUEUED = path.join(EDITOR_SYNC_ROOT, 'queued');
const EDITOR_SYNC_RUNNING = path.join(EDITOR_SYNC_ROOT, 'running');
const EDITOR_SYNC_DONE = path.join(EDITOR_SYNC_ROOT, 'done');
const EDITOR_SYNC_LOGS = path.join(INSTALLER_ROOT, 'logs', 'editor-sync');

function jobFileName(id: string) {
  return `${id}${JOB_SUFFIX}`;
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export async function ensureEditorSyncDirs() {
  await ensureDir(EDITOR_SYNC_ROOT);
  await ensureDir(EDITOR_SYNC_QUEUED);
  await ensureDir(EDITOR_SYNC_RUNNING);
  await ensureDir(EDITOR_SYNC_DONE);
  await ensureDir(EDITOR_SYNC_LOGS);
}

function toSummary(job: EditorSyncJob): EditorSyncJobSummary {
  return {
    id: job.id,
    status: job.status,
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    endedAt: job.endedAt,
    exitCode: job.exitCode,
    site: job.site,
    mode: job.mode,
    branch: job.branch,
    prUrl: job.prUrl,
    error: job.error
  };
}

async function readJobFile(filePath: string) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw) as EditorSyncJob;
}

async function findJobFile(id: string) {
  const locations = [
    { dir: EDITOR_SYNC_QUEUED, status: 'queued' as const },
    { dir: EDITOR_SYNC_RUNNING, status: 'running' as const },
    { dir: EDITOR_SYNC_DONE, status: 'done' as const }
  ];
  for (const location of locations) {
    const filePath = path.join(location.dir, jobFileName(id));
    if (existsSync(filePath)) {
      const job = await readJobFile(filePath);
      job.status = location.status;
      return { filePath, job, status: location.status };
    }
  }
  return null;
}

export async function createEditorSyncJob(job: Omit<EditorSyncJob, 'id' | 'status' | 'createdAt'>) {
  await ensureEditorSyncDirs();
  const id = crypto.randomUUID();
  const payload: EditorSyncJob = {
    id,
    status: 'queued',
    createdAt: new Date().toISOString(),
    ...job
  };
  const filePath = path.join(EDITOR_SYNC_QUEUED, jobFileName(id));
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2));
  return toSummary(payload);
}

export async function getEditorSyncJob(id: string) {
  const found = await findJobFile(id);
  if (!found) return null;
  return toSummary(found.job);
}

export async function readEditorSyncJob(id: string) {
  const found = await findJobFile(id);
  return found?.job ?? null;
}

async function writeJob(filePath: string, job: EditorSyncJob) {
  await fs.writeFile(filePath, JSON.stringify(job, null, 2));
}

export async function updateEditorSyncJob(
  id: string,
  updater: (job: EditorSyncJob) => EditorSyncJob,
  nextStatus?: EditorSyncStatus
) {
  const found = await findJobFile(id);
  if (!found) return null;
  const updated = updater(found.job);
  const status = nextStatus ?? found.status;
  updated.status = status;
  let targetDir = EDITOR_SYNC_QUEUED;
  if (status === 'running') targetDir = EDITOR_SYNC_RUNNING;
  if (status === 'done') targetDir = EDITOR_SYNC_DONE;
  const targetPath = path.join(targetDir, jobFileName(id));
  await writeJob(targetPath, updated);
  if (targetPath !== found.filePath) {
    await fs.rm(found.filePath, { force: true });
  }
  return updated;
}

export async function appendEditorSyncLog(id: string, line: string) {
  await ensureEditorSyncDirs();
  const logPath = path.join(EDITOR_SYNC_LOGS, `${id}.log`);
  await fs.appendFile(logPath, line, 'utf8');
}

export async function readEditorSyncLog(id: string, offset: number) {
  const logPath = path.join(EDITOR_SYNC_LOGS, `${id}.log`);
  if (!existsSync(logPath)) {
    return { chunk: '', nextOffset: offset, exists: false };
  }
  const raw = await fs.readFile(logPath, 'utf8');
  const safeOffset = Math.max(0, Math.min(offset, raw.length));
  const chunk = raw.slice(safeOffset);
  return { chunk, nextOffset: raw.length, exists: true };
}
