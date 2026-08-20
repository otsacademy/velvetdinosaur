'use client';

import { CheckCircle2, Clock3, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { InviteStatus } from '@/components/admin/users/types';

export function InviteStatusBadge({ status }: { status: InviteStatus }) {
  if (status === 'used') {
    return (
      <Badge className="border-emerald-600/30 bg-emerald-600/15 text-emerald-700">
        <CheckCircle2 className="mr-1 size-3.5" />
        Accepted
      </Badge>
    );
  }
  if (status === 'pending') {
    return (
      <Badge className="border-sky-600/30 bg-sky-600/15 text-sky-700">
        <Clock3 className="mr-1 size-3.5" />
        Active
      </Badge>
    );
  }
  if (status === 'expired') {
    return (
      <Badge className="border-amber-600/30 bg-amber-600/15 text-amber-700">
        <Clock3 className="mr-1 size-3.5" />
        Expired
      </Badge>
    );
  }
  return (
    <Badge className="border-red-600/30 bg-red-600/15 text-red-700">
      <XCircle className="mr-1 size-3.5" />
      Revoked
    </Badge>
  );
}
