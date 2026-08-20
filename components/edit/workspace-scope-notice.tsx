import type { LucideIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type WorkspaceScopeNoticeProps = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export function WorkspaceScopeNotice({ title, description, icon: Icon }: WorkspaceScopeNoticeProps) {
  return (
    <Alert className="border-[var(--vd-border)] bg-[var(--vd-muted)]/20 text-[var(--vd-fg)] [&>svg]:text-[var(--vd-primary)]">
      <Icon className="h-4 w-4" />
      <div>
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{description}</AlertDescription>
      </div>
    </Alert>
  );
}
