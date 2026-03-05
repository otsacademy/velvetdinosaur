import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  JOBS_DONE,
  JOBS_LOGS,
  JOBS_QUEUED,
  JOBS_RUNNING,
  JOBS_ROOT
} from '@/lib/installer-paths';

export type InstallerJobStatus = 'queued' | 'running' | 'done';

export type InstallerJobSummary = {
  id: string;
  status: InstallerJobStatus;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  exitCode?: number | null;
  site: {
    slug: string;
    domain: string;
  };
};

type InstallerJob = InstallerJobSummary & {
  createdBy?: { email?: string; id?: string };
  input: Record<string, unknown>;
  secrets?: Record<string, unknown>;
};

const JOB_SUFFIX = '.json';

function jobFileName(id: string) {
  return `${id}${JOB_SUFFIX}`;
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export async function ensureInstallerDirs() {
  await ensureDir(JOBS_ROOT);
  await ensureDir(JOBS_QUEUED);
  await ensureDir(JOBS_RUNNING);
  await ensureDir(JOBS_DONE);
  await ensureDir(JOBS_LOGS);
}

export async function createInstallerJob(job: Omit<InstallerJob, 'id' | 'status' | 'createdAt'>) {
  await ensureInstallerDirs();
  const id = crypto.randomUUID();
  const payload: InstallerJob = {
    id,
    status: 'queued',
    createdAt: new Date().toISOString(),
    ...job
  };
  const filePath = path.join(JOBS_QUEUED, jobFileName(id));
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2));
  return toSummary(payload);
}

function toSummary(job: InstallerJob): InstallerJobSummary {
  return {
    id: job.id,
    status: job.status,
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    endedAt: job.endedAt,
    exitCode: job.exitCode,
    site: job.site
  };
}

async function readJobFile(filePath: string) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw) as InstallerJob;
}

async function listJobsIn(dir: string, status: InstallerJobStatus) {
  if (!existsSync(dir)) return [];
  const entries = await fs.readdir(dir);
  const jobs = await Promise.all(
    entries
      .filter((name) => name.endsWith(JOB_SUFFIX))
      .map(async (name) => {
        const job = await readJobFile(path.join(dir, name));
        if (!job.id) {
          job.id = path.basename(name, JOB_SUFFIX);
        }
        job.status = status;
        return toSummary(job);
      })
  );
  return jobs;
}

export async function listInstallerJobs() {
  const queued = await listJobsIn(JOBS_QUEUED, 'queued');
  const running = await listJobsIn(JOBS_RUNNING, 'running');
  const done = await listJobsIn(JOBS_DONE, 'done');
  return [...queued, ...running, ...done].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

export async function getInstallerJob(id: string) {
  const locations = [
    { dir: JOBS_QUEUED, status: 'queued' as const },
    { dir: JOBS_RUNNING, status: 'running' as const },
    { dir: JOBS_DONE, status: 'done' as const }
  ];
  for (const location of locations) {
    const filePath = path.join(location.dir, jobFileName(id));
    if (!existsSync(filePath)) continue;
    const job = await readJobFile(filePath);
    if (!job.id) {
      job.id = id;
    }
    job.status = location.status;
    return toSummary(job);
  }
  return null;
}

export async function readInstallerLog(id: string, offset: number) {
  const logPath = path.join(JOBS_LOGS, `${id}.log`);
  if (!existsSync(logPath)) {
    return { chunk: '', nextOffset: offset, exists: false };
  }
  const raw = await fs.readFile(logPath, 'utf8');
  const safeOffset = Math.max(0, Math.min(offset, raw.length));
  const chunk = raw.slice(safeOffset);
  return { chunk, nextOffset: raw.length, exists: true };
}
