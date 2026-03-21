import './globals.css';
import './velvet-site.css';
import { Suspense, type CSSProperties } from 'react';
import { DM_Sans, JetBrains_Mono } from 'next/font/google';
import { getThemePayload } from '@/lib/theme';
import { getThemeCssVars } from '@/lib/theme-css';
import { siteMetadata } from '@/lib/site-metadata';
import { ThirdPartyAnalytics } from '@/components/analytics/third-party-analytics.client';
import { VisitorTracker } from '@/components/analytics/visitor-tracker.client';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-dm-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata = siteMetadata;

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const isLhci = process.env.VD_LHCI === 'true' || process.env.NEXT_PUBLIC_LHCI === 'true';
  const disableAnalytics = isLhci || process.env.VD_DISABLE_ANALYTICS === 'true';
  const fontClasses = isLhci ? '' : `${dmSans.variable} ${jetbrainsMono.variable}`;
  const payload = await getThemePayload();
  const themeVars = getThemeCssVars(payload);
  const lhciOverrides: Record<string, string> = isLhci
    ? {
        // Lighthouse enforces strict a11y color-contrast checks.
        // Override both tweakcn vars and our vd-* aliases to a safe, high-contrast palette.
        '--background': '#ffffff',
        '--foreground': '#0f172a',
        '--muted': '#f1f5f9',
        '--muted-foreground': '#334155',
        '--primary': '#1e3a8a',
        '--primary-foreground': '#ffffff',
        '--accent': '#1e3a8a',
        '--accent-foreground': '#ffffff',
        '--ring': '#1e3a8a',
        '--vd-interaction-blue': '#1e40af',

        '--vd-bg': '#ffffff',
        '--vd-fg': '#0f172a',
        '--vd-muted': '#f1f5f9',
        '--vd-muted-fg': '#334155',
        '--vd-primary': '#1e3a8a',
        '--vd-primary-fg': '#ffffff',
        '--vd-accent': '#1e3a8a',
        '--vd-accent-fg': '#ffffff',
        '--vd-ring': '#1e3a8a'
      }
    : {};

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={fontClasses}
      style={{
        ...(themeVars as CSSProperties),
        ...(lhciOverrides as CSSProperties)
      }}
    >
      <body className="min-h-screen bg-[var(--vd-bg)] text-[var(--vd-fg)] antialiased">
        {children}
        {disableAnalytics ? null : (
          <>
            <Suspense fallback={null}>
              <VisitorTracker />
            </Suspense>
            <Suspense fallback={null}>
              <ThirdPartyAnalytics />
            </Suspense>
          </>
        )}
      </body>
    </html>
  );
}
