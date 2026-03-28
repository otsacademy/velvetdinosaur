import { Toaster } from '@/components/ui/sonner';

export default function DemoCalendarLayout({
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
