'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { MailPlus, Search, Star } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DemoHelpTooltip } from '@/components/demo/demo-help-tooltip';
import { DemoInboxDetailsPanel } from '@/components/demo/inbox/demo-inbox-details-panel';
import {
  createDemoInboxSeed,
  createDemoOutboundMessage,
  deriveMailboxCounts,
  formatReceivedAt,
  MAILBOX_OPTIONS,
  type ComposeDraft,
  type InboxMailbox,
  type MailItem
} from '@/components/demo/inbox/demo-inbox.shared';
import { cn } from '@/lib/utils';

const ACTION_DELAY_MS = 140;

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function uniqueTags(items: MailItem[]) {
  return Array.from(new Set(items.flatMap((item) => item.tags))).sort((left, right) => left.localeCompare(right));
}

function previewMail(items: MailItem[], mailbox: InboxMailbox) {
  if (mailbox === 'all') {
    return items.find((item) => item.mailbox === 'inbox') ?? items[0] ?? null;
  }
  return items.find((item) => item.mailbox === mailbox) ?? items[0] ?? null;
}

export function DemoInboxWorkspace() {
  const initialMails = useMemo(() => createDemoInboxSeed(), []);
  const [mailbox, setMailbox] = useState<InboxMailbox>('inbox');
  const [mails, setMails] = useState<MailItem[]>(initialMails);
  const [selectedMailId, setSelectedMailId] = useState(previewMail(initialMails, 'inbox')?.id ?? '');
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query.trim());
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [onlyStarred, setOnlyStarred] = useState(false);
  const [selectedTag, setSelectedTag] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingAction, setPendingAction] = useState('');
  const [newTag, setNewTag] = useState('');
  const [draft, setDraft] = useState<ComposeDraft>({ to: '', subject: '', message: '' });

  const counts = useMemo(() => deriveMailboxCounts(mails), [mails]);

  const mailboxScopedItems = useMemo(() => {
    return mails.filter((mail) => (mailbox === 'all' ? true : mail.mailbox === mailbox));
  }, [mailbox, mails]);

  const tags = useMemo(() => uniqueTags(mailboxScopedItems), [mailboxScopedItems]);

  const visibleMails = useMemo(() => {
    const normalizedQuery = deferredQuery.toLowerCase();
    return mailboxScopedItems.filter((mail) => {
      if (onlyUnread && mail.isRead) return false;
      if (onlyStarred && !mail.isStarred) return false;
      if (selectedTag && !mail.tags.includes(selectedTag)) return false;
      if (!normalizedQuery) return true;
      return [mail.fromName, mail.fromEmail, mail.subject, mail.preview, mail.body]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [deferredQuery, mailboxScopedItems, onlyStarred, onlyUnread, selectedTag]);

  const selectedMail = useMemo(() => {
    if (isComposing) return null;
    return visibleMails.find((mail) => mail.id === selectedMailId) ?? visibleMails[0] ?? null;
  }, [isComposing, selectedMailId, visibleMails]);

  const unreadOpsCount = useMemo(
    () => mails.filter((mail) => !mail.isRead && mail.tags.some((tag) => tag.toLowerCase() === 'ops')).length,
    [mails]
  );

  useEffect(() => {
    if (!selectedTag) return;
    if (tags.includes(selectedTag)) return;
    setSelectedTag('');
  }, [selectedTag, tags]);

  useEffect(() => {
    if (isComposing) return;
    if (visibleMails.length === 0) {
      setSelectedMailId('');
      return;
    }
    if (visibleMails.some((mail) => mail.id === selectedMailId)) return;
    setSelectedMailId(visibleMails[0]?.id ?? '');
  }, [isComposing, selectedMailId, visibleMails]);

  function updateMail(id: string, updater: (mail: MailItem) => MailItem) {
    setMails((current) => current.map((mail) => (mail.id === id ? updater(mail) : mail)));
  }

  function removeMail(id: string) {
    setMails((current) => current.filter((mail) => mail.id !== id));
  }

  async function runAction(action: string, work: () => void, successMessage?: string) {
    setPendingAction(action);
    setErrorMessage('');
    try {
      await sleep(ACTION_DELAY_MS);
      work();
      if (successMessage) {
        toast.info(successMessage);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to update this demo inbox.');
    } finally {
      setPendingAction('');
    }
  }

  function resetDraft() {
    setDraft({ to: '', subject: '', message: '' });
  }

  function selectMailbox(nextMailbox: InboxMailbox) {
    setMailbox(nextMailbox);
    setIsComposing(false);
    setOnlyUnread(false);
    setOnlyStarred(false);
    setSelectedTag('');
  }

  function selectMail(mail: MailItem) {
    setSelectedMailId(mail.id);
    setIsComposing(false);
    if (!mail.isRead) {
      updateMail(mail.id, (current) => ({ ...current, isRead: true }));
    }
  }

  function openComposer() {
    setErrorMessage('');
    setPendingAction('');
    resetDraft();
    setSelectedMailId('');
    setIsComposing(true);
  }

  function startReply() {
    if (!selectedMail) return;
    setDraft({
      to: selectedMail.fromEmail,
      subject: selectedMail.subject.startsWith('Re: ') ? selectedMail.subject : `Re: ${selectedMail.subject}`,
      message: `Hello ${selectedMail.fromName.split(' ')[0]},\n\nThanks for the note.\n\n---\n${selectedMail.fromName} wrote:\n${selectedMail.body}`
    });
    setIsComposing(true);
  }

  async function saveMessage(action: 'send' | 'draft') {
    if (!draft.subject.trim() || !draft.message.trim()) {
      setErrorMessage('Subject and message are required.');
      return;
    }
    if (action === 'send' && !draft.to.trim()) {
      setErrorMessage('Recipient is required to send.');
      return;
    }

    const nextMessage = createDemoOutboundMessage(draft, action);
    await runAction(
      action,
      () => {
        setMails((current) => [nextMessage, ...current]);
        setMailbox(action === 'send' ? 'sent' : 'drafts');
        setOnlyUnread(false);
        setOnlyStarred(false);
        setSelectedTag('');
        setSelectedMailId(nextMessage.id);
        setIsComposing(false);
        resetDraft();
      },
      action === 'send'
        ? 'This is a demonstration inbox, so no email has been sent.'
        : 'Draft saved for this demonstration session only.'
    );
  }

  async function patchSelected(id: string, updater: (mail: MailItem) => MailItem) {
    await runAction('update', () => updateMail(id, updater));
  }

  async function moveSelected(nextMailbox: InboxMailbox) {
    if (!selectedMail) return;
    await runAction('move', () => {
      updateMail(selectedMail.id, (mail) => ({ ...mail, mailbox: nextMailbox, isRead: true }));
      if (nextMailbox === 'trash') {
        setMailbox('trash');
      }
    });
  }

  async function toggleStar() {
    if (!selectedMail) return;
    await patchSelected(selectedMail.id, (mail) => ({ ...mail, isStarred: !mail.isStarred }));
  }

  async function toggleRead() {
    if (!selectedMail) return;
    await patchSelected(selectedMail.id, (mail) => ({ ...mail, isRead: !mail.isRead }));
  }

  async function removeOrTrashSelected() {
    if (!selectedMail) return;
    if (selectedMail.mailbox === 'trash') {
      await runAction('delete', () => removeMail(selectedMail.id), 'Message removed from this demo inbox.');
      return;
    }

    await runAction('trash', () => {
      updateMail(selectedMail.id, (mail) => ({ ...mail, mailbox: 'trash', isRead: true }));
      setMailbox('trash');
    });
  }

  async function addTagToSelected() {
    if (!selectedMail || !newTag.trim()) return;
    const tag = newTag.trim().toLowerCase();
    await runAction('tag', () => {
      updateMail(selectedMail.id, (mail) => ({
        ...mail,
        tags: mail.tags.includes(tag) ? mail.tags : [...mail.tags, tag]
      }));
      setNewTag('');
    });
  }

  async function addPresetTag(tag: string) {
    if (!selectedMail) return;
    await runAction('tag', () => {
      updateMail(selectedMail.id, (mail) => ({
        ...mail,
        tags: mail.tags.includes(tag) ? mail.tags : [...mail.tags, tag]
      }));
    });
  }

  async function scheduleFollowUp() {
    if (!selectedMail) return;
    await runAction(
      'schedule',
      () => {
        updateMail(selectedMail.id, (mail) => ({
          ...mail,
          tags: mail.tags.includes('action-needed') ? mail.tags : [...mail.tags, 'action-needed']
        }));
      },
      'Follow-up staged in the demo only. No calendar event has been created.'
    );
  }

  return (
    <main className="space-y-6 py-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-[var(--vd-fg)]">Inbox</h1>
          <p className="text-sm text-[var(--vd-muted-fg)]">
            {visibleMails.length} messages • {counts.unread} unread
            {unreadOpsCount > 0 ? ` • ${unreadOpsCount} urgent ops` : ''} • {counts.starred} starred
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--vd-muted)] px-2.5 py-1 text-xs text-[var(--vd-muted-fg)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--vd-primary)]" />
            {counts.unread} unread
          </span>
          {unreadOpsCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs text-amber-800">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
              {unreadOpsCount} urgent ops
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--vd-muted)] px-2.5 py-1 text-xs text-[var(--vd-muted-fg)]">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            {counts.starred} starred
          </span>
          <DemoHelpTooltip content="Open a fresh message draft. Sending from this inbox updates the demo only and never reaches a real recipient.">
            <Button onClick={openComposer}>
              <MailPlus className="h-4 w-4" />
              Compose
            </Button>
          </DemoHelpTooltip>
        </div>
      </div>

      {errorMessage ? (
        <p className="rounded-[var(--vd-radius)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <div className="grid min-h-[72vh] overflow-hidden rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] lg:grid-cols-[230px_340px_minmax(0,1fr)]">
        <section className="border-b border-[var(--vd-border)] px-2 py-3 lg:border-b-0 lg:border-r">
          <div className="px-3 pb-3">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--vd-muted-fg)]">Folders</p>
          </div>

          <div className="space-y-0.5">
            {MAILBOX_OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = mailbox === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => selectMailbox(option.key)}
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

          <div className="mt-4 space-y-2 px-3">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--vd-muted-fg)]">Quick filters</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setOnlyUnread((current) => !current)}
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
                onClick={() => setOnlyStarred((current) => !current)}
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
                  onClick={() => setSelectedTag('')}
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
                    onClick={() => setSelectedTag(tag)}
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

        <section className="flex min-h-0 flex-col border-b border-[var(--vd-border)] lg:border-b-0 lg:border-r">
          <div className="space-y-2 px-4 py-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--vd-muted-fg)]" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search subject, sender, message"
                className="border-[var(--vd-border)] pl-9"
              />
            </div>
            <p className="text-xs text-[var(--vd-muted-fg)]">{visibleMails.length} messages</p>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <div>
              {visibleMails.map((mail) => {
                const active = mail.id === selectedMail?.id && !isComposing;
                return (
                  <button
                    key={mail.id}
                    type="button"
                    onClick={() => selectMail(mail)}
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
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-[var(--vd-fg)]">
                        {mail.mailbox === 'sent' || mail.mailbox === 'drafts' ? mail.subject : mail.fromName}
                      </p>
                      <span className="shrink-0 text-xs text-[var(--vd-muted-fg)]">{formatReceivedAt(mail.receivedAt)}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      {!mail.isRead ? <span className="h-1.5 w-1.5 rounded-full bg-[var(--vd-primary)]" /> : null}
                      {mail.isStarred ? <Star className="h-3.5 w-3.5 fill-current text-amber-500" /> : null}
                      <p className="truncate text-sm text-[var(--vd-fg)]">{mail.subject}</p>
                    </div>
                    <p className="mt-1 truncate text-xs text-[var(--vd-muted-fg)]">{mail.preview}</p>
                  </button>
                );
              })}

              {visibleMails.length === 0 ? (
                <p className="px-4 py-6 text-sm text-[var(--vd-muted-fg)]">No messages match this filter.</p>
              ) : null}
            </div>
          </ScrollArea>
        </section>

        <section className="min-h-0">
          <DemoInboxDetailsPanel
            isComposing={isComposing}
            selectedMail={selectedMail}
            pendingAction={pendingAction}
            newTag={newTag}
            setNewTag={setNewTag}
            startReply={startReply}
            scheduleFollowUp={() => void scheduleFollowUp()}
            toggleRead={() => void toggleRead()}
            moveSelected={moveSelected}
            toggleStar={() => void toggleStar()}
            removeOrTrashSelected={() => void removeOrTrashSelected()}
            addTagToSelected={() => void addTagToSelected()}
            addPresetTag={(tag) => void addPresetTag(tag)}
            draft={draft}
            setDraft={setDraft}
            saveMessage={(action) => void saveMessage(action)}
            cancelCompose={() => {
              resetDraft();
              setIsComposing(false);
            }}
          />
        </section>
      </div>
    </main>
  );
}
