import { Toaster } from '@/components/ui/sonner';

export default function SupportDemoHostLayout({
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
