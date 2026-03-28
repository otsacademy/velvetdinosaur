'use client';

import { useState, type Dispatch, type SetStateAction } from 'react';
import { Archive, CalendarPlus, Reply, Send, Star, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DemoHelpTooltip } from '@/components/demo/demo-help-tooltip';
import { cn } from '@/lib/utils';
import { type ComposeDraft, type InboxMailbox, type MailItem } from '@/components/demo/inbox/demo-inbox.shared';

type DemoInboxDetailsPanelProps = {
  isComposing: boolean;
  selectedMail: MailItem | null;
  pendingAction: string;
  newTag: string;
  setNewTag: (value: string) => void;
  startReply: () => void;
  scheduleFollowUp: () => void;
  toggleRead: () => void;
  moveSelected: (nextMailbox: InboxMailbox) => Promise<void>;
  toggleStar: () => void;
  removeOrTrashSelected: () => void;
  addTagToSelected: () => void;
  addPresetTag: (tag: string) => void;
  draft: ComposeDraft;
  setDraft: Dispatch<SetStateAction<ComposeDraft>>;
  saveMessage: (action: 'send' | 'draft') => void;
  cancelCompose: () => void;
};

export function DemoInboxDetailsPanel({
  isComposing,
  selectedMail,
  pendingAction,
  newTag,
  setNewTag,
  startReply,
  scheduleFollowUp,
  toggleRead,
  moveSelected,
  toggleStar,
  removeOrTrashSelected,
  addTagToSelected,
  addPresetTag,
  draft,
  setDraft,
  saveMessage,
  cancelCompose
}: DemoInboxDetailsPanelProps) {
  const [showTagInput, setShowTagInput] = useState(false);

  return (
    <section className="flex h-full min-h-0 flex-col bg-[var(--vd-card)]">
      {!isComposing && selectedMail ? (
        <>
          <div className="space-y-4 border-b border-[var(--vd-border)] px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-[var(--vd-fg)]">{selectedMail.subject}</h2>
                <p className="text-sm text-[var(--vd-muted-fg)]">
                  From {selectedMail.fromName} • {selectedMail.fromEmail}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <DemoHelpTooltip content="Star this thread so it stays easy to find in the demo workspace.">
                  <Button variant="ghost" size="icon" title="Star" disabled={pendingAction !== ''} onClick={toggleStar}>
                    <Star className={cn('h-4 w-4', selectedMail.isStarred ? 'fill-current text-amber-500' : '')} />
                  </Button>
                </DemoHelpTooltip>
                <DemoHelpTooltip content="Move the thread into the archive without deleting the demo message.">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Archive"
                    disabled={pendingAction !== ''}
                    onClick={() => void moveSelected('archive')}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                </DemoHelpTooltip>
                <DemoHelpTooltip content="Send the message to the demo bin. If it is already in trash, this removes it from the session entirely.">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Delete"
                    disabled={pendingAction !== ''}
                    onClick={removeOrTrashSelected}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </DemoHelpTooltip>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <DemoHelpTooltip content="Open a reply draft prefilled with the current thread so you can demonstrate the response workflow quickly.">
                <Button className="w-fit" onClick={startReply} disabled={pendingAction !== ''}>
                  <Reply className="h-4 w-4" />
                  Reply
                </Button>
              </DemoHelpTooltip>
              <DemoHelpTooltip content="Stage a follow-up reminder for the team. In the demo this only adds a tag and does not create a real calendar task.">
                <Button variant="ghost" className="w-fit" onClick={scheduleFollowUp} disabled={pendingAction !== ''}>
                  <CalendarPlus className="h-4 w-4" />
                  Schedule follow-up
                </Button>
              </DemoHelpTooltip>
              <DemoHelpTooltip content="Flip the read state for this thread so you can show triage and revisit flows.">
                <Button variant="ghost" className="w-fit" onClick={toggleRead} disabled={pendingAction !== ''}>
                  Mark as {selectedMail.isRead ? 'unread' : 'read'}
                </Button>
              </DemoHelpTooltip>
              {selectedMail.mailbox === 'trash' ? (
                <DemoHelpTooltip content="Move the message out of the demo bin and back into the inbox list.">
                  <Button variant="ghost" className="w-fit" onClick={() => void moveSelected('inbox')}>
                    Restore to inbox
                  </Button>
                </DemoHelpTooltip>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {selectedMail.tags.map((tag) => (
                <Badge key={tag} className="border-transparent bg-[var(--vd-muted)] text-[var(--vd-fg)]">
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
                    onChange={(event) => setNewTag(event.target.value)}
                    placeholder="tag"
                    className="h-8 max-w-[180px]"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      addTagToSelected();
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
                      setNewTag('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}

              <Button size="sm" variant="ghost" onClick={() => addPresetTag('action-needed')} disabled={pendingAction !== ''}>
                #action-needed
              </Button>
              <Button size="sm" variant="ghost" onClick={() => addPresetTag('waiting')} disabled={pendingAction !== ''}>
                #waiting
              </Button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--vd-fg)]">{selectedMail.body}</p>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-1 border-b border-[var(--vd-border)] px-5 py-4">
            <h2 className="text-xl font-semibold text-[var(--vd-fg)]">Compose email</h2>
            <p className="text-sm text-[var(--vd-muted-fg)]">Draft replies in the demo. Nothing is sent outside this workspace.</p>
          </div>
          <div className="space-y-4 overflow-y-auto px-5 py-4">
            <Input
              value={draft.to}
              onChange={(event) => setDraft((current) => ({ ...current, to: event.target.value }))}
              placeholder="To (comma separated)"
            />
            <Input
              value={draft.subject}
              onChange={(event) => setDraft((current) => ({ ...current, subject: event.target.value }))}
              placeholder="Subject"
            />
            <Textarea
              value={draft.message}
              onChange={(event) => setDraft((current) => ({ ...current, message: event.target.value }))}
              placeholder="Write your message"
              className="min-h-[280px]"
            />
            <div className="flex flex-wrap items-center gap-2">
              <DemoHelpTooltip content="Simulate sending the email and move it into the Sent mailbox without contacting anyone outside this demo.">
                <Button onClick={() => saveMessage('send')} disabled={pendingAction !== ''}>
                  <Send className="h-4 w-4" />
                  {pendingAction === 'send' ? 'Sending…' : 'Send'}
                </Button>
              </DemoHelpTooltip>
              <DemoHelpTooltip content="Keep the message as a local draft so you can reopen it later in the walkthrough.">
                <Button variant="outline" onClick={() => saveMessage('draft')} disabled={pendingAction !== ''}>
                  {pendingAction === 'draft' ? 'Saving…' : 'Save draft'}
                </Button>
              </DemoHelpTooltip>
              <Button variant="outline" onClick={cancelCompose} disabled={pendingAction !== ''}>
                Cancel
              </Button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
