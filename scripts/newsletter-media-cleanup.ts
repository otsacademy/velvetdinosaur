import path from 'node:path';
import mongoose from 'mongoose';
import { readNewsletterEnvironment } from '@/lib/newsletter/operations';

try {
  const args = process.argv.slice(2);
  const envPath = path.resolve(args.find((arg) => arg.startsWith('--env-file='))?.slice('--env-file='.length) || '.env.production');
  const env = await readNewsletterEnvironment(envPath);
  Object.assign(process.env, env);
  const { cleanupNewsletterMedia } = await import('@/lib/newsletter/media');
  const dryRun = !args.includes('--apply');
  const summary = await cleanupNewsletterMedia({ dryRun, limit: 100 });
  console.log(JSON.stringify({ at: new Date().toISOString(), ...summary }));
  if (summary.failed > 0) process.exitCode = 1;
} catch (error) {
  console.error(JSON.stringify({ at: new Date().toISOString(), error: error instanceof Error ? error.message : 'Newsletter media cleanup failed.' }));
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
