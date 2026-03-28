import { Toaster } from '@/components/ui/sonner';

export default function DemoReviewsLayout({
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
