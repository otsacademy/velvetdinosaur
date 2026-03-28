import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export type TextBlockProps = {
  heading?: string;
  body?: string;
};

export function TextBlock({
  heading = 'Use this section for the fuller explanation',
  body = 'A short paragraph here can introduce the studio, explain the approach, or add context that would feel too heavy inside the hero.'
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
