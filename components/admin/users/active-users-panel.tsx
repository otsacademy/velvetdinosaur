'use client';

import { useMemo, useState } from 'react';
import { ASAP_CHAPTER_OPTIONS } from '@/lib/chapters';
import { Clock3, KeyRound, Loader2, RefreshCw, ShieldCheck, Users, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { ActiveUserRow, ActiveUsersSummary, InviteRole } from '@/components/admin/users/types';
import { formatDate } from '@/components/admin/users/types';

type Props = {
  users: ActiveUserRow[];
  summary: ActiveUsersSummary | null;
  loading: boolean;
  pendingActionKey: string | null;
  onRefresh: () => Promise<void>;
  onUpdateRole: (userId: string, role: InviteRole) => Promise<void>;
  onSendPasswordReset: (userId: string) => Promise<void>;
  onRemoveUser: (userId: string) => Promise<void>;
};

type RoleFilter = 'all' | InviteRole;
type ChapterFilter = 'all' | string;

export function ActiveUsersPanel({
  users,
  summary,
  loading,
  pendingActionKey,
  onRefresh,
  onUpdateRole,
  onSendPasswordReset,
  onRemoveUser
}: Props) {
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [chapterFilter, setChapterFilter] = useState<ChapterFilter>('all');
  const [userToRemove, setUserToRemove] = useState<ActiveUserRow | null>(null);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return users.filter((user) => {
      if (roleFilter !== 'all' && user.role !== roleFilter) return false;
      if (chapterFilter !== 'all' && user.primaryChapterSlug !== chapterFilter) return false;
      if (!normalizedQuery) return true;
      const haystack = `${user.name} ${user.email} ${user.orcidId} ${user.primaryChapterName} ${user.chapterSlugs.join(' ')}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [chapterFilter, query, roleFilter, users]);

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Active Users</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage current team access, role assignment, and account metadata.
            </p>
          </div>
          <Button variant="outline" onClick={() => void onRefresh()} disabled={loading}>
            <RefreshCw className="mr-2 size-4" />
            Refresh users
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-lg border bg-background/50 p-3">
            <p className="text-xs text-muted-foreground">Total users</p>
            <p className="mt-1 text-xl font-semibold">{summary?.total ?? users.length}</p>
          </div>
          <div className="rounded-lg border bg-background/50 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5" />
              Admins
            </div>
            <p className="mt-1 text-xl font-semibold">{summary?.admins ?? users.filter((row) => row.role === 'admin').length}</p>
          </div>
          <div className="rounded-lg border bg-background/50 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="size-3.5" />
              Users
            </div>
            <p className="mt-1 text-xl font-semibold">{summary?.users ?? users.filter((row) => row.role === 'user').length}</p>
          </div>
          <div className="rounded-lg border bg-background/50 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock3 className="size-3.5" />
              Active in 30d
            </div>
            <p className="mt-1 text-xl font-semibold">{summary?.recentlyActive ?? 0}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search users by name, email, ORCID, or chapter"
            className="min-w-[240px] flex-1"
          />
          <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as RoleFilter)}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Role filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="user">Users</SelectItem>
            </SelectContent>
          </Select>
          <Select value={chapterFilter} onValueChange={setChapterFilter}>
            <SelectTrigger className="w-[190px]">
              <SelectValue placeholder="Chapter filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All chapters</SelectItem>
              {ASAP_CHAPTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? <p className="text-sm text-muted-foreground">Loading users...</p> : null}
        {!loading && filteredUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No users match your current filters.</p>
        ) : null}

        {filteredUsers.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">User</th>
                  <th className="px-3 py-2 text-left font-medium">Role</th>
                  <th className="px-3 py-2 text-left font-medium">Chapter</th>
                  <th className="px-3 py-2 text-left font-medium">ORCID</th>
                  <th className="px-3 py-2 text-left font-medium">Last login</th>
                  <th className="px-3 py-2 text-left font-medium">Created</th>
                  <th className="px-3 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const rowBusy = Boolean(pendingActionKey?.startsWith(`${user.id}:`));
                  const roleBusy = pendingActionKey === `${user.id}:role`;
                  const resetBusy = pendingActionKey === `${user.id}:password-reset`;
                  const removeBusy = pendingActionKey === `${user.id}:remove`;
                  return (
                    <tr key={user.id} className="border-t align-top">
                      <td className="px-3 py-3">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </td>
                      <td className="px-3 py-3">
                        <Select
                          value={user.role}
                          onValueChange={(value) => {
                            if (value === user.role) return;
                            void onUpdateRole(user.id, value as InviteRole);
                          }}
                        >
                          <SelectTrigger className="w-[140px]" disabled={rowBusy}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">user</SelectItem>
                            <SelectItem value="admin">admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <Badge variant="outline" className="mt-2 text-[10px] uppercase">
                          {roleBusy ? 'saving...' : user.role}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">
                        {user.primaryChapterName ? (
                          <>
                            <p>{user.primaryChapterName}</p>
                            {user.chapterSlugs.length > 1 ? (
                              <p className="mt-1 text-[11px] text-muted-foreground/80">+{user.chapterSlugs.length - 1} more affiliation(s)</p>
                            ) : null}
                          </>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">
                        {user.orcidId ? <code>{user.orcidId}</code> : '-'}
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">{formatDate(user.lastLoginAt)}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">{formatDate(user.createdAt)}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={rowBusy}
                                onClick={() => void onSendPasswordReset(user.id)}
                              >
                                {resetBusy ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
                                <span className="sr-only">Send password reset</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Send password reset code</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                disabled={rowBusy}
                                onClick={() => setUserToRemove(user)}
                              >
                                {removeBusy ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
                                <span className="sr-only">Remove user</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Remove user</TooltipContent>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </CardContent>

      <AlertDialog
        open={Boolean(userToRemove)}
        onOpenChange={(open) => {
          if (!open) setUserToRemove(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you would like to delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes <span className="font-medium">{userToRemove?.name || userToRemove?.email || 'this user'}</span>
              {' '}from website access immediately. Existing news articles, web pages, and events remain preserved under
              their authorship.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(userToRemove && pendingActionKey === `${userToRemove.id}:remove`)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={!userToRemove || Boolean(userToRemove && pendingActionKey === `${userToRemove.id}:remove`)}
              onClick={() => {
                if (!userToRemove) return;
                void onRemoveUser(userToRemove.id);
                setUserToRemove(null);
              }}
            >
              Delete user
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
