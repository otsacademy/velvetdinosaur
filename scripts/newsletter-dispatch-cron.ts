import path from 'node:path';
import { invokeNewsletterCron, readNewsletterEnvironment } from '@/lib/newsletter/operations';

const args = process.argv.slice(2);
const envArg = args.find((arg) => arg.startsWith('--env-file='));
const envPath = path.resolve(envArg?.slice('--env-file='.length) || '.env.production');

try {
  const env = await readNewsletterEnvironment(envPath);
  const dryRun = !args.includes('--dispatch');
  const summary = await invokeNewsletterCron(env, dryRun);
  console.log(JSON.stringify({ at: new Date().toISOString(), ...summary }));
} catch (error) {
  console.error(JSON.stringify({ at: new Date().toISOString(), error: error instanceof Error ? error.message : 'Scheduler failed.' }));
  process.exitCode = 1;
}
