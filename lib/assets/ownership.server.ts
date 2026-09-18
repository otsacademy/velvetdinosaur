import { createHash } from 'node:crypto';
import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/assets/ownership.server.ts');

export function assetOwnerSite() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Database configuration is required for asset ownership.');
  // Credentials rotate; the database identity does not. Never persist secrets.
  const identity = uri.replace(/\/\/[^/]*@/, '//').split('?')[0];
  return createHash('sha256').update(identity).digest('hex').slice(0, 24);
}

export function uploadedAssetOwnership(userId: string) {
  return { ownerSite: assetOwnerSite(), ownershipSource: 'upload', ownershipVerifiedAt: new Date(), uploadedBy: userId };
}

export function isTrustedAsset(asset: { ownerSite?: string; ownershipSource?: string }, ownerSite = assetOwnerSite()) {
  return asset.ownerSite === ownerSite && (asset.ownershipSource === 'upload' || asset.ownershipSource === 'reviewed-migration');
}
