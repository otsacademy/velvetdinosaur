import { type ComponentType, type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type {
  DemoNewsletterCampaignStatus,
  DemoNewsletterDeliveryStatus,
  DemoNewsletterSubscriber
} from '@/lib/demo-newsletter-seed';

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--vd-muted-fg)]">{label}</Label>
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
    <Card className="border-[var(--vd-border)] shadow-none">
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--vd-muted-fg)]">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--vd-fg)]">{value}</p>
        </div>
        <div
          className={cn(
            'rounded-full p-2',
            accent === 'success'
              ? 'bg-emerald-500/12 text-emerald-700'
              : accent === 'warning'
                ? 'bg-amber-500/14 text-amber-700'
                : 'bg-[var(--vd-muted)] text-[var(--vd-fg)]'
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  );
}

export function CampaignStatusBadge({ status }: { status: DemoNewsletterCampaignStatus }) {
  if (status === 'completed') {
    return <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Completed</Badge>;
  }
  if (status === 'queued') {
    return <Badge variant="outline">Queued</Badge>;
  }
  if (status === 'cancelled') {
    return <Badge variant="destructive">Cancelled</Badge>;
  }
  if (status === 'sending') {
    return <Badge variant="secondary">Sending</Badge>;
  }
  return <Badge variant="secondary">Draft</Badge>;
}

export function SubscriberStatusBadge({ status }: { status: DemoNewsletterSubscriber['status'] }) {
  if (status === 'subscribed') {
    return <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Subscribed</Badge>;
  }
  if (status === 'pending') {
    return <Badge variant="secondary">Pending</Badge>;
  }
  if (status === 'unsubscribed') {
    return <Badge variant="outline">Unsubscribed</Badge>;
  }
  return <Badge variant="secondary">No consent</Badge>;
}

export function DeliveryStatusBadge({ status }: { status: DemoNewsletterDeliveryStatus }) {
  if (status === 'sent') {
    return <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Sent</Badge>;
  }
  if (status === 'failed') {
    return <Badge variant="destructive">Failed</Badge>;
  }
  if (status === 'pending') {
    return <Badge variant="secondary">Pending</Badge>;
  }
  if (status === 'skipped_no_consent') {
    return <Badge variant="outline">Skipped: no consent</Badge>;
  }
  if (status === 'skipped_unsubscribed') {
    return <Badge variant="outline">Skipped: unsubscribed</Badge>;
  }
  return <Badge variant="outline">Skipped: suppressed</Badge>;
}
