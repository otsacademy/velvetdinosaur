import { Toaster } from '@/components/ui/sonner';

export default function DemoMediaLayout({
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
