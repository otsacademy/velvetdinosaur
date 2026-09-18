import { afterEach, expect, test } from 'bun:test';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { git, sha256 } from './newsletter-release-review';
import { validateTypeScriptBuildCache, withTrackedTypeScriptCache, type TypeScriptCacheEvidence } from './newsletter-release-typescript-cache';

const temporary: string[] = [];
afterEach(() => { for (const root of temporary.splice(0)) rmSync(root, { recursive: true, force: true }); });
const cacheName = 'tsconfig.tsbuildinfo';
function cacheBytes(digit = 'a') {
  return Buffer.from(JSON.stringify({ fileNames: ['./example.ts'], fileInfos: [digit.repeat(64)], root: [1], options: {}, version: '5.9.3' }));
}
function commit(root: string) {
  git(root, ['add', '.']); git(root, ['-c', 'user.name=Tests', '-c', 'user.email=tests@localhost', 'commit', '-qm', 'fixture']);
  return git(root, ['rev-parse', 'HEAD']);
}
function compile(root: string) {
  return spawnSync(process.execPath, [fileURLToPath(new URL('../../node_modules/typescript/bin/tsc', import.meta.url)), '--project', root],
    { cwd: root, encoding: 'utf8' });
}
function fixture(realCompiler = false, tracked = true) {
  const clone = mkdtempSync(path.join(tmpdir(), 'newsletter-build-cache-')); temporary.push(clone);
  git(clone, ['init', '-qb', 'develop']); writeFileSync(path.join(clone, 'example.ts'), 'export const answer = 42;\n');
  writeFileSync(path.join(clone, 'tsconfig.json'), JSON.stringify({ compilerOptions: {
    incremental: true, tsBuildInfoFile: cacheName, noEmit: true, strict: true, types: [], skipLibCheck: true, target: 'ES2022'
  }, include: ['example.ts'] }));
  if (tracked) {
    if (realCompiler) expect(compile(clone).status).toBe(0);
    else writeFileSync(path.join(clone, cacheName), cacheBytes());
  }
  const expectedCommit = commit(clone);
  return { clone, commit: expectedCommit, filename: path.join(clone, cacheName) };
}

test('real TypeScript output is privately archived and only original tracked cache bytes are restored', async () => {
  const options = fixture(true); const original = readFileSync(options.filename); let generated: Buffer | undefined;
  let evidence: TypeScriptCacheEvidence | undefined;
  await withTrackedTypeScriptCache(options, async () => {
    writeFileSync(path.join(options.clone, 'example.ts'), 'export const answer = "updated";\n');
    writeFileSync(path.join(options.clone, 'unrelated.txt'), 'preserve this work');
    expect(compile(options.clone).status).toBe(0); generated = readFileSync(options.filename);
    expect(generated.equals(original)).toBe(false);
  }, (value) => { evidence = value; });
  expect(readFileSync(options.filename).equals(original)).toBe(true);
  expect(evidence?.status).toBe('restored');
  expect(evidence?.originalSha256).toBe(sha256(original));
  expect(readFileSync(evidence!.archive!).equals(generated!)).toBe(true);
  expect(statSync(evidence!.archive!).mode & 0o777).toBe(0o600);
  expect(git(options.clone, ['diff', '--name-only', '--', cacheName])).toBe('');
  expect(readFileSync(path.join(options.clone, 'unrelated.txt'), 'utf8')).toBe('preserve this work');
  expect(readFileSync(path.join(options.clone, 'example.ts'), 'utf8')).toContain('updated');
});

test('a failed real typecheck still restores its valid generated cache and preserves the gate failure', async () => {
  const options = fixture(true); const original = readFileSync(options.filename); let evidence: TypeScriptCacheEvidence | undefined;
  await expect(withTrackedTypeScriptCache(options, async () => {
    writeFileSync(path.join(options.clone, 'example.ts'), 'export const answer: number = "invalid";\n');
    expect(compile(options.clone).status).toBe(2);
    expect(readFileSync(options.filename).equals(original)).toBe(false);
    throw new Error('quality typecheck failed');
  }, (value) => { evidence = value; })).rejects.toThrow('quality typecheck failed');
  expect(readFileSync(options.filename).equals(original)).toBe(true);
  expect(evidence?.status).toBe('restored');
  expect(validateTypeScriptBuildCache(readFileSync(evidence!.archive!))).toBe('5.9.3');
});

test('pre-existing modified cache blocks execution without resetting user work', async () => {
  const options = fixture(); const altered = cacheBytes('b'); writeFileSync(options.filename, altered);
  let ran = false;
  await expect(withTrackedTypeScriptCache(options, async () => { ran = true; })).rejects.toThrow('already modified');
  expect(ran).toBe(false); expect(readFileSync(options.filename).equals(altered)).toBe(true);
  expect(existsSync(path.join(options.clone, '.git/newsletter-typescript-cache'))).toBe(false);
});

test('malformed or unexpected non-cache data produced during quality is preserved for review', async () => {
  for (const altered of [Buffer.from('unfinished user notes'), Buffer.from(JSON.stringify({ ...JSON.parse(cacheBytes().toString()), custom: 'user data' })),
    Buffer.from(JSON.stringify({ ...JSON.parse(cacheBytes().toString()), fileInfos: [] }))]) {
    const options = fixture();
    await expect(withTrackedTypeScriptCache(options, async () => { writeFileSync(options.filename, altered); })).rejects.toThrow('Unexpected TypeScript');
    expect(readFileSync(options.filename).equals(altered)).toBe(true);
    expect(existsSync(path.join(options.clone, '.git/newsletter-typescript-cache'))).toBe(false);
  }
});

test('replacement symlinks and changed candidate commits cannot trigger cache restoration', async () => {
  const linked = fixture(); const other = path.join(linked.clone, 'other-cache'); writeFileSync(other, cacheBytes('b'));
  await expect(withTrackedTypeScriptCache(linked, async () => {
    unlinkSync(linked.filename); symlinkSync(other, linked.filename);
  })).rejects.toThrow('regular, unshared');
  expect(readFileSync(other).equals(cacheBytes('b'))).toBe(true);
  const changed = fixture();
  await expect(withTrackedTypeScriptCache(changed, async () => {
    writeFileSync(changed.filename, cacheBytes('b')); commit(changed.clone);
  })).rejects.toThrow('Candidate changed');
  expect(readFileSync(changed.filename).equals(cacheBytes('b'))).toBe(true);
});

test('untracked caches and unchanged tracked caches are left alone and recorded explicitly', async () => {
  const untracked = fixture(false, false); writeFileSync(untracked.filename, 'untracked user content');
  let evidence: TypeScriptCacheEvidence | undefined;
  await withTrackedTypeScriptCache(untracked, async () => undefined, (value) => { evidence = value; });
  expect(evidence?.status).toBe('not-tracked'); expect(readFileSync(untracked.filename, 'utf8')).toBe('untracked user content');
  const unchanged = fixture();
  await withTrackedTypeScriptCache(unchanged, async () => undefined, (value) => { evidence = value; });
  expect(evidence?.status).toBe('unchanged');
  expect(existsSync(path.join(unchanged.clone, '.git/newsletter-typescript-cache'))).toBe(false);
});
