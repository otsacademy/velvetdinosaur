import { Toaster } from '@/components/ui/sonner';

export default function CalendarDemoHostLayout({
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
