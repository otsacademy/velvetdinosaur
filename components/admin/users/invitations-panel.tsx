'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ASAP_CHAPTER_OPTIONS } from '@/lib/chapters';
import { Copy, Mail, RefreshCw, ShieldOff, UserPlus } from 'lucide-react';
import { InviteStatusBadge } from '@/components/admin/users/invite-status-badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CreateInviteResponse,
  displayInviteName,
  formatDate,
  getInviteStatus,
  type InviteRole,
  type InviteRow,
  type InviteStatus,
  type InviteView
} from '@/components/admin/users/types';

type NoticeState =
  | { type: 'idle' }
  | { type: 'error'; title: string; message: string }
  | { type: 'success'; title: string; message: string };

type InviteSort = 'newest' | 'oldest';

export function InvitationsPanel() {
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [orcidId, setOrcidId] = useState('');
  const [primaryChapterSlug, setPrimaryChapterSlug] = useState('');
  const [role, setRole] = useState<InviteRole>('user');
  const [sendEmail, setSendEmail] = useState(true);
  const [latestInviteUrl, setLatestInviteUrl] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeState>({ type: 'idle' });
  const [inviteView, setInviteView] = useState<InviteView>('active');
  const [inviteSearch, setInviteSearch] = useState('');
  const [inviteSort, setInviteSort] = useState<InviteSort>('newest');
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteToRevoke, setInviteToRevoke] = useState<InviteRow | null>(null);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  const loadInvites = useCallback(async () => {
    setLoading(true);
    const response = await fetch('/api/admin/invites', { cache: 'no-store' });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setNotice({
        type: 'error',
        title: 'Unable to load invites',
        message: payload?.error || 'Request failed.'
      });
      setLoading(false);
      return;
    }

    setInvites((payload?.invites || []) as InviteRow[]);
    setCurrentTime(Date.now());
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    void loadInvites();
  }, [loadInvites]);

  const createInvite = useCallback(async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();
    const normalizedOrcidId = orcidId.trim();

    if (!normalizedEmail) {
      setNotice({ type: 'error', title: 'Missing email', message: 'Enter an email address first.' });
      return;
    }
    if (!normalizedFirstName) {
      setNotice({ type: 'error', title: 'Missing first name', message: 'Enter the invitee first name.' });
      return;
    }
    if (!normalizedLastName) {
      setNotice({ type: 'error', title: 'Missing last name', message: 'Enter the invitee last name.' });
      return;
    }
    if (!primaryChapterSlug) {
      setNotice({ type: 'error', title: 'Missing chapter', message: 'Select the invitee primary chapter.' });
      return;
    }

    setBusy(true);
    const response = await fetch('/api/admin/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: normalizedEmail,
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        orcidId: normalizedOrcidId,
        primaryChapterSlug,
        role,
        sendEmail
      })
    });
    const payload = (await response.json().catch(() => null)) as CreateInviteResponse | { error?: string } | null;
    if (!response.ok) {
      setNotice({
        type: 'error',
        title: 'Invite failed',
        message: payload && 'error' in payload && payload.error ? payload.error : 'Request failed.'
      });
      setBusy(false);
      return;
    }

    const created = payload as CreateInviteResponse;
    setLatestInviteUrl(created.inviteUrl);
    setEmail('');
    setFirstName('');
    setLastName('');
    setOrcidId('');
    setPrimaryChapterSlug('');
    setNotice({
      type: 'success',
      title: created.emailSent ? 'Invite sent' : 'Invite created',
      message: created.emailSent
        ? `${created.invite.firstName} ${created.invite.lastName} invited as ${created.invite.role} for ${created.invite.primaryChapterName}.`
        : `Invite created for ${created.invite.email}. Share the invite URL manually.`
    });
    setCreateOpen(true);
    await loadInvites();
    setBusy(false);
  }, [email, firstName, lastName, loadInvites, orcidId, primaryChapterSlug, role, sendEmail]);

  const revokeInvite = useCallback(
    async (id: string) => {
      setBusy(true);
      const response = await fetch('/api/admin/invites/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setNotice({
          type: 'error',
          title: 'Revoke failed',
          message: payload?.error || 'Request failed.'
        });
        setBusy(false);
        return;
      }

      setNotice({ type: 'success', title: 'Invite revoked', message: 'The invite has been revoked.' });
      await loadInvites();
      setBusy(false);
    },
    [loadInvites]
  );

  const copyLink = useCallback(async () => {
    if (!latestInviteUrl) return;
    try {
      await navigator.clipboard.writeText(latestInviteUrl);
      setNotice({ type: 'success', title: 'Copied', message: 'Invite URL copied to clipboard.' });
    } catch {
      setNotice({ type: 'error', title: 'Copy failed', message: 'Could not copy invite URL.' });
    }
  }, [latestInviteUrl]);

  const sortedInvites = useMemo(() => {
    const rows = [...invites];
    rows.sort((a, b) => {
      const left = new Date(a.createdAt || 0).getTime();
      const right = new Date(b.createdAt || 0).getTime();
      return inviteSort === 'newest' ? right - left : left - right;
    });
    return rows;
  }, [inviteSort, invites]);

  const counts = useMemo(() => {
    return sortedInvites.reduce(
      (acc, invite) => {
        const status = getInviteStatus(invite, currentTime);
        acc.all += 1;
        if (status === 'pending') acc.active += 1;
        if (status === 'used') acc.accepted += 1;
        if (status !== 'pending') acc.past += 1;
        return acc;
      },
      { active: 0, accepted: 0, past: 0, all: 0 }
    );
  }, [currentTime, sortedInvites]);

  const filteredInvites = useMemo(() => {
    const query = inviteSearch.trim().toLowerCase();
    return sortedInvites.filter((invite) => {
      const status = getInviteStatus(invite, currentTime);
      if (inviteView === 'active' && status !== 'pending') return false;
      if (inviteView === 'accepted' && status !== 'used') return false;
      if (inviteView === 'past' && status === 'pending') return false;
      if (query) {
        const text = `${displayInviteName(invite)} ${invite.email} ${invite.role} ${invite.primaryChapterName} ${status}`.toLowerCase();
        if (!text.includes(query)) return false;
      }
      return true;
    });
  }, [currentTime, inviteSearch, inviteView, sortedInvites]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Invite New Member</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Create a sign-up invite and optionally send the invite email automatically.
              </p>
            </div>
            <Button variant={createOpen ? 'outline' : 'default'} onClick={() => setCreateOpen((prev) => !prev)}>
              <UserPlus className="mr-2 size-4" />
              {createOpen ? 'Hide invite form' : 'Create invite'}
            </Button>
          </div>
        </CardHeader>

        {createOpen ? (
          <CardContent className="space-y-4 border-t">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="invite-first-name">First name</Label>
                <Input
                  id="invite-first-name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="Alex"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-last-name">Last name</Label>
                <Input
                  id="invite-last-name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Rivera"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="new.user@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-orcid">ORCID iD</Label>
                <Input
                  id="invite-orcid"
                  value={orcidId}
                  onChange={(event) => setOrcidId(event.target.value)}
                  placeholder="0000-0002-1825-0097"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Role</Label>
                <Select value={role} onValueChange={(next) => setRole(next as InviteRole)}>
                  <SelectTrigger id="invite-role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User (content editing)</SelectItem>
                    <SelectItem value="admin">Admin (full access)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Users can manage content. Admins can also manage users, settings, and system configuration.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-primary-chapter">Primary chapter</Label>
                <Select value={primaryChapterSlug || undefined} onValueChange={setPrimaryChapterSlug}>
                  <SelectTrigger id="invite-primary-chapter">
                    <SelectValue placeholder="Select a chapter" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASAP_CHAPTER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This seeds the user profile and becomes the default chapter for new content they create.
                </p>
              </div>
            </div>

            <label className="flex items-start gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(event) => setSendEmail(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border"
              />
              <span>
                Send invite email automatically
                <span className="mt-1 block text-xs text-muted-foreground">
                  Disable this to create the invite without emailing. You can copy and share the invite URL manually.
                </span>
              </span>
            </label>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void createInvite()} disabled={busy}>
                <UserPlus className="mr-2 size-4" />
                Create invite
              </Button>
              <Button variant="outline" onClick={() => void loadInvites()} disabled={loading || busy}>
                <RefreshCw className="mr-2 size-4" />
                Refresh invitations
              </Button>
            </div>

            {latestInviteUrl ? (
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Latest invite URL</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <code className="break-all rounded bg-background px-2 py-1 text-xs">{latestInviteUrl}</code>
                  <Button size="sm" variant="outline" onClick={() => void copyLink()}>
                    <Copy className="mr-2 size-4" />
                    Copy
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        ) : null}
      </Card>

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

      <Card>
        <CardHeader className="space-y-4">
          <div>
            <CardTitle>Invitation History</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Review active invitations, accepted invites, and previous expired/revoked attempts.
            </p>
          </div>
          <Tabs value={inviteView} onValueChange={(value) => setInviteView(value as InviteView)}>
            <TabsList className="h-auto gap-2 rounded-none bg-transparent p-0">
              <TabsTrigger
                value="active"
                className="h-9 rounded-none border-b-2 border-b-transparent px-1 data-[state=active]:border-b-[var(--vd-ring)] data-[state=active]:bg-transparent"
              >
                Active
                <span className="ml-1.5 rounded-full bg-[var(--vd-bg)] px-1.5 py-0.5 text-[10px] font-semibold">
                  {counts.active}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="accepted"
                className="h-9 rounded-none border-b-2 border-b-transparent px-1 data-[state=active]:border-b-[var(--vd-ring)] data-[state=active]:bg-transparent"
              >
                Accepted
                <span className="ml-1.5 rounded-full bg-[var(--vd-bg)] px-1.5 py-0.5 text-[10px] font-semibold">
                  {counts.accepted}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="past"
                className="h-9 rounded-none border-b-2 border-b-transparent px-1 data-[state=active]:border-b-[var(--vd-ring)] data-[state=active]:bg-transparent"
              >
                Past
                <span className="ml-1.5 rounded-full bg-[var(--vd-bg)] px-1.5 py-0.5 text-[10px] font-semibold">
                  {counts.past}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="all"
                className="h-9 rounded-none border-b-2 border-b-transparent px-1 data-[state=active]:border-b-[var(--vd-ring)] data-[state=active]:bg-transparent"
              >
                All
                <span className="ml-1.5 rounded-full bg-[var(--vd-bg)] px-1.5 py-0.5 text-[10px] font-semibold">
                  {counts.all}
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Input
              value={inviteSearch}
              onChange={(event) => setInviteSearch(event.target.value)}
              placeholder="Search by name, email, role, chapter, status"
              className="min-w-[220px] flex-1"
            />
            <Select value={inviteSort} onValueChange={(value) => setInviteSort(value as InviteSort)}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Sort order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => void loadInvites()} disabled={loading || busy}>
              <RefreshCw className="mr-2 size-4" />
              Refresh list
            </Button>
          </div>

          {loading ? <p className="text-sm text-muted-foreground">Loading invitations...</p> : null}

          {!loading && filteredInvites.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="text-sm text-muted-foreground">
                {inviteView === 'active'
                  ? 'No pending invitations right now.'
                  : inviteView === 'accepted'
                    ? 'No accepted invitations yet.'
                    : inviteView === 'past'
                      ? 'No past invitations yet.'
                      : 'No invitations created yet.'}
              </p>
              {inviteView === 'active' ? (
                <Button className="mt-3" variant="outline" onClick={() => setCreateOpen(true)}>
                  <UserPlus className="mr-2 size-4" />
                  Create invite
                </Button>
              ) : null}
            </div>
          ) : null}

          {filteredInvites.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Invitee</th>
                    <th className="px-3 py-2 text-left font-medium">Role</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                    <th className="px-3 py-2 text-left font-medium">Created</th>
                    <th className="px-3 py-2 text-left font-medium">Expires</th>
                    <th className="px-3 py-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvites.map((invite) => {
                    const status = getInviteStatus(invite, currentTime);
                    const canRevoke = status === 'pending';
                    return (
                      <tr key={invite.id} className="border-t align-top">
                        <td className="px-3 py-3">
                          <p className="font-medium">{displayInviteName(invite)}</p>
                          <p className="text-xs text-muted-foreground">{invite.email}</p>
                          {invite.primaryChapterName ? (
                            <p className="mt-1 text-xs text-muted-foreground">Chapter: {invite.primaryChapterName}</p>
                          ) : null}
                          {invite.orcidId ? (
                            <p className="mt-1 text-xs text-muted-foreground">ORCID: {invite.orcidId}</p>
                          ) : null}
                        </td>
                        <td className="px-3 py-3">
                          <Badge variant="outline" className="capitalize">
                            {invite.role}
                          </Badge>
                        </td>
                        <td className="px-3 py-3">
                          <InviteStatusBadge status={status} />
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">{formatDate(invite.createdAt)}</td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">{formatDate(invite.expiresAt)}</td>
                        <td className="px-3 py-3 text-right">
                          {canRevoke ? (
                            <Button size="sm" variant="outline" disabled={busy} onClick={() => setInviteToRevoke(invite)}>
                              <ShieldOff className="mr-2 size-3.5" />
                              Revoke
                            </Button>
                          ) : status === 'used' ? (
                            <Button size="sm" variant="ghost" disabled>
                              <Mail className="mr-2 size-3.5" />
                              Accepted
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">No actions</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <AlertDialog
        open={Boolean(inviteToRevoke)}
        onOpenChange={(open) => {
          if (!open) setInviteToRevoke(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              Revoke the invitation for <span className="font-medium">{inviteToRevoke?.email || 'this user'}</span>? This
              will invalidate their sign-up link immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy || !inviteToRevoke}
              onClick={() => {
                if (!inviteToRevoke) return;
                void revokeInvite(inviteToRevoke.id);
                setInviteToRevoke(null);
              }}
            >
              Revoke invite
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
