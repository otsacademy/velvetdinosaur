import { Toaster } from '@/components/ui/sonner';

export default function DemoRoutesLayout({
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
