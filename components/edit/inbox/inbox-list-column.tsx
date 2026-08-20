'use client';

import { Inbox, Mail, Search, Star } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatReceivedAt, type InboxMailbox, type MailItem, type MailboxCounts } from '@/components/edit/inbox-workspace.shared';
import { senderInitials } from '@/components/edit/inbox/inbox-layout.shared';

type QuickTab = { key: InboxMailbox; label: string; countKey: keyof MailboxCounts };

type InboxListColumnProps = {
  mailbox: InboxMailbox;
  counts: MailboxCounts;
  quickTabs: QuickTab[];
  query: string;
  onChangeQuery: (value: string) => void;
  mails: MailItem[];
  selectedMail: MailItem | null;
  isComposing: boolean;
  isLoading: boolean;
  onSelectMailbox: (next: InboxMailbox) => void;
  onSelectMail: (mail: MailItem) => void;
};

export function InboxListColumn({
  mailbox,
  counts,
  quickTabs,
  query,
  onChangeQuery,
  mails,
  selectedMail,
  isComposing,
  isLoading,
  onSelectMailbox,
  onSelectMail
}: InboxListColumnProps) {
  return (
    <section className="flex min-h-0 flex-col border-b border-[var(--vd-border)] lg:border-b-0 lg:border-r">
      <div className="space-y-2 px-4 py-4">
        <div className="flex flex-wrap gap-1">
          {quickTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => onSelectMailbox(tab.key)}
              className={cn(
                'rounded-[var(--vd-radius)] border px-2.5 py-1 text-xs font-medium',
                mailbox === tab.key
                  ? 'border-[var(--vd-ring)] bg-[var(--vd-muted)]/70 text-[var(--vd-fg)]'
                  : 'border-[var(--vd-border)] text-[var(--vd-muted-fg)] hover:bg-[var(--vd-muted)]/40'
              )}
            >
              {tab.label} ({counts[tab.countKey]})
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--vd-muted-fg)]" />
          <Input
            value={query}
            onChange={(event) => onChangeQuery(event.target.value)}
            placeholder="Search subject, sender, message"
            className="border-[var(--vd-border)] pl-9"
          />
        </div>
        <p className="flex items-center gap-1.5 text-xs text-[var(--vd-muted-fg)]">
          <Inbox className="h-3.5 w-3.5" />
          {isLoading ? 'Loading messages…' : `${mails.length} messages`}
        </p>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div>
          {mails.map((mail) => {
            const active = mail.id === selectedMail?.id && !isComposing;
            return (
              <button
                key={mail.id}
                type="button"
                onClick={() => onSelectMail(mail)}
                className={cn(
                  'relative w-full border-b border-[var(--vd-border)] px-4 py-3 text-left transition-colors hover:bg-[var(--vd-muted)]/35',
                  active ? 'bg-[var(--vd-muted)]/45' : ''
                )}
              >
                <span
                  className={cn(
                    'absolute bottom-0 left-0 top-0 w-0.5 bg-[var(--vd-primary)] transition-opacity',
                    active ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <div className="flex items-start gap-2.5">
                  <Avatar className="h-8 w-8 border border-[var(--vd-border)]">
                    <AvatarFallback className="text-xs text-[var(--vd-fg)]">{senderInitials(mail)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-[var(--vd-fg)]">{mail.fromName || mail.fromEmail}</p>
                      <span className="shrink-0 text-xs text-[var(--vd-muted-fg)]">{formatReceivedAt(mail.receivedAt)}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      {!mail.isRead ? <span className="h-1.5 w-1.5 rounded-full bg-[var(--vd-primary)]" /> : null}
                      {mail.isStarred ? <Star className="h-3.5 w-3.5 fill-current text-amber-500" /> : null}
                      <p className="truncate text-sm text-[var(--vd-fg)]">{mail.subject}</p>
                    </div>
                    <p className="mt-1 truncate text-xs text-[var(--vd-muted-fg)]">{mail.preview}</p>
                  </div>
                </div>
              </button>
            );
          })}
          {!isLoading && mails.length === 0 ? (
            <p className="px-4 py-6 text-sm text-[var(--vd-muted-fg)]">
              No messages match this filter.
            </p>
          ) : null}
        </div>
      </ScrollArea>
    </section>
  );
}
