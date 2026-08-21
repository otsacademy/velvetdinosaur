'use client';

import { WorkspaceErrorBanner } from '@/components/edit/workspace-error-banner';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Inbox, MailPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EMPTY_COUNTS, readJson, type ComposeDraft, type InboxMailbox, type MailItem, type MailboxCounts } from '@/components/edit/inbox-workspace.shared';
import { buildFollowUpEvent } from '@/components/edit/inbox/inbox-workspace.follow-up';
import {
  MESSAGE_MAILBOXES,
  ORGANIZE_MAILBOXES,
  QUICK_TABS,
  resetComposeDraft
} from '@/components/edit/inbox/inbox-layout.shared';
import { InboxSidebar } from '@/components/edit/inbox/inbox-sidebar';
import { InboxListColumn } from '@/components/edit/inbox/inbox-list-column';
import { InboxDetailPane } from '@/components/edit/inbox/inbox-detail-pane';
import { WorkspaceScopeNotice } from '@/components/edit/workspace-scope-notice';

export function InboxWorkspace() {
  const [mailbox, setMailbox] = useState<InboxMailbox>('inbox');
  const [mails, setMails] = useState<MailItem[]>([]);
  const [selectedMailId, setSelectedMailId] = useState('');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [onlyStarred, setOnlyStarred] = useState(false);
  const [selectedTag, setSelectedTag] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [counts, setCounts] = useState<MailboxCounts>(EMPTY_COUNTS);
  const [isComposing, setIsComposing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingAction, setPendingAction] = useState('');
  const [newTag, setNewTag] = useState('');
  const [draft, setDraft] = useState<ComposeDraft>(resetComposeDraft());
  const [threadMessages, setThreadMessages] = useState<MailItem[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const loadMails = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const params = new URLSearchParams();
      params.set('mailbox', mailbox);
      if (debouncedQuery) params.set('q', debouncedQuery);
      if (onlyUnread) params.set('unread', '1');
      if (onlyStarred) params.set('starred', '1');
      if (selectedTag) params.set('tag', selectedTag);
      const response = await fetch(`/api/inbox/messages?${params.toString()}`, {
        cache: 'no-store',
        credentials: 'include'
      });
      const payload = (await readJson(response)) as {
        items?: MailItem[];
        counts?: MailboxCounts;
        tags?: string[];
        error?: string;
      };
      if (!response.ok) throw new Error(payload?.error || 'Unable to load messages');

      const items = Array.isArray(payload.items) ? payload.items : [];
      setMails(items);
      setCounts(payload.counts || EMPTY_COUNTS);
      setTags(Array.isArray(payload.tags) ? payload.tags : []);
      if (items.length === 0) {
        setSelectedMailId('');
      } else if (!items.some((item) => item.id === selectedMailId) && !isComposing) {
        setSelectedMailId(items[0]?.id || '');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load messages');
      setMails([]);
    } finally {
      setIsLoading(false);
    }
  }, [mailbox, debouncedQuery, onlyUnread, onlyStarred, selectedTag, selectedMailId, isComposing]);

  useEffect(() => {
    void loadMails();
  }, [loadMails]);

  const selectedMail = useMemo(() => {
    return mails.find((mail) => mail.id === selectedMailId) ?? mails[0] ?? null;
  }, [mails, selectedMailId]);

  const unreadOpsCount = useMemo(
    () => mails.filter((mail) => !mail.isRead && mail.tags.some((tag) => tag.toLowerCase() === 'ops')).length,
    [mails]
  );

  useEffect(() => {
    if (isComposing || !selectedMail) {
      setThreadMessages([]);
      setThreadLoading(false);
      return;
    }

    let cancelled = false;
    setThreadLoading(true);
    setThreadMessages([selectedMail]);

    const params = new URLSearchParams();
    params.set('messageId', selectedMail.id);

    void (async () => {
      try {
        const response = await fetch(`/api/inbox/messages/thread?${params.toString()}`, {
          cache: 'no-store',
          credentials: 'include'
        });
        const payload = (await readJson(response)) as { error?: string; items?: MailItem[] };
        if (!response.ok) throw new Error(payload?.error || 'Unable to load thread');

        if (cancelled) return;
        const items = Array.isArray(payload.items) ? payload.items : [];
        setThreadMessages(items.length ? items : [selectedMail]);
      } catch {
        if (cancelled) return;
        setThreadMessages([selectedMail]);
      } finally {
        if (!cancelled) setThreadLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isComposing, selectedMail]);

  const selectMailbox = (next: InboxMailbox) => {
    setMailbox(next);
    setIsComposing(false);
  };

  const openComposer = () => {
    setIsComposing(true);
    setSelectedMailId('');
    setPendingAction('');
    setDraft(resetComposeDraft());
  };

  const selectMail = async (mail: MailItem) => {
    setSelectedMailId(mail.id);
    setIsComposing(false);
    if (mail.isRead) return;

    setMails((current) =>
      current.map((item) => (item.id === mail.id ? { ...item, isRead: true } : item))
    );
    setCounts((current) => ({ ...current, unread: Math.max(0, current.unread - 1) }));
    await fetch(`/api/inbox/messages/${encodeURIComponent(mail.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ isRead: true })
    }).catch(() => null);
  };

  const patchMessage = useCallback(async (id: string, payload: Record<string, unknown>) => {
    const response = await fetch(`/api/inbox/messages/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    const body = (await readJson(response)) as { error?: string };
    if (!response.ok) throw new Error(body?.error || 'Unable to update message');
    return body;
  }, []);

  const saveMessage = async (action: 'send' | 'draft') => {
    if (!draft.subject.trim() || !draft.message.trim()) {
      setErrorMessage('Subject and message are required.');
      return;
    }
    if (action === 'send' && !draft.to.trim()) {
      setErrorMessage('Recipient is required to send.');
      return;
    }

    setPendingAction(action);
    setErrorMessage('');
    try {
      const response = await fetch('/api/inbox/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action,
          to: draft.to,
          subject: draft.subject,
          message: draft.message,
          threadId: draft.threadId
        })
      });
      const payload = (await readJson(response)) as { error?: string };
      if (!response.ok) throw new Error(payload?.error || 'Failed to save message');

      setMailbox(action === 'send' ? 'sent' : 'drafts');
      setOnlyUnread(false);
      setOnlyStarred(false);
      setSelectedTag('');
      setIsComposing(false);
      setDraft(resetComposeDraft());
      await loadMails();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save message');
    } finally {
      setPendingAction('');
    }
  };

  const moveSelected = async (nextMailbox: InboxMailbox) => {
    if (!selectedMail) return;
    setPendingAction(`move-${nextMailbox}`);
    setErrorMessage('');
    try {
      const payload: Record<string, unknown> = { mailbox: nextMailbox, isRead: true };
      if (nextMailbox !== 'snoozed') payload.snoozedUntil = '';
      await patchMessage(selectedMail.id, payload);
      if (nextMailbox === 'trash') setMailbox('trash');
      if (nextMailbox === 'snoozed') setMailbox('snoozed');
      await loadMails();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to move message');
    } finally {
      setPendingAction('');
    }
  };

  const snoozeSelected = async () => {
    if (!selectedMail) return;
    setPendingAction('snooze');
    setErrorMessage('');
    try {
      const oneDayFromNow = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
      await patchMessage(selectedMail.id, {
        mailbox: 'snoozed',
        snoozedUntil: oneDayFromNow,
        isRead: true
      });
      setMailbox('snoozed');
      await loadMails();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to snooze message');
    } finally {
      setPendingAction('');
    }
  };

  const toggleStar = async () => {
    if (!selectedMail) return;
    setPendingAction('star');
    setErrorMessage('');
    try {
      await patchMessage(selectedMail.id, { isStarred: !selectedMail.isStarred });
      await loadMails();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to update star');
    } finally {
      setPendingAction('');
    }
  };

  const toggleRead = async () => {
    if (!selectedMail) return;
    setPendingAction('read');
    setErrorMessage('');
    try {
      await patchMessage(selectedMail.id, { isRead: !selectedMail.isRead });
      await loadMails();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to update read state');
    } finally {
      setPendingAction('');
    }
  };

  const removeOrTrashSelected = async () => {
    if (!selectedMail) return;
    setPendingAction('delete');
    setErrorMessage('');
    try {
      const response = await fetch(`/api/inbox/messages/${encodeURIComponent(selectedMail.id)}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const payload = (await readJson(response)) as { error?: string };
      if (!response.ok) throw new Error(payload?.error || 'Unable to remove message');
      await loadMails();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to remove message');
    } finally {
      setPendingAction('');
    }
  };

  const addTagToSelected = async () => {
    if (!selectedMail || !newTag.trim()) return;
    setPendingAction('tag');
    setErrorMessage('');
    try {
      await patchMessage(selectedMail.id, { addTag: newTag.trim().toLowerCase() });
      setNewTag('');
      await loadMails();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to add tag');
    } finally {
      setPendingAction('');
    }
  };

  const addPresetTag = async (tag: string) => {
    if (!selectedMail) return;
    setPendingAction('tag');
    setErrorMessage('');
    try {
      await patchMessage(selectedMail.id, { addTag: tag });
      await loadMails();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to add tag');
    } finally {
      setPendingAction('');
    }
  };

  const scheduleFollowUp = async () => {
    if (!selectedMail) return;
    setPendingAction('schedule');
    setErrorMessage('');
    try {
      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(buildFollowUpEvent(selectedMail))
      });
      const payload = (await readJson(response)) as { error?: string };
      if (!response.ok) throw new Error(payload?.error || 'Unable to schedule follow-up');
      await patchMessage(selectedMail.id, { addTag: 'action-needed' }).catch(() => null);
      await loadMails();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to schedule follow-up');
    } finally {
      setPendingAction('');
    }
  };

  const startReply = () => {
    if (!selectedMail) return;
    setDraft({
      to: selectedMail.fromEmail,
      subject: selectedMail.subject.startsWith('Re: ') ? selectedMail.subject : `Re: ${selectedMail.subject}`,
      message: `\n\n---\n${selectedMail.fromName} wrote:\n${selectedMail.body}`,
      threadId: selectedMail.threadId || selectedMail.id
    });
    setIsComposing(true);
  };

  return (
    <main className="space-y-6 py-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-[var(--vd-fg)]">Inbox</h1>
          <p className="text-sm text-[var(--vd-muted-fg)]">
            {mails.length} messages • {counts.unread} unread
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
          <Button onClick={openComposer}>
            <MailPlus className="h-4 w-4" />
            Compose
          </Button>
        </div>
      </div>

      <WorkspaceScopeNotice
        title="Shared transactional inbox"
        description="Use this space for contact-form mail, automated replies, and shared follow-up. It is not a personal mailbox."
        icon={Inbox}
      />

      {errorMessage ? <WorkspaceErrorBanner message={errorMessage} /> : null}

      <div className="grid min-h-[72vh] overflow-hidden rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] lg:grid-cols-[230px_340px_minmax(0,1fr)]">
        <InboxSidebar
          mailbox={mailbox}
          counts={counts}
          onlyUnread={onlyUnread}
          onlyStarred={onlyStarred}
          selectedTag={selectedTag}
          tags={tags}
          messageMailboxes={MESSAGE_MAILBOXES}
          organizeMailboxes={ORGANIZE_MAILBOXES}
          onSelectMailbox={selectMailbox}
          onToggleUnread={() => setOnlyUnread((current) => !current)}
          onToggleStarred={() => setOnlyStarred((current) => !current)}
          onSelectTag={setSelectedTag}
        />

        <InboxListColumn
          mailbox={mailbox}
          counts={counts}
          quickTabs={QUICK_TABS}
          query={query}
          onChangeQuery={setQuery}
          mails={mails}
          selectedMail={selectedMail}
          isComposing={isComposing}
          isLoading={isLoading}
          onSelectMailbox={selectMailbox}
          onSelectMail={(mail) => void selectMail(mail)}
        />

        <InboxDetailPane
          isComposing={isComposing}
          selectedMail={selectedMail}
          threadMessages={threadMessages}
          threadLoading={threadLoading}
          draft={draft}
          pendingAction={pendingAction}
          newTag={newTag}
          onChangeNewTag={setNewTag}
          onChangeDraft={setDraft}
          onStartReply={startReply}
          onScheduleFollowUp={() => void scheduleFollowUp()}
          onToggleRead={() => void toggleRead()}
          onToggleStar={() => void toggleStar()}
          onSnooze={() => void snoozeSelected()}
          onMoveArchive={() => void moveSelected('archive')}
          onMoveInbox={() => void moveSelected('inbox')}
          onDelete={() => void removeOrTrashSelected()}
          onAddTag={() => void addTagToSelected()}
          onAddPresetTag={(tag) => void addPresetTag(tag)}
          onSaveMessage={(action) => void saveMessage(action)}
          onCancelCompose={() => {
            setDraft(resetComposeDraft());
            setIsComposing(false);
          }}
        />
      </div>
    </main>
  );
}
