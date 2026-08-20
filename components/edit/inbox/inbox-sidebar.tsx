'use client';

import { Mail } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { type InboxMailbox, type MailboxCounts } from '@/components/edit/inbox-workspace.shared';

type MailboxRow = {
  key: InboxMailbox;
  label: string;
  icon: typeof Mail;
  countKey: keyof MailboxCounts;
};

type InboxSidebarProps = {
  mailbox: InboxMailbox;
  counts: MailboxCounts;
  onlyUnread: boolean;
  onlyStarred: boolean;
  selectedTag: string;
  tags: string[];
  messageMailboxes: MailboxRow[];
  organizeMailboxes: MailboxRow[];
  onSelectMailbox: (next: InboxMailbox) => void;
  onToggleUnread: () => void;
  onToggleStarred: () => void;
  onSelectTag: (next: string) => void;
};

export function InboxSidebar({
  mailbox,
  counts,
  onlyUnread,
  onlyStarred,
  selectedTag,
  tags,
  messageMailboxes,
  organizeMailboxes,
  onSelectMailbox,
  onToggleUnread,
  onToggleStarred,
  onSelectTag
}: InboxSidebarProps) {
  const folders = [...messageMailboxes, ...organizeMailboxes];

  return (
    <section className="border-b border-[var(--vd-border)] px-2 py-3 lg:border-b-0 lg:border-r">
      <div className="px-3 pb-3">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--vd-muted-fg)]">Folders</p>
      </div>
      <div className="space-y-0.5">
        {folders.map((option) => {
          const Icon = option.icon;
          const active = mailbox === option.key;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onSelectMailbox(option.key)}
              className={cn(
                'flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors',
                active
                  ? 'bg-[var(--vd-muted)] text-[var(--vd-fg)]'
                  : 'text-[var(--vd-muted-fg)] hover:bg-[var(--vd-muted)]/60 hover:text-[var(--vd-fg)]'
              )}
            >
              <span className="inline-flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {option.label}
              </span>
              <span className="text-xs">{counts[option.countKey]}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 px-3">
        <Separator />
      </div>

      <div className="mt-4 space-y-2 px-3">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--vd-muted-fg)]">Quick filters</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onToggleUnread}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              onlyUnread
                ? 'bg-[var(--vd-primary)]/15 text-[var(--vd-fg)]'
                : 'bg-[var(--vd-muted)] text-[var(--vd-muted-fg)] hover:text-[var(--vd-fg)]'
            )}
          >
            Unread only
          </button>
          <button
            type="button"
            onClick={onToggleStarred}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              onlyStarred
                ? 'bg-[var(--vd-primary)]/15 text-[var(--vd-fg)]'
                : 'bg-[var(--vd-muted)] text-[var(--vd-muted-fg)] hover:text-[var(--vd-fg)]'
            )}
          >
            Starred only
          </button>
        </div>
      </div>

      {tags.length ? (
        <div className="mt-4 space-y-2 px-3 pb-2">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--vd-muted-fg)]">Tags</p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => onSelectTag('')}
              className={cn(
                'rounded-full px-2.5 py-1 text-xs',
                !selectedTag
                  ? 'bg-[var(--vd-primary)]/15 text-[var(--vd-fg)]'
                  : 'bg-[var(--vd-muted)] text-[var(--vd-muted-fg)] hover:text-[var(--vd-fg)]'
              )}
            >
              All
            </button>
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => onSelectTag(tag)}
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs',
                  selectedTag === tag
                    ? 'bg-[var(--vd-primary)]/15 text-[var(--vd-fg)]'
                    : 'bg-[var(--vd-muted)] text-[var(--vd-muted-fg)] hover:text-[var(--vd-fg)]'
                )}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
