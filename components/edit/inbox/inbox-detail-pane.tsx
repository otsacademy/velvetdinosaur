'use client';

import { useState } from 'react';
import { Archive, CalendarPlus, Clock3, Reply, Send, Star, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { formatReceivedAt, type ComposeDraft, type MailItem } from '@/components/edit/inbox-workspace.shared';

type InboxDetailPaneProps = {
  isComposing: boolean;
  selectedMail: MailItem | null;
  threadMessages: MailItem[];
  threadLoading: boolean;
  draft: ComposeDraft;
  pendingAction: string;
  newTag: string;
  onChangeNewTag: (value: string) => void;
  onChangeDraft: (next: ComposeDraft) => void;
  onStartReply: () => void;
  onScheduleFollowUp: () => void;
  onToggleRead: () => void;
  onToggleStar: () => void;
  onSnooze: () => void;
  onMoveArchive: () => void;
  onMoveInbox: () => void;
  onDelete: () => void;
  onAddTag: () => void;
  onAddPresetTag: (tag: string) => void;
  onSaveMessage: (action: 'send' | 'draft') => void;
  onCancelCompose: () => void;
};

export function InboxDetailPane({
  isComposing,
  selectedMail,
  threadMessages,
  threadLoading,
  draft,
  pendingAction,
  newTag,
  onChangeNewTag,
  onChangeDraft,
  onStartReply,
  onScheduleFollowUp,
  onToggleRead,
  onToggleStar,
  onSnooze,
  onMoveArchive,
  onMoveInbox,
  onDelete,
  onAddTag,
  onAddPresetTag,
  onSaveMessage,
  onCancelCompose
}: InboxDetailPaneProps) {
  const [showTagInput, setShowTagInput] = useState(false);

  return (
    <section className="flex h-full min-h-0 flex-col bg-[var(--vd-card)]">
      {!isComposing && selectedMail ? (
        <>
          <div className="space-y-3 border-b border-[var(--vd-border)] px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--vd-muted-fg)]">
                  Conversation thread
                </p>
                <h2 className="text-xl font-semibold text-[var(--vd-fg)]">{selectedMail.subject}</h2>
                <p className="text-sm text-[var(--vd-muted-fg)]">
                  {threadLoading
                    ? 'Loading thread…'
                    : `${threadMessages.length} message(s) in this thread`}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" title="Star" disabled={pendingAction !== ''} onClick={onToggleStar}>
                  <Star className={cn('h-4 w-4', selectedMail.isStarred ? 'fill-current text-amber-500' : '')} />
                </Button>
                <Button variant="ghost" size="icon" title="Snooze" disabled={pendingAction !== ''} onClick={onSnooze}>
                  <Clock3 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" title="Archive" disabled={pendingAction !== ''} onClick={onMoveArchive}>
                  <Archive className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" title="Delete" disabled={pendingAction !== ''} onClick={onDelete}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button className="w-fit" onClick={onStartReply}>
                <Reply className="h-4 w-4" />
                Reply
              </Button>
              <Button variant="ghost" className="w-fit" onClick={onScheduleFollowUp} disabled={pendingAction !== ''}>
                <CalendarPlus className="h-4 w-4" />
                Schedule follow-up
              </Button>
              <Button variant="ghost" className="w-fit" onClick={onToggleRead}>
                Mark as {selectedMail.isRead ? 'unread' : 'read'}
              </Button>
              {selectedMail.mailbox === 'trash' ? (
                <Button variant="ghost" className="w-fit" onClick={onMoveInbox}>
                  Restore to inbox
                </Button>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {selectedMail.tags.map((tag) => (
                <Badge key={tag} className="border-[var(--vd-border)] bg-[var(--vd-muted)] text-[var(--vd-fg)]">
                  #{tag}
                </Badge>
              ))}
              {!showTagInput ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-auto px-0 text-xs text-[var(--vd-muted-fg)]"
                  onClick={() => setShowTagInput(true)}
                >
                  + Add tag
                </Button>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    value={newTag}
                    onChange={(event) => onChangeNewTag(event.target.value)}
                    placeholder="tag"
                    className="h-8 max-w-[180px]"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      onAddTag();
                      setShowTagInput(false);
                    }}
                    disabled={pendingAction !== ''}
                  >
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowTagInput(false);
                      onChangeNewTag('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
              <Button size="sm" variant="ghost" onClick={() => onAddPresetTag('ops')} disabled={pendingAction !== ''}>
                #ops
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onAddPresetTag('action-needed')} disabled={pendingAction !== ''}>
                #action-needed
              </Button>
            </div>
          </div>
          <Separator />
          <div className="mt-0 space-y-4 p-5">
            <ScrollArea className="h-[45vh] pr-2">
              <div className="space-y-3">
                {threadMessages.map((item) => (
                  <article key={item.id} className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[var(--vd-fg)]">{item.fromName || item.fromEmail}</p>
                      <p className="text-xs text-[var(--vd-muted-fg)]">{formatReceivedAt(item.receivedAt)}</p>
                    </div>
                    <p className="text-xs text-[var(--vd-muted-fg)]">
                      To {item.to.length ? item.to.join(', ') : 'No recipients'}
                    </p>
                    <pre className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--vd-fg)]">{item.body}</pre>
                  </article>
                ))}
              </div>
            </ScrollArea>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-1 border-b border-[var(--vd-border)] px-5 py-4">
            <h2 className="text-xl font-semibold text-[var(--vd-fg)]">Compose email</h2>
            <p className="text-sm text-[var(--vd-muted-fg)]">Draft and send messages from this workspace.</p>
          </div>
          <Separator />
          <div className="mt-0 space-y-4 overflow-y-auto p-5">
            <div className="space-y-1.5">
              <Label>To</Label>
              <Input
                value={draft.to}
                onChange={(event) => onChangeDraft({ ...draft, to: event.target.value })}
                placeholder="To (comma separated)"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Input
                value={draft.subject}
                onChange={(event) => onChangeDraft({ ...draft, subject: event.target.value })}
                placeholder="Subject"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Message</Label>
              <Textarea
                value={draft.message}
                onChange={(event) => onChangeDraft({ ...draft, message: event.target.value })}
                placeholder="Write your message"
                className="min-h-[280px]"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => onSaveMessage('send')} disabled={pendingAction !== ''}>
                <Send className="h-4 w-4" />
                {pendingAction === 'send' ? 'Sending…' : 'Send'}
              </Button>
              <Button variant="outline" onClick={() => onSaveMessage('draft')} disabled={pendingAction !== ''}>
                {pendingAction === 'draft' ? 'Saving…' : 'Save draft'}
              </Button>
              <Button variant="outline" onClick={onCancelCompose} disabled={pendingAction !== ''}>
                Cancel
              </Button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
