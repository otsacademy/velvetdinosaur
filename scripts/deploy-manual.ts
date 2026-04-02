import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { rebuildSiteAndRestart } from '@/lib/component-store-runtime';

type Options = {
  envFile: string;
  skipQuality: boolean;
};

function parseArgs(argv: string[]): Options {
  let envFile = '.env.production';
  let skipQuality = false;

  for (const arg of argv) {
    if (arg.startsWith('--env-file=')) {
      envFile = arg.slice('--env-file='.length).trim() || envFile;
      continue;
    }

    if (arg === '--skip-quality') {
      skipQuality = true;
    }
  }

  return { envFile, skipQuality };
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

function ensureFile(filePath: string) {
  if (!existsSync(filePath)) {
    throw new Error(`Missing required file: ${filePath}`);
  }
}

function ensureCleanWorktree(cwd: string) {
  const status = readStdout('git', ['status', '--porcelain'], cwd);
  if (status) {
    throw new Error('Deploy requires a clean git worktree.');
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const repoDir = process.cwd();
  const envFilePath = path.resolve(repoDir, options.envFile);

  ensureFile(envFilePath);
  ensureCleanWorktree(repoDir);

  const branch = readStdout('git', ['rev-parse', '--abbrev-ref', 'HEAD'], repoDir);
  if (!branch || branch === 'HEAD') {
    throw new Error('Unable to determine deploy branch.');
  }
  const commit = readStdout('git', ['rev-parse', 'HEAD'], repoDir);

  console.log(`[deploy:manual] preparing ${branch} deploy from ${commit}`);

  if (!options.skipQuality) {
    runOrThrow('bun', ['run', 'quality:validate'], repoDir);
    runOrThrow('bun', ['run', 'quality', '--all'], repoDir, { ...process.env, CI: 'true' });
  } else {
    console.log('[deploy:manual] skipping local quality gates');
  }

  const result = await rebuildSiteAndRestart({ siteRoot: repoDir, envFile: envFilePath });
  if (!result.restarted) {
    throw new Error(result.message || 'Deploy completed without restarting the runtime.');
  }

  console.log(`[deploy:manual] restarted ${result.name || 'the configured runtime'} for ${branch} at ${commit}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
