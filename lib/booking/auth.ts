import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/booking/auth.ts');

// Booking admin routes use the same BetterAuth + admin-role guard as the
// newsletter module.
export { getSessionUserFromHeaders, requireAdminFromHeaders } from '@/lib/newsletter/auth';
