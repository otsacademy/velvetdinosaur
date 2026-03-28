import { Toaster } from '@/components/ui/sonner';

export default function ReviewsHostLayout({
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
