import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export type TextBlockProps = {
  heading?: string;
  body?: string;
};

export function TextBlock({
  heading = 'Make it yours',
  body = 'Swap blocks, edit copy, and publish instantly. Everything persists in MongoDB so you can version and roll back.'
}: TextBlockProps) {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl font-semibold">{heading}</CardTitle>
        <CardDescription className="text-base leading-relaxed text-[var(--vd-muted-fg)]">
          {body}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
