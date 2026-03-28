import { Toaster } from '@/components/ui/sonner';

export default function StaysDemoHostLayout({
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
