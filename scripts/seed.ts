import { connectDB } from '@/lib/db';
import { saveThemePayload } from '@/lib/theme';
import { DEFAULT_THEME_PAYLOAD } from '@/lib/theme-default';
import { publishDraftPageData, saveDraftPageData } from '@/lib/pages';
import { defaultData } from '@/puck/defaults';

async function main() {
  await connectDB();
  await saveThemePayload(DEFAULT_THEME_PAYLOAD, 'seed');
  await saveDraftPageData('home', defaultData('home'));
  await publishDraftPageData('home');
  console.log('Seed complete');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
