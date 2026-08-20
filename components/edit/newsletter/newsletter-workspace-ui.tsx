import { type ComponentType, type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { type CampaignStatus, type NewsletterStatus } from '@/components/edit/newsletter/newsletter-workspace.shared';
import { cn } from '@/lib/utils';

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function StatCard({
  title,
  value,
  icon: Icon,
  accent
}: {
  title: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  accent?: 'success' | 'warning';
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
        </div>
        <div
          className={cn(
            'rounded-full p-2',
            accent === 'success'
              ? 'bg-emerald-500/12 text-emerald-600'
              : accent === 'warning'
                ? 'bg-amber-500/14 text-amber-600'
                : 'bg-[var(--vd-muted)] text-[var(--vd-fg)]'
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  );
}

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const variant =
    status === 'completed'
      ? 'default'
      : status === 'sending'
        ? 'secondary'
        : status === 'queued'
          ? 'outline'
          : status === 'cancelled'
            ? 'destructive'
            : 'secondary';
  return (
    <Badge variant={variant} className="capitalize">
      {status}
    </Badge>
  );
}

export function SubscriberStatusBadge({ status }: { status: NewsletterStatus }) {
  if (status === 'subscribed') {
    return <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Subscribed</Badge>;
  }
  if (status === 'pending') {
    return <Badge variant="secondary">Pending confirmation</Badge>;
  }
  if (status === 'unsubscribed') {
    return <Badge variant="outline">Unsubscribed</Badge>;
  }
  return <Badge variant="secondary">No consent</Badge>;
}
