import { createHash } from 'node:crypto';
import { readFileSync, realpathSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

// Copied into scripts/ for this scoped release. Normal Sauro checks stay unchanged.
export const RECEIPT_PATH = '.newsletter-release-receipt.json';
export const EXPECTED_FEATURE_FILES: string[] = [
  "app/api/admin/newsletter/campaigns/route.ts",
  "app/api/admin/newsletter/deliveries/route.ts",
  "app/api/admin/newsletter/dispatch/route.ts",
  "app/api/admin/newsletter/media/route.ts",
  "app/api/admin/newsletter/preview/route.ts",
  "app/api/admin/newsletter/send-test/route.ts",
  "app/api/assets/complete/route.ts",
  "app/api/assets/file/route.ts",
  "app/api/assets/presign/route.ts",
  "app/api/assets/replace/route.ts",
  "app/api/assets/upload/route.ts",
  "app/api/internal/newsletter-dispatch-cron/route.ts",
  "app/api/newsletter/media/[id]/route.ts",
  "components/edit/email-template-visual-editor.tsx",
  "components/edit/media-library/media-library.actions.ts",
  "components/edit/media-library/media-library.client.tsx",
  "components/edit/media-library/media-library.data.ts",
  "components/edit/media-library/media-library.dialogs.tsx",
  "components/edit/media-library/media-library.editing.ts",
  "components/edit/media-library/media-library.state.ts",
  "components/edit/newsletter-workspace.tsx",
  "components/edit/newsletter/media/dialog-focus.ts",
  "components/edit/newsletter/media/newsletter-attachments.tsx",
  "components/edit/newsletter/media/newsletter-image-editor.tsx",
  "components/edit/newsletter/media/newsletter-media-picker.tsx",
  "components/edit/newsletter/media/newsletter-source-notice.tsx",
  "components/edit/newsletter/newsletter-campaign-list.tsx",
  "components/edit/newsletter/newsletter-composer-card.tsx",
  "components/edit/newsletter/newsletter-composer-preview.tsx",
  "components/edit/newsletter/newsletter-delivery-log.tsx",
  "components/edit/newsletter/newsletter-management-panels.tsx",
  "components/edit/newsletter/newsletter-workspace.helpers.ts",
  "components/edit/newsletter/newsletter-workspace.shared.ts",
  "components/puck/fields/asset-picker-field.tsx",
  "components/puck/fields/asset-picker-field/asset-library-preview-dialog.tsx",
  "components/puck/fields/asset-picker-field/asset-library-results.tsx",
  "components/puck/fields/asset-picker-field/asset-upload-controls.tsx",
  "components/puck/fields/asset-picker-field/selection-adapter.ts",
  "components/puck/fields/asset-picker-field/shared.ts",
  "lib/assets/image-pipeline.server.ts",
  "lib/assets/image-variants.ts",
  "lib/assets/ownership.server.ts",
  "lib/assets/trash.server.ts",
  "lib/assets/usage.server.ts",
  "lib/demo-editor-assets-seed.ts",
  "lib/demo-editor-assets.ts",
  "lib/demo-email-template-visual.ts",
  "lib/demo-safety.test.ts",
  "lib/demo-safety.ts",
  "lib/email-template-visual.ts",
  "lib/email/newsletter-campaign.test.ts",
  "lib/email/newsletter-campaign.ts",
  "lib/email/newsletter-social.ts",
  "lib/newsletter/campaign-integration.test.ts",
  "lib/newsletter/campaign-lifecycle.ts",
  "lib/newsletter/campaign-preparation.ts",
  "lib/newsletter/campaign-types.ts",
  "lib/newsletter/campaigns.ts",
  "lib/newsletter/composer-source.ts",
  "lib/newsletter/configuration.test.ts",
  "lib/newsletter/database.ts",
  "lib/newsletter/delivery-worker.test.ts",
  "lib/newsletter/delivery-worker.ts",
  "lib/newsletter/dispatch.ts",
  "lib/newsletter/media-client-types.ts",
  "lib/newsletter/media-crypto.test.ts",
  "lib/newsletter/media-crypto.ts",
  "lib/newsletter/media-lifecycle.ts",
  "lib/newsletter/media-storage.ts",
  "lib/newsletter/media-types.ts",
  "lib/newsletter/media-validation.test.ts",
  "lib/newsletter/media-validation.ts",
  "lib/newsletter/media.test.ts",
  "lib/newsletter/media.ts",
  "lib/newsletter/operations.test.ts",
  "lib/newsletter/operations.ts",
  "lib/newsletter/request-preparation.ts",
  "lib/newsletter/send-policy.ts",
  "lib/newsletter/visual-image.test.ts",
  "lib/newsletter/visual-image.ts",
  "lib/uploads-errors.ts",
  "lib/uploads-http.ts",
  "lib/uploads-transfer.ts",
  "lib/uploads-url.ts",
  "lib/uploads.ts",
  "models/Asset.ts",
  "models/AssetUploadReceipt.ts",
  "models/NewsletterCampaign.ts",
  "models/NewsletterDelivery.ts",
  "models/NewsletterMedia.ts",
  "ops/scripts/nginx-newsletter-media.ts",
  "scripts/import-site-media.ts",
  "scripts/newsletter-asset-ownership.ts",
  "scripts/newsletter-configure.ts",
  "scripts/newsletter-dispatch-cron.ts",
  "scripts/newsletter-media-cleanup.ts",
  "scripts/newsletter-mongo-test.ts",
  "scripts/newsletter-scheduler.ts"
];
export const EXPECTED_SUPPORT_FILES = [
  'package.json', 'quality/gates.json', 'scripts/sauro-core-preflight.ts', 'scripts/newsletter-release-preflight.ts'
];
type Receipt = {
  version: number; hubCommit: string; templateCommit: string; baseCommit: string;
  files: { file: string; sha256: string }[];
};

function trackedFile(cwd: string, file: string): Buffer {
  const result = spawnSync('git', ['-C', cwd, 'show', `HEAD:${file}`]);
  if (result.status !== 0) throw new Error(`Scoped release requires committed ${file}.`);
  return result.stdout;
}

export function verifyNewsletterScopedRelease(cwd = process.cwd(), env: Record<string, string | undefined> = process.env): boolean {
  const requested = env.NEWSLETTER_RELEASE_RECEIPT;
  if (!requested) return false;
  if (requested !== RECEIPT_PATH) throw new Error('Scoped release receipt must use the fixed repository-local path.');
  const root = realpathSync(cwd);
  const localFile = (file: string) => {
    const resolved = realpathSync(path.join(root, file));
    if (!resolved.startsWith(`${root}${path.sep}`)) throw new Error('Scoped release file escapes its repository.');
    return readFileSync(resolved);
  };
  const raw = localFile(RECEIPT_PATH);
  if (!raw.equals(trackedFile(root, RECEIPT_PATH))) throw new Error('Scoped release receipt differs from its commit.');
  const receipt = JSON.parse(raw.toString()) as Receipt;
  if (receipt.version !== 1 || [receipt.hubCommit, receipt.templateCommit, receipt.baseCommit].some((value) => !/^[a-f0-9]{40}$/.test(value))) {
    throw new Error('Scoped release receipt lacks exact source commits.');
  }
  const expected = [...EXPECTED_FEATURE_FILES, ...EXPECTED_SUPPORT_FILES].sort();
  if (!EXPECTED_FEATURE_FILES.length || !Array.isArray(receipt.files) ||
      JSON.stringify(receipt.files.map((row) => row.file).sort()) !== JSON.stringify(expected)) {
    throw new Error('Scoped release receipt must cover exactly the reviewed feature and four support files.');
  }
  for (const row of receipt.files) {
    if (!/^[a-f0-9]{64}$/.test(row.sha256)) throw new Error(`Invalid scoped checksum for ${row.file}.`);
    const bytes = localFile(row.file);
    const hash = createHash('sha256').update(bytes).digest('hex');
    if (hash !== row.sha256 || !bytes.equals(trackedFile(root, row.file))) {
      throw new Error(`Scoped release content drift: ${row.file}`);
    }
  }
  const ancestry = spawnSync('git', ['-C', root, 'merge-base', '--is-ancestor', receipt.baseCommit, 'HEAD']);
  if (ancestry.status !== 0) throw new Error('Scoped release is not descended from the reviewed site base.');
  console.log('[sauro-core] verified committed newsletter scope; normal full-baseline preflight remains the default.');
  return true;
}
