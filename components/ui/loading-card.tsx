import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type LoadingCardProps = {
  title?: string;
  description?: string;
  className?: string;
};

export function LoadingCard({
  title = 'Loading',
  description = 'Preparing your workspace.',
  className
}: LoadingCardProps) {
  return (
    <Card className={cn('mx-auto w-full max-w-lg', className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
    </Card>
  );
}
