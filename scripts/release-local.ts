import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { assertLighthousePortsFree, verifyNewsletterLighthouse } from '../ops/scripts/newsletter-release-lighthouse';

type Options = {
  envFile: string;
  skipPush: boolean;
};

function parseArgs(argv: string[]): Options {
  let envFile = '.env.production';
  let skipPush = false;

  for (const arg of argv) {
    if (arg.startsWith('--env-file=')) {
      envFile = arg.slice('--env-file='.length).trim() || envFile;
      continue;
    }
    if (arg === '--skip-quality') {
      throw new Error('Release requires all quality gates. --skip-quality is not supported.');
    }
    if (arg === '--skip-push') {
      skipPush = true;
    }
  }

  return { envFile, skipPush };
}

function run(command: string, args: string[], cwd: string) {
  const result = spawnSync(command, args, {
    cwd,
    env: process.env,
    stdio: 'inherit'
  });

  if (typeof result.status !== 'number' || result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }
}

function readStdout(command: string, args: string[], cwd: string) {
  const result = spawnSync(command, args, {
    cwd,
    env: process.env,
    encoding: 'utf8'
  });

  if (typeof result.status !== 'number' || result.status !== 0) {
    throw new Error((result.stderr || result.stdout || '').trim() || `Command failed: ${command}`);
  }

  return (result.stdout || '').trim();
}

function hasRemote(cwd: string, remote: string) {
  const result = spawnSync('git', ['remote', 'get-url', remote], {
    cwd,
    stdio: 'ignore'
  });
  return result.status === 0;
}

function ensureCleanWorktree(cwd: string) {
  const status = readStdout('git', ['status', '--porcelain'], cwd);
  if (status) {
    throw new Error('Release requires a clean git worktree.');
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const cwd = process.cwd();
  const branch = readStdout('git', ['branch', '--show-current'], cwd);

  if (branch !== 'main') {
    throw new Error('Velvet Dinosaur releases require a clean main checkout.');
  }

  ensureCleanWorktree(cwd);

  const releaseCommit = readStdout('git', ['rev-parse', 'HEAD'], cwd);
  assertLighthousePortsFree(cwd);
  const qualityStartedAt = Date.now();
  run('bun', ['run', 'quality:validate'], cwd);
  run('bun', ['run', 'quality', '--only', 'velvetdinosaur'], cwd);
  ensureCleanWorktree(cwd);
  if (readStdout('git', ['rev-parse', 'HEAD'], cwd) !== releaseCommit) {
    throw new Error('The release commit changed during validation. Restart the release.');
  }
  verifyNewsletterLighthouse({
    clone: cwd,
    site: 'velvetdinosaur',
    commit: releaseCommit,
    qualityStartedAt,
    reportFile: path.join(readStdout('git', ['rev-parse', '--absolute-git-dir'], cwd),
      'release-evidence', releaseCommit, `${qualityStartedAt}-lighthouse.json`)
  });
  const deployArgs = ['run', 'deploy:blue-green', '--', `--env-file=${options.envFile}`, `--commit=${releaseCommit}`];
  run('bun', deployArgs, cwd);

  const hasOrigin = hasRemote(cwd, 'origin');

  if (!options.skipPush && hasOrigin) {
    run('git', ['push', '-u', 'origin', branch], cwd);
  }

  console.log(
    `[release:local] deployed ${releaseCommit} from ${branch}${!options.skipPush && hasOrigin ? ` and pushed origin/${branch}` : ''}`
  );
}

main();
