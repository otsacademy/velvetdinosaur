import { Toaster } from '@/components/ui/sonner';

export default function RoutesDemoHostLayout({
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
