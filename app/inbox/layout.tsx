import { Toaster } from '@/components/ui/sonner';

export default function InboxDemoHostLayout({
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
