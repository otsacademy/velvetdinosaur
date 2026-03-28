import { Toaster } from '@/components/ui/sonner';

export default function DemoInboxLayout({
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
