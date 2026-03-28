import { Toaster } from '@/components/ui/sonner';

export default function DemoSupportLayout({
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
