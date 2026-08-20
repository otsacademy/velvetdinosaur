'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ActiveUsersPanel } from '@/components/admin/users/active-users-panel';
import { InvitationsPanel } from '@/components/admin/users/invitations-panel';
import type { ActiveUserRow, ActiveUsersSummary, ActiveUsersResponse, InviteRole } from '@/components/admin/users/types';

type PreservedContent = {
  newsArticles: number;
  pages: number;
  events: number;
};

type NoticeState =
  | { type: 'idle' }
  | { type: 'error'; title: string; message: string }
  | { type: 'success'; title: string; message: string };

function formatPreservedContentMessage(content: PreservedContent | null | undefined) {
  if (!content) {
    return 'Existing authored content remains on the site.'
  }

  return `Existing authored content remains on the site: ${content.newsArticles} news article(s), ${content.pages} page(s), and ${content.events} event(s).`
}

export function UsersManager() {
  const [users, setUsers] = useState<ActiveUserRow[]>([]);
  const [summary, setSummary] = useState<ActiveUsersSummary | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [pendingActionKey, setPendingActionKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeState>({ type: 'idle' });

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    const response = await fetch('/api/admin/users', { cache: 'no-store' });
    const payload = (await response.json().catch(() => null)) as ActiveUsersResponse | { error?: string } | null;
    if (!response.ok) {
      const message = payload && 'error' in payload && payload.error ? payload.error : 'Request failed.';
      setNotice({
        type: 'error',
        title: 'Unable to load users',
        message
      });
      toast.error('Unable to load users', { description: message });
      setLoadingUsers(false);
      return;
    }

    const typed = payload as ActiveUsersResponse;
    setUsers(Array.isArray(typed?.users) ? typed.users : []);
    setSummary(typed?.summary || null);
    setLoadingUsers(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    void loadUsers();
  }, [loadUsers]);

  const updateUserRole = useCallback(async (userId: string, role: InviteRole) => {
    const actionKey = `${userId}:role`;
    setPendingActionKey(actionKey);
    const response = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId, role })
    });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      const message = payload?.error || 'Request failed.';
      setNotice({
        type: 'error',
        title: 'Role update failed',
        message
      });
      toast.error('Role update failed', { description: message });
      setPendingActionKey(null);
      return;
    }

    setNotice({
      type: 'success',
      title: 'Role updated',
      message: 'User role was updated successfully.'
    });
    toast.success('Role updated', { description: 'User role was updated successfully.' });
    await loadUsers();
    setPendingActionKey(null);
  }, [loadUsers]);

  const sendPasswordReset = useCallback(async (userId: string) => {
    const actionKey = `${userId}:password-reset`;
    setPendingActionKey(actionKey);
    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'send-password-reset', userId })
    });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      const message = payload?.error || 'Request failed.';
      setNotice({
        type: 'error',
        title: 'Password reset failed',
        message
      });
      toast.error('Password reset failed', { description: message });
      setPendingActionKey(null);
      return;
    }

    setNotice({
      type: 'success',
      title: 'Password reset sent',
      message: 'A 6-digit reset code was emailed to the user. They can use it on the Forgot password page.'
    });
    toast.success('Password reset sent', {
      description: 'A 6-digit reset code was emailed to the user. They can use it on the Forgot password page.'
    });
    setPendingActionKey(null);
  }, []);

  const removeUser = useCallback(async (userId: string) => {
    const actionKey = `${userId}:remove`;
    setPendingActionKey(actionKey);
    const response = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    const payload = (await response.json().catch(() => null)) as
      | { error?: string; preservedContent?: PreservedContent | null }
      | null;

    if (!response.ok) {
      const message = payload?.error || 'Request failed.';
      setNotice({
        type: 'error',
        title: 'User removal failed',
        message
      });
      toast.error('User removal failed', { description: message });
      setPendingActionKey(null);
      return;
    }

    const message = formatPreservedContentMessage(payload?.preservedContent);
    setNotice({
      type: 'success',
      title: 'User access removed',
      message
    });
    toast.success('User access removed', { description: message });
    await loadUsers();
    setPendingActionKey(null);
  }, [loadUsers]);

  return (
    <div className="space-y-6">
      {notice.type === 'error' ? (
        <Alert variant="destructive">
          <AlertTitle>{notice.title}</AlertTitle>
          <AlertDescription>{notice.message}</AlertDescription>
        </Alert>
      ) : null}

      {notice.type === 'success' ? (
        <Alert>
          <AlertTitle>{notice.title}</AlertTitle>
          <AlertDescription>{notice.message}</AlertDescription>
        </Alert>
      ) : null}

      <ActiveUsersPanel
        users={users}
        summary={summary}
        loading={loadingUsers}
        pendingActionKey={pendingActionKey}
        onRefresh={loadUsers}
        onUpdateRole={updateUserRole}
        onSendPasswordReset={sendPasswordReset}
        onRemoveUser={removeUser}
      />

      <InvitationsPanel />
    </div>
  );
}
