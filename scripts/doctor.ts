import { connectDB } from '@/lib/db';
import { getThemePayload } from '@/lib/theme';

async function main() {
  await connectDB();
  const payload = await getThemePayload();
  if (!payload) {
    console.warn('Doctor: theme payload missing, using defaults');
  }
  console.log('Doctor: OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
