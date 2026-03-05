import type { Metadata } from 'next';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { Download, Globe, Mail, MessageCircle, Phone, UserRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getNfcContactDetails } from '@/lib/nfc-contact';

export const metadata: Metadata = {
  title: 'Ian Wickens Contact Card',
  description: 'NFC contact card for Ian Wickens.',
  robots: {
    index: false,
    follow: false
  }
};

type ActionButtonProps = {
  href: string;
  label: string;
  icon: React.ReactNode;
  external?: boolean;
  download?: string;
};

function ActionButton({ href, label, icon, external = false, download }: ActionButtonProps) {
  return (
    <Button asChild className="h-12 w-full justify-start px-4 text-left" size="lg">
      <a
        download={download}
        href={href}
        rel={external ? 'noopener noreferrer' : undefined}
        target={external ? '_blank' : undefined}
      >
        {icon}
        <span>{label}</span>
      </a>
    </Button>
  );
}

export default function IanWickensNfcPage() {
  return (
    <Suspense fallback={null}>
      <IanWickensNfcPageContent />
    </Suspense>
  );
}

async function IanWickensNfcPageContent() {
  await connection();
  const details = getNfcContactDetails();
  const mobileHref = details.mobile ? `tel:${details.mobile}` : '';
  const whatsappHref = details.whatsappDigits ? `https://wa.me/${details.whatsappDigits}` : '';

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--vd-bg)] px-6 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(circle_at_top,color-mix(in_oklch,var(--vd-primary)_16%,transparent),transparent_55%),radial-gradient(circle_at_bottom,color-mix(in_oklch,var(--vd-accent)_20%,transparent),transparent_60%)]"
      />

      <div className="relative mx-auto w-full max-w-xl space-y-4">
        <Card className="border-[var(--vd-border)] bg-[color-mix(in_oklch,var(--vd-card)_88%,transparent)]">
          <CardHeader className="space-y-3">
            <Badge className="w-fit">
              <UserRound className="size-3.5" />
              NFC Contact Card
            </Badge>
            <CardTitle className="text-3xl tracking-tight">{details.fullName}</CardTitle>
            <CardDescription>
              Save my contact in one tap, or choose phone, WhatsApp, email, and website below.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-2">
            <ActionButton
              download="ian-wickens.vcf"
              href="/nfc/ian-wickens/vcard"
              icon={<Download className="size-4" />}
              label="Save Contact"
            />

            {mobileHref ? (
              <ActionButton href={mobileHref} icon={<Phone className="size-4" />} label={`Call ${details.mobile}`} />
            ) : null}

            {whatsappHref ? (
              <ActionButton
                external
                href={whatsappHref}
                icon={<MessageCircle className="size-4" />}
                label="Open WhatsApp"
              />
            ) : null}

            <ActionButton href={`mailto:${details.email}`} icon={<Mail className="size-4" />} label={details.email} />
            <ActionButton
              external
              href={details.websiteUrl}
              icon={<Globe className="size-4" />}
              label={details.websiteUrl.replace(/^https?:\/\//, '')}
            />
          </CardContent>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--vd-muted-fg)]">
            NFC Tag URL
          </p>
          <p className="mt-2 break-all text-sm">{`${details.websiteUrl.replace(/\/$/, '')}/nfc/ian-wickens/vcard`}</p>
        </Card>
      </div>
    </main>
  );
}
