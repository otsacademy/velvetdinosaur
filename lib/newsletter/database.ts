import { connectDB } from '@/lib/db';

/** Do not query models or claim deliveries after a failed database connection. */
export async function requireNewsletterDatabase() {
  const connection = await connectDB();
  if (!connection) throw new Error('The newsletter database is unavailable. Try again when the connection is restored.');
  return connection;
}
