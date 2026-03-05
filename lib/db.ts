import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/db.ts');

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

export async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return null;
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
