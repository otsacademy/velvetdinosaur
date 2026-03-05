import { diffTouchesDenied, readEditorSyncManifest, runEditorSyncDryRun } from '@/lib/editor-sync-service';

async function main() {
  const site = process.env.EDITOR_SYNC_SITE || 'thebrave';
  const manifest = readEditorSyncManifest();
  const diff = runEditorSyncDryRun(site);
  const denied = diffTouchesDenied(diff, manifest.deny || []);

  if (denied.length > 0 || diff.denied.length > 0) {
    throw new Error(`Denied paths detected: ${[...denied, ...diff.denied].join(', ')}`);
  }

  console.log(
    `Editor sync dry-run OK for ${site}: +${diff.added.length} ~${diff.changed.length}`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
