import type { Metadata } from 'next';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { ArrowRight, Download, Globe, Mail, MessageCircle, Phone, Sparkles } from 'lucide-react';
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
  primary?: boolean;
};

function ActionButton({ href, label, icon, external = false, download, primary = false }: ActionButtonProps) {
  const baseStyles =
    'group relative flex h-14 w-full items-center gap-4 rounded-xl px-5 text-left font-medium transition-all duration-200';
  const primaryStyles =
    'bg-[hsl(204,88%,40%)] text-white shadow-[var(--vd-shadow-md)] hover:bg-[hsl(204,88%,36%)] hover:shadow-[var(--vd-shadow-lg)] hover:-translate-y-0.5';
  const secondaryStyles =
    'border border-[var(--vd-border)] bg-[var(--vd-card)] text-[var(--vd-fg)] hover:border-[color-mix(in_oklch,var(--vd-primary)_40%,var(--vd-border))] hover:bg-[color-mix(in_oklch,var(--vd-primary)_4%,var(--vd-bg))] hover:shadow-[var(--vd-shadow-sm)]';

  return (
    <a
      download={download}
      href={href}
      rel={external ? 'noopener noreferrer' : undefined}
      target={external ? '_blank' : undefined}
      className={`${baseStyles} ${primary ? primaryStyles : secondaryStyles}`}
    >
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${primary ? 'bg-white/20' : 'bg-[var(--vd-muted)]'}`}>
        {icon}
      </span>
      <span className="flex-1 text-sm tracking-tight">{label}</span>
      <ArrowRight
        className={`size-4 transition-transform duration-200 group-hover:translate-x-1 ${primary ? 'text-white/70' : 'text-[var(--vd-muted-fg)]'}`}
        aria-hidden
      />
    </a>
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
    <main className="holding-bg relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 py-16">
      <div className="relative w-full max-w-md space-y-6">
        {/* Header */}
        <header className="space-y-4 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-[hsl(204,88%,40%)] shadow-[var(--vd-shadow-primary)]">
            <Sparkles className="size-7 text-white" aria-hidden />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--vd-fg)] md:text-4xl">
              {details.fullName}
            </h1>
            <p className="text-sm text-[var(--vd-muted-fg)]">
              Save my contact in one tap, or reach out below.
            </p>
          </div>
        </header>

        {/* Actions Card */}
        <div className="vd-soft-panel space-y-3 p-5">
          <ActionButton
            download="ian-wickens.vcf"
            href="/nfc/ian-wickens/vcard"
            icon={<Download className="size-5" />}
            label="Save Contact"
            primary
          />

          {mobileHref ? (
            <ActionButton
              href={mobileHref}
              icon={<Phone className="size-5 text-[var(--vd-primary)]" />}
              label={`Call ${details.mobile}`}
            />
          ) : null}

          {whatsappHref ? (
            <ActionButton
              external
              href={whatsappHref}
              icon={<MessageCircle className="size-5 text-[#25D366]" />}
              label="Open WhatsApp"
            />
          ) : null}

          <ActionButton
            href={`mailto:${details.email}`}
            icon={<Mail className="size-5 text-[var(--vd-primary)]" />}
            label={details.email}
          />

          <ActionButton
            external
            href={details.websiteUrl}
            icon={<Globe className="size-5 text-[var(--vd-primary)]" />}
            label={details.websiteUrl.replace(/^https?:\/\//, '')}
          />
        </div>

        {/* Footer */}
        <footer className="text-center">
          <p className="text-xs text-[var(--vd-muted-fg)]">
            Tap card to phone &middot; Powered by{' '}
            <a
              href={details.websiteUrl}
              className="font-medium text-[var(--vd-primary)] transition-colors hover:underline"
            >
              Velvet Dinosaur
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
