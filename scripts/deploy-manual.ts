import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

type Options = {
  branch: string | null;
  commit: string | null;
  configPath: string | null;
  envFile: string;
  skipQuality: boolean;
};

function parseArgs(argv: string[]): Options {
  let branch: string | null = null;
  let commit: string | null = null;
  let configPath: string | null = 'deploy/local-first.json';
  let envFile = '.env.production';
  let skipQuality = false;

  for (const arg of argv) {
    if (arg.startsWith('--branch=')) {
      branch = arg.slice('--branch='.length).trim() || null;
      continue;
    }
    if (arg.startsWith('--commit=')) {
      commit = arg.slice('--commit='.length).trim() || null;
      continue;
    }
    if (arg.startsWith('--config=')) {
      configPath = arg.slice('--config='.length).trim() || null;
      continue;
    }

    if (arg.startsWith('--env-file=')) {
      envFile = arg.slice('--env-file='.length).trim() || envFile;
      continue;
    }

    if (arg === '--skip-quality') {
      skipQuality = true;
    }
  }

  return { branch, commit, configPath, envFile, skipQuality };
}

function runOrThrow(command: string, args: string[], cwd: string, env?: NodeJS.ProcessEnv) {
  const result = spawnSync(command, args, {
    cwd,
    env: env ?? process.env,
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

async function ensureFile(filePath: string) {
  try {
    await fs.access(filePath);
  } catch {
    throw new Error(`Missing required file: ${filePath}`);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const repoDir = process.cwd();
  const envFilePath = path.resolve(repoDir, options.envFile);

  await ensureFile(envFilePath);

  const branch = options.branch || readStdout('git', ['rev-parse', '--abbrev-ref', 'HEAD'], repoDir);
  if (!branch || branch === 'HEAD') {
    throw new Error('Unable to determine deploy branch. Pass --branch=<name>.');
  }
  const commit = options.commit || readStdout('git', ['rev-parse', branch], repoDir);

  console.log(`[manual-deploy] preparing local ${branch} deploy from ${commit}`);
  runOrThrow('git', ['switch', branch], repoDir);

  if (!options.skipQuality) {
    runOrThrow('bun', ['run', 'quality:validate'], repoDir);
    runOrThrow('bun', ['run', 'quality', '--all'], repoDir, { ...process.env, CI: 'true' });
  } else {
    console.log('[manual-deploy] skipping local quality gates');
  }

  console.log('[manual-deploy] running deploy:blue-green');
  runOrThrow(
    'bun',
    [
      'run',
      'deploy:blue-green',
      '--',
      `--env-file=${options.envFile}`,
      `--branch=${branch}`,
      `--commit=${commit}`,
      ...(options.configPath ? [`--config=${options.configPath}`] : [])
    ],
    repoDir
  );

  console.log(`[manual-deploy] ${branch} deployed locally from ${commit}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
