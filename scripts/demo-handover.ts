import { createReviewLink, buildReviewUrl } from '@/lib/security/review-links';
import { loadDemoManifest, validateDemoEvidence } from './demo-evidence';

async function main() {
  const manifest = await loadDemoManifest();
  const evidenceErrors = validateDemoEvidence(manifest, { requireCurrentFacts: true, maxAgeHours: 24 });
  if (evidenceErrors.length > 0) {
    throw new Error(`Demo handover blocked:\n- ${evidenceErrors.join('\n- ')}`);
  }
  const deadlineAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const { token } = await createReviewLink({ slug: 'home', deadlineAt });
  console.log(`REVIEW_URL=${buildReviewUrl(process.env.DEMO_ORIGIN!, 'home', token)}`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
