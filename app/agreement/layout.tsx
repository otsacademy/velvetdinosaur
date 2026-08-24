import { DM_Sans } from 'next/font/google';

// The agreement document is typeset in DM Sans (design handoff). Loaded here
// rather than in the root layout so the rest of the site is untouched — the
// site theme references --font-dm-sans and would otherwise switch globally.
const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans',
});

export default function AgreementLayout({ children }: { children: React.ReactNode }) {
  return <div className={dmSans.variable}>{children}</div>;
}
