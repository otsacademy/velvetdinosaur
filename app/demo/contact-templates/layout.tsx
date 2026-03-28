import { Toaster } from '@/components/ui/sonner';

export default function DemoContactTemplatesLayout({
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
