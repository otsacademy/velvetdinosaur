import { Toaster } from '@/components/ui/sonner';

export default function DemoStaysLayout({
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
