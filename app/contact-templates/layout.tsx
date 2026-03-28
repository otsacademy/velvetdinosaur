import { Toaster } from '@/components/ui/sonner';

export default function ContactTemplatesHostLayout({
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
