import { Toaster } from '@/components/ui/sonner';

export default function BookingsDemoHostLayout({
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
