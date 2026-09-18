import { closeSync, constants, existsSync, fstatSync, fsyncSync, ftruncateSync, lstatSync, mkdirSync,
  openSync, readFileSync, writeFileSync, writeSync } from 'node:fs';
import path from 'node:path';
import { git, gitFile, sha256 } from './newsletter-release-review';

const cacheFile = 'tsconfig.tsbuildinfo';
const hashPattern = /^[a-f0-9]{64}$/;
// Fields emitted by the installed TypeScript incremental builder, including
// diagnostics/pending work written when typechecking fails.
const cacheKeys = new Set(['fileNames', 'fileIdsList', 'fileInfos', 'root', 'resolvedRoot', 'options',
  'referencedMap', 'semanticDiagnosticsPerFile', 'emitDiagnosticsPerFile', 'changeFileSet',
  'affectedFilesPendingEmit', 'emitSignatures', 'latestChangedDtsFile', 'errors', 'checkPending',
  'version', 'outSignature', 'pendingEmit']);
const fileInfoKeys = new Set(['version', 'signature', 'affectsGlobalScope', 'impliedFormat']);

export type TypeScriptCacheEvidence = {
  file: typeof cacheFile; status: 'not-tracked' | 'unchanged' | 'restored'; commit: string;
  originalSha256?: string; generatedSha256?: string; archive?: string; compilerVersion?: string;
};

function invalidCache(): never {
  throw new Error('Unexpected TypeScript build cache data; file preserved for review.');
}

export function validateTypeScriptBuildCache(bytes: Buffer, expectedVersion?: string): string {
  let data;
  try { data = JSON.parse(bytes.toString()); } catch { return invalidCache(); }
  if (!data || typeof data !== 'object' || Array.isArray(data) ||
    Object.keys(data).some((key) => !cacheKeys.has(key)) ||
    typeof data.version !== 'string' || !/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(data.version) ||
    (expectedVersion !== undefined && data.version !== expectedVersion) ||
    !Array.isArray(data.fileNames) || !data.fileNames.length ||
    data.fileNames.some((name: unknown) => typeof name !== 'string' || !name || name.includes('\0')) ||
    !Array.isArray(data.fileInfos) || data.fileInfos.length !== data.fileNames.length ||
    !Array.isArray(data.root) || (data.options !== undefined &&
      (!data.options || typeof data.options !== 'object' || Array.isArray(data.options)))) return invalidCache();
  for (const info of data.fileInfos) {
    if (typeof info === 'string') { if (!hashPattern.test(info)) return invalidCache(); continue; }
    if (!info || typeof info !== 'object' || Array.isArray(info) ||
      Object.keys(info).some((key) => !fileInfoKeys.has(key)) || typeof info.version !== 'string' ||
      !hashPattern.test(info.version) ||
      (info.signature !== undefined && info.signature !== false && (typeof info.signature !== 'string' || !hashPattern.test(info.signature))) ||
      (info.affectsGlobalScope !== undefined && typeof info.affectsGlobalScope !== 'boolean') ||
      (info.impliedFormat !== undefined && ![1, 99].includes(info.impliedFormat))) return invalidCache();
  }
  return data.version;
}

function readRegularCache(filename: string) {
  const stat = lstatSync(filename);
  if (!stat.isFile() || stat.nlink !== 1 || stat.size > 32 * 1024 * 1024) {
    throw new Error('TypeScript build cache must be a regular, unshared file; preserved for review.');
  }
  return { stat, bytes: readFileSync(filename) };
}

function writePrivateArchive(filename: string, bytes: Buffer) {
  if (existsSync(filename)) {
    const existing = readRegularCache(filename);
    if ((existing.stat.mode & 0o777) !== 0o600 || !existing.bytes.equals(bytes)) {
      throw new Error('Existing TypeScript cache archive differs; preserved for review.');
    }
  } else writeFileSync(filename, bytes, { mode: 0o600, flag: 'wx' });
}

function prepareCacheRestore(clone: string, commit: string): () => TypeScriptCacheEvidence {
  if (!/^[a-f0-9]{40}$/.test(commit) || git(clone, ['rev-parse', 'HEAD']) !== commit) {
    throw new Error('TypeScript cache capture requires the exact candidate commit.');
  }
  const original = gitFile(clone, commit, cacheFile);
  if (!original) return () => ({ file: cacheFile, status: 'not-tracked', commit });
  const filename = path.join(clone, cacheFile);
  const before = readRegularCache(filename);
  if (!before.bytes.equals(original) || git(clone, ['status', '--porcelain', '--', cacheFile])) {
    throw new Error('TypeScript build cache is already modified; existing work preserved for review.');
  }
  const compilerVersion = validateTypeScriptBuildCache(original);
  const originalSha256 = sha256(original);
  return () => {
    if (git(clone, ['rev-parse', 'HEAD']) !== commit) throw new Error('Candidate changed during quality; cache preserved for review.');
    const current = readRegularCache(filename);
    if (current.bytes.equals(original)) return { file: cacheFile, status: 'unchanged', commit, originalSha256, compilerVersion };
    validateTypeScriptBuildCache(current.bytes, compilerVersion);
    const generatedSha256 = sha256(current.bytes);
    const archiveDirectory = path.join(clone, '.git/newsletter-typescript-cache');
    mkdirSync(archiveDirectory, { recursive: true, mode: 0o700 });
    const archiveStat = lstatSync(archiveDirectory);
    if (!archiveStat.isDirectory() || (archiveStat.mode & 0o777) !== 0o700) {
      throw new Error('TypeScript cache archive directory must be private and regular; preserved for review.');
    }
    const archive = path.join(archiveDirectory, `${commit}-${generatedSha256}.tsbuildinfo`);
    // Preserve the complete generated data before restoring the candidate's
    // original bytes. No source/controller files or Git index are reset.
    writePrivateArchive(archive, current.bytes);
    const evidence: TypeScriptCacheEvidence = { file: cacheFile, status: 'restored', commit,
      originalSha256, generatedSha256, archive, compilerVersion };
    writePrivateArchive(`${archive}.json`, Buffer.from(`${JSON.stringify({ ...evidence, status: 'archived-before-restore' }, null, 2)}\n`));
    const descriptor = openSync(filename, constants.O_RDWR | constants.O_NOFOLLOW);
    try {
      const opened = fstatSync(descriptor);
      const latest = readRegularCache(filename);
      if (!opened.isFile() || opened.nlink !== 1 || opened.ino !== current.stat.ino || opened.dev !== current.stat.dev ||
        latest.stat.ino !== opened.ino || latest.stat.dev !== opened.dev || !latest.bytes.equals(current.bytes)) {
        throw new Error('TypeScript build cache changed during capture; file preserved for review.');
      }
      let offset = 0;
      while (offset < original.length) offset += writeSync(descriptor, original, offset, original.length - offset, offset);
      ftruncateSync(descriptor, original.length); fsyncSync(descriptor);
    } finally { closeSync(descriptor); }
    return evidence;
  };
}

/** Manage only the clean, tracked compiler cache for this quality invocation. */
export async function withTrackedTypeScriptCache<T>(options: { clone: string; commit: string },
  quality: () => Promise<T>, record: (evidence: TypeScriptCacheEvidence) => void = () => undefined): Promise<T> {
  const restore = prepareCacheRestore(options.clone, options.commit);
  try { return await quality(); }
  finally { record(restore()); }
}
