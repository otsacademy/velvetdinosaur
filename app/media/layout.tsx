import { Toaster } from '@/components/ui/sonner';

export default function MediaDemoHostLayout({
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
