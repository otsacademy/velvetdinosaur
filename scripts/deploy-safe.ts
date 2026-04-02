import path from 'node:path';
import { rebuildSiteAndRestart } from '@/lib/component-store-runtime';

const DEFAULT_ENV_FILE = '.env.production';

async function main() {
  const passthroughArgs = process.argv.slice(2);
  const envFileArg = passthroughArgs.find((arg) => arg.startsWith('--env-file=')) || '';
  const envFile = envFileArg ? envFileArg.slice('--env-file='.length).trim() || DEFAULT_ENV_FILE : DEFAULT_ENV_FILE;
  const envFilePath = path.resolve(process.cwd(), envFile);
  const result = await rebuildSiteAndRestart({ siteRoot: process.cwd(), envFile: envFilePath });
  if (!result.restarted) {
    throw new Error(result.message || 'Deploy completed without restarting the runtime.');
  }

  console.log(`[deploy:safe] restarted ${result.name || 'the configured runtime'} from the current checkout`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
