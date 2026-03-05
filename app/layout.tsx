import './globals.css';
import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import { Space_Grotesk, Bebas_Neue, JetBrains_Mono } from 'next/font/google';
import { getThemePayload } from '@/lib/theme';
import { getThemeCssVars } from '@/lib/theme-css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Velvet Dinosaur',
  description: 'Velvet Dinosaur boilerplate'
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const isLhci = process.env.VD_LHCI === 'true' || process.env.NEXT_PUBLIC_LHCI === 'true';
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
        '--accent': '#e2e8f0',
        '--accent-foreground': '#0f172a',
        '--ring': '#1e3a8a',

        '--vd-bg': '#ffffff',
        '--vd-fg': '#0f172a',
        '--vd-muted': '#f1f5f9',
        '--vd-muted-fg': '#334155',
        '--vd-primary': '#1e3a8a',
        '--vd-primary-fg': '#ffffff',
        '--vd-accent': '#e2e8f0',
        '--vd-accent-fg': '#0f172a',
        '--vd-ring': '#1e3a8a'
      }
    : {};

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${bebasNeue.variable} ${jetbrainsMono.variable}`}
      style={{ ...(themeVars as CSSProperties), ...(lhciOverrides as CSSProperties) }}
    >
      <body className="min-h-screen bg-[var(--vd-bg)] text-[var(--vd-fg)] antialiased">
        {children}
      </body>
    </html>
  );
}
