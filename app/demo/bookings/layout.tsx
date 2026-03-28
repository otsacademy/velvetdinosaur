import { Toaster } from '@/components/ui/sonner';

export default function DemoBookingsLayout({
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
