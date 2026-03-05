import { connection } from 'next/server';
import { createNfcVCard, getNfcContactDetails } from '@/lib/nfc-contact';

export async function GET() {
  await connection();
  const details = getNfcContactDetails();
  const vcard = createNfcVCard(details);

  return new Response(vcard, {
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': 'inline; filename="ian-wickens.vcf"',
      'Cache-Control': 'public, max-age=300',
      'X-Robots-Tag': 'noindex, nofollow, noarchive'
    }
  });
}
