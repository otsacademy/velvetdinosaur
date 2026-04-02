import { spawnSync } from 'node:child_process';

type Options = {
  envFile: string;
  skipQuality: boolean;
  skipPush: boolean;
};

function parseArgs(argv: string[]): Options {
  let envFile = '.env.production';
  let skipQuality = false;
  let skipPush = false;

  for (const arg of argv) {
    if (arg.startsWith('--env-file=')) {
      envFile = arg.slice('--env-file='.length).trim() || envFile;
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

  return { envFile, skipQuality, skipPush };
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

  if (!branch || branch === 'HEAD') {
    throw new Error('Release requires a checked-out branch.');
  }

  ensureCleanWorktree(cwd);

  const deployArgs = ['run', 'deploy:manual', '--', `--env-file=${options.envFile}`];
  if (options.skipQuality) {
    deployArgs.push('--skip-quality');
  }
  run('bun', deployArgs, cwd);

  const releaseCommit = readStdout('git', ['rev-parse', 'HEAD'], cwd);
  const hasOrigin = hasRemote(cwd, 'origin');

  if (!options.skipPush && hasOrigin) {
    run('git', ['push', '-u', 'origin', branch], cwd);
  }

  console.log(
    `[release:local] deployed ${releaseCommit} from ${branch}${!options.skipPush && hasOrigin ? ` and pushed origin/${branch}` : ''}`
  );
}

main();
