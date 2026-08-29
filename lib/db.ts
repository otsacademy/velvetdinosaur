import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/db.ts');

import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';

declare global {
  // eslint-disable-next-line no-var
  var mongooseConn: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose | null> | null;
  } | undefined;
}

let cached = global.mongooseConn;
if (!cached) {
  cached = global.mongooseConn = { conn: null, promise: null };
}

let attemptedCliEnvLoad = false;

function parseEnvLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;
  const withoutExport = trimmed.startsWith('export ')
    ? trimmed.slice('export '.length).trim()
    : trimmed;
  const eq = withoutExport.indexOf('=');
  if (eq <= 0) return null;
  const key = withoutExport.slice(0, eq).trim();
  let value = withoutExport.slice(eq + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return { key, value };
}

function isLikelyNextRuntimeProcess() {
  const argv = process.argv.join(' ').toLowerCase();
  return (
    argv.includes('next/dist/bin/next') ||
    argv.includes('next-server') ||
    argv.includes(' next build') ||
    argv.includes(' next dev') ||
    argv.includes(' next start')
  );
}

function isAllowedEditorSmokeRuntime() {
  if (!(process.env.VD_EDITOR_SMOKE_TOKEN || '').trim()) return false;
  if (process.env.NODE_ENV !== 'production') return true;
  return process.env.VD_ALLOW_EDITOR_SMOKE_IN_PRODUCTION === 'true';
}

function maybeLoadCliEnvFromProduction() {
  if (attemptedCliEnvLoad) return;
  attemptedCliEnvLoad = true;
  if (process.env.MONGODB_URI) return;
  if (isLikelyNextRuntimeProcess()) return;

  const envPath = path.resolve(process.cwd(), '.env.production');
  if (!fs.existsSync(envPath)) return;

  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/g)) {
    const entry = parseEnvLine(line);
    if (!entry) continue;
    if (process.env[entry.key] != null) continue;
    process.env[entry.key] = entry.value;
  }

  if (process.env.MONGODB_URI) {
    console.log('Loaded .env.production for CLI run');
  }
}

export async function connectDB() {
  maybeLoadCliEnvFromProduction();
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    if (process.env.NEXT_PHASE === 'phase-production-build' || isAllowedEditorSmokeRuntime()) {
      return null;
    }
    if (!isLikelyNextRuntimeProcess()) {
      throw new Error('MONGODB_URI is not set. Source the relevant `.env.production` file before running this command.');
    }
    console.error('[connectDB] MONGODB_URI is not set');
    return null;
  }

  if (cached?.conn) {
    return cached.conn;
  }

  if (!cached?.promise) {
    cached!.promise = mongoose
      .connect(mongoUri, {
        bufferCommands: false
      })
      .catch((error) => {
        console.error('[connectDB] Mongo connection failed:', error?.message || error);
        cached!.promise = null;
        return null;
      });
  }

  cached!.conn = (await cached!.promise) || null;
  return cached!.conn;
}
