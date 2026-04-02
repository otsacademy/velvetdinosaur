import { installStoreBlock, readStoreIndex, rebuildAndRestart, getStorePath } from '@/lib/component-store';

const args = process.argv.slice(2);

function usage() {
  console.log('Usage: bun run add-component <block-id> [--list] [--store <path>] [--rebuild]');
}

async function main() {
  const list = args.includes('--list');
  const rebuild = args.includes('--rebuild');
  const storeIndex = args.findIndex((arg) => arg === '--store');
  if (storeIndex >= 0 && !args[storeIndex + 1]) {
    console.error('Missing value for --store');
    usage();
    process.exit(1);
  }
  const storePath = storeIndex >= 0 ? args[storeIndex + 1] : getStorePath();

  if (list) {
    const index = await readStoreIndex(storePath);
    if (!index.blocks.length) {
      console.log('No blocks found in store.');
      return;
    }
    console.log('Available blocks:');
    index.blocks.forEach((block) => {
      console.log(`- ${block.id} (${block.name}) v${block.version}`);
    });
    return;
  }

  const blockId = args.find((arg) => !arg.startsWith('--'));
  if (!blockId) {
    usage();
    process.exit(1);
  }

  const installed = await installStoreBlock(blockId, storePath);
  console.log(`Installed ${installed.name} (${installed.id}) v${installed.version}`);

  if (rebuild) {
    console.log('Rebuilding site and activating the runtime...');
    const result = await rebuildAndRestart();
    if (result.restarted) {
      console.log(`Restarted ${result.name}`);
    } else {
      console.log(result.message || 'Restart skipped.');
    }
  } else {
    console.log('Run `bun run build` for a local check, then use `bun run deploy:safe` to activate the current checkout.');
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
