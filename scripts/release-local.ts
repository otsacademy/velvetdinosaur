import { spawnSync } from 'node:child_process';

type Options = {
  envFile: string;
  configPath: string | null;
  skipQuality: boolean;
  skipPush: boolean;
};

function parseArgs(argv: string[]): Options {
  let envFile = '.env.production';
  let configPath: string | null = null;
  let skipQuality = false;
  let skipPush = false;

  for (const arg of argv) {
    if (arg.startsWith('--env-file=')) {
      envFile = arg.slice('--env-file='.length).trim() || envFile;
      continue;
    }
    if (arg.startsWith('--config=')) {
      configPath = arg.slice('--config='.length).trim() || null;
      continue;
    }
    if (arg === '--skip-quality') {
      skipQuality = true;
      continue;
    }
    if (arg === '--skip-push') {
      skipPush = true;
    }
  }

  return { envFile, configPath, skipQuality, skipPush };
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

function hasRef(cwd: string, ref: string) {
  const result = spawnSync('git', ['show-ref', '--verify', '--quiet', ref], {
    cwd,
    stdio: 'ignore'
  });
  return result.status === 0;
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

function ensureFastForwardPromotion(cwd: string) {
  if (!hasRef(cwd, 'refs/heads/main')) return;

  const result = spawnSync('git', ['merge-base', '--is-ancestor', 'main', 'develop'], {
    cwd,
    stdio: 'ignore'
  });

  if (result.status !== 0) {
    throw new Error('Local main is not an ancestor of develop. Refusing non-fast-forward promotion.');
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const cwd = process.cwd();
  const branch = readStdout('git', ['branch', '--show-current'], cwd);

  if (branch !== 'develop') {
    throw new Error(`Release must start from develop. Current branch: ${branch || '(detached HEAD)'}`);
  }

  ensureCleanWorktree(cwd);
  ensureFastForwardPromotion(cwd);

  if (!options.skipQuality) {
    run('bun', ['run', 'quality', '--all'], cwd);
  }

  const releaseCommit = readStdout('git', ['rev-parse', 'develop'], cwd);
  run('git', ['update-ref', 'refs/heads/main', releaseCommit], cwd);
  run(
    'bun',
    [
      'run',
      'deploy:blue-green',
      '--',
      `--env-file=${options.envFile}`,
      '--branch=main',
      `--commit=${releaseCommit}`,
      ...(options.configPath ? [`--config=${options.configPath}`] : [])
    ],
    cwd
  );

  if (!options.skipPush && hasRemote(cwd, 'origin')) {
    run('git', ['push', 'origin', 'develop', 'main'], cwd);
  }

  console.log(`[release:local] deployed ${releaseCommit} from develop and promoted local main`);
}

main();
