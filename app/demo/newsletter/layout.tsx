import { Toaster } from '@/components/ui/sonner';

export default function DemoNewsletterLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
