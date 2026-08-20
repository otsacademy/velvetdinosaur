'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { SUPPORT_TICKET_CATEGORIES, SUPPORT_TICKET_OPEN_STATUSES } from '@/lib/support/constants';
import {
  initialTicketCreateState,
  readJson,
  type SupportOverview,
  type SupportTicketStatus,
  type SupportTicketSummary,
  type SupportTicketThread,
  type SupportWaitingOn,
  type TicketCreateState,
  EMPTY_OVERVIEW
} from '@/components/edit/support/support-workspace.shared';
import { SupportTicketDetail } from '@/components/edit/support/support-ticket-detail';
import { SupportDashboard } from '@/components/edit/support/support-dashboard';
import { SupportNewTicketForm } from '@/components/edit/support/support-new-ticket-form';
import { SupportTicketTable } from '@/components/edit/support/support-ticket-table';
import {
  SUPPORT_WORKSPACE_TABS,
  SupportTicketQueueFilters,
  type SupportWorkspaceTab
} from '@/components/edit/support/support-workspace-ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function initialProblemCreateState(): TicketCreateState {
  return {
    ...initialTicketCreateState(),
    category: 'technical_issue',
    priority: '3-medium'
  };
}

function initialFeatureCreateState(): TicketCreateState {
  return {
    ...initialTicketCreateState(),
    category: 'feature_request',
    priority: '5-standard'
  };
}

export function SupportWorkspace({
  canManageStatus = false,
  initialTicketId = ''
}: {
  canManageStatus?: boolean;
  initialTicketId?: string;
}) {
  const deepLinkedTicketId = clean(initialTicketId);
  const [activeTab, setActiveTab] = useState<SupportWorkspaceTab>('my-requests');
  const [overview, setOverview] = useState<SupportOverview>(EMPTY_OVERVIEW);
  const [tickets, setTickets] = useState<SupportTicketSummary[]>([]);
  const [thread, setThread] = useState<SupportTicketThread | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState(deepLinkedTicketId);

  const [statusGroup, setStatusGroup] = useState<'all' | 'open' | 'closed'>('open');
  const [statusFilter, setStatusFilter] = useState<'all' | SupportTicketStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | (typeof SUPPORT_TICKET_CATEGORIES)[number]['key']>('all');
  const [waitingOnFilter, setWaitingOnFilter] = useState<'all' | SupportWaitingOn>('all');
  const [query, setQuery] = useState('');

  const [problemCreateState, setProblemCreateState] = useState<TicketCreateState>(initialProblemCreateState());
  const [featureCreateState, setFeatureCreateState] = useState<TicketCreateState>(initialFeatureCreateState());
  const [replyText, setReplyText] = useState('');
  const [replyAttachmentName, setReplyAttachmentName] = useState('');
  const [replyAttachmentUrl, setReplyAttachmentUrl] = useState('');
  const [statusDraft, setStatusDraft] = useState<SupportTicketStatus>('open');
  const [waitingOnDraft, setWaitingOnDraft] = useState<SupportWaitingOn>('support');
  const [statusNote, setStatusNote] = useState('');
  const [ratingDraft, setRatingDraft] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  const [isLoadingOverview, setIsLoadingOverview] = useState(true);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const loadOverview = useCallback(async () => {
    setIsLoadingOverview(true);
    try {
      const response = await fetch('/api/admin/support/overview', { cache: 'no-store', credentials: 'include' });
      const payload = (await readJson(response)) as Partial<SupportOverview> & { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Unable to load support overview');
      setOverview({
        totals: {
          total: Number(payload.totals?.total || 0),
          requiringOurInput: Number(payload.totals?.requiringOurInput || 0),
          requiringYourInput: Number(payload.totals?.requiringYourInput || 0),
          open: Number(payload.totals?.open || 0),
          closed: Number(payload.totals?.closed || 0)
        },
        monthly: Array.isArray(payload.monthly) ? payload.monthly : [],
        categories: Array.isArray(payload.categories) ? payload.categories : [],
        recentTickets: Array.isArray(payload.recentTickets) ? payload.recentTickets : []
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load support overview');
    } finally {
      setIsLoadingOverview(false);
    }
  }, []);

  const loadTickets = useCallback(async () => {
    setIsLoadingTickets(true);
    try {
      const params = new URLSearchParams();
      params.set('statusGroup', statusGroup);
      params.set('status', statusFilter);
      params.set('category', categoryFilter);
      params.set('waitingOn', waitingOnFilter);
      if (query.trim()) params.set('q', query.trim());
      params.set('limit', '220');
      const response = await fetch(`/api/admin/support/tickets?${params.toString()}`, {
        cache: 'no-store',
        credentials: 'include'
      });
      const payload = (await readJson(response)) as { items?: SupportTicketSummary[]; error?: string };
      if (!response.ok) throw new Error(payload.error || 'Unable to load tickets');
      const nextItems = Array.isArray(payload.items) ? payload.items : [];
      setTickets(nextItems);
      if (selectedTicketId && !nextItems.some((item) => item.id === selectedTicketId)) {
        if (!deepLinkedTicketId || selectedTicketId !== deepLinkedTicketId) {
          setSelectedTicketId('');
          setThread(null);
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load tickets');
    } finally {
      setIsLoadingTickets(false);
    }
  }, [categoryFilter, deepLinkedTicketId, query, selectedTicketId, statusFilter, statusGroup, waitingOnFilter]);

  const loadTicketThread = useCallback(async (ticketId: string) => {
    if (!ticketId) return;
    setIsLoadingThread(true);
    try {
      const response = await fetch(`/api/admin/support/tickets/${encodeURIComponent(ticketId)}`, {
        cache: 'no-store',
        credentials: 'include'
      });
      const payload = (await readJson(response)) as SupportTicketThread & { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Unable to load ticket details');
      setThread(payload);
      setStatusDraft(payload.ticket.status);
      setWaitingOnDraft(payload.ticket.waitingOn);
      setStatusNote('');
      setRatingDraft(payload.ticket.satisfactionRating || 5);
      setRatingComment(payload.ticket.satisfactionComment || '');
      setReplyText('');
      setReplyAttachmentName('');
      setReplyAttachmentUrl('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load ticket details');
    } finally {
      setIsLoadingThread(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadTickets();
    }, 220);
    return () => window.clearTimeout(timeout);
  }, [loadTickets]);

  useEffect(() => {
    if (!selectedTicketId) return;
    void loadTicketThread(selectedTicketId);
  }, [loadTicketThread, selectedTicketId]);

  useEffect(() => {
    if (!deepLinkedTicketId) return;
    setSelectedTicketId(deepLinkedTicketId);
    setActiveTab('my-requests');
    setStatusGroup('all');
    setStatusFilter('all');
  }, [deepLinkedTicketId]);

  function switchToRequestTab(tab: 'my-requests' | 'past-requests') {
    setActiveTab(tab);
    setStatusGroup(tab === 'my-requests' ? 'open' : 'closed');
    setStatusFilter('all');
  }

  function focusTicket(ticket: SupportTicketSummary) {
    setSelectedTicketId(ticket.id);
    const isOpen = SUPPORT_TICKET_OPEN_STATUSES.includes(ticket.status as (typeof SUPPORT_TICKET_OPEN_STATUSES)[number]);
    switchToRequestTab(isOpen ? 'my-requests' : 'past-requests');
  }

  async function createTicket(mode: 'problem' | 'feature') {
    const sourceState = mode === 'feature' ? featureCreateState : problemCreateState;
    const category = mode === 'feature' ? 'feature_request' : sourceState.category;
    if (!sourceState.subject.trim() || !sourceState.descriptionText.trim()) {
      toast.error('Subject and request details are required.');
      return;
    }
    setIsCreating(true);
    try {
      const response = await fetch('/api/admin/support/tickets', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          subject: sourceState.subject,
          category,
          module: sourceState.module,
          priority: sourceState.priority,
          requestedDate: sourceState.requestedDate || undefined,
          pageUrl: sourceState.pageUrl,
          descriptionText: sourceState.descriptionText
        })
      });
      const payload = (await readJson(response)) as { item?: SupportTicketSummary; error?: string };
      if (!response.ok || !payload.item) throw new Error(payload.error || 'Unable to create ticket');

      if (mode === 'feature') setFeatureCreateState(initialFeatureCreateState());
      else setProblemCreateState(initialProblemCreateState());

      setSelectedTicketId(payload.item.id);
      switchToRequestTab('my-requests');
      await Promise.all([loadOverview(), loadTickets()]);
      toast.success(`Request ${payload.item.ticketRef} created.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create ticket');
    } finally {
      setIsCreating(false);
    }
  }

  async function sendReply() {
    if (!selectedTicketId || !replyText.trim()) {
      toast.error('Write a reply before sending.');
      return;
    }
    setIsSendingReply(true);
    try {
      const attachmentUrl = replyAttachmentUrl.trim();
      const attachmentName = replyAttachmentName.trim();
      const response = await fetch(`/api/admin/support/tickets/${encodeURIComponent(selectedTicketId)}/messages`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          bodyText: replyText,
          attachments: attachmentUrl
            ? [
                {
                  key: '',
                  name: attachmentName,
                  url: attachmentUrl,
                  mime: '',
                  size: null
                }
              ]
            : undefined
        })
      });
      const payload = (await readJson(response)) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Unable to send reply');
      setReplyText('');
      setReplyAttachmentName('');
      setReplyAttachmentUrl('');
      await Promise.all([loadTickets(), loadTicketThread(selectedTicketId), loadOverview()]);
      toast.success('Reply sent.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to send reply');
    } finally {
      setIsSendingReply(false);
    }
  }

  async function submitRating() {
    if (!selectedTicketId) return;
    setIsSubmittingRating(true);
    try {
      const response = await fetch(`/api/admin/support/tickets/${encodeURIComponent(selectedTicketId)}/rating`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          rating: ratingDraft,
          comment: ratingComment
        })
      });
      const payload = (await readJson(response)) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Unable to submit rating');
      await Promise.all([loadTickets(), loadTicketThread(selectedTicketId), loadOverview()]);
      toast.success('Rating submitted.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to submit rating');
    } finally {
      setIsSubmittingRating(false);
    }
  }

  async function updateStatus() {
    if (!selectedTicketId) return;
    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/admin/support/tickets/${encodeURIComponent(selectedTicketId)}/status`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status: statusDraft,
          waitingOn: waitingOnDraft,
          note: statusNote
        })
      });
      const payload = (await readJson(response)) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Unable to update status');
      await Promise.all([loadTickets(), loadTicketThread(selectedTicketId), loadOverview()]);
      toast.success('Status updated.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  function renderTicketQueue(label: string, description: string) {
    return (
      <section className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{label}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SupportTicketQueueFilters
              statusFilter={statusFilter}
              categoryFilter={categoryFilter}
              waitingOnFilter={waitingOnFilter}
              query={query}
              onStatusFilterChange={setStatusFilter}
              onCategoryFilterChange={setCategoryFilter}
              onWaitingOnFilterChange={setWaitingOnFilter}
              onQueryChange={setQuery}
            />
            <SupportTicketTable
              tickets={tickets}
              selectedTicketId={selectedTicketId}
              isLoading={isLoadingTickets}
              onSelectTicket={setSelectedTicketId}
            />
          </CardContent>
        </Card>

        <SupportTicketDetail
          thread={thread}
          isLoadingThread={isLoadingThread}
          canManageStatus={canManageStatus}
          statusDraft={statusDraft}
          waitingOnDraft={waitingOnDraft}
          statusNote={statusNote}
          replyText={replyText}
          replyAttachmentName={replyAttachmentName}
          replyAttachmentUrl={replyAttachmentUrl}
          ratingDraft={ratingDraft}
          ratingComment={ratingComment}
          canSubmitRating={Boolean(thread && (thread.ticket.status === 'resolved' || thread.ticket.status === 'closed'))}
          isUpdatingStatus={isUpdatingStatus}
          isSendingReply={isSendingReply}
          isSubmittingRating={isSubmittingRating}
          onStatusDraftChange={setStatusDraft}
          onWaitingOnDraftChange={setWaitingOnDraft}
          onStatusNoteChange={setStatusNote}
          onReplyTextChange={setReplyText}
          onReplyAttachmentNameChange={setReplyAttachmentName}
          onReplyAttachmentUrlChange={setReplyAttachmentUrl}
          onRatingDraftChange={setRatingDraft}
          onRatingCommentChange={setRatingComment}
          onUpdateStatus={() => void updateStatus()}
          onSendReply={() => void sendReply()}
          onSubmitRating={() => void submitRating()}
        />
      </section>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1400px] space-y-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Customer Portal</h1>
          <p className="text-sm text-muted-foreground">
            Report website issues, request improvements, and track progress in one place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => void Promise.all([loadOverview(), loadTickets()])}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          const nextTab = value as SupportWorkspaceTab;
          if (nextTab === 'my-requests') switchToRequestTab('my-requests');
          else if (nextTab === 'past-requests') switchToRequestTab('past-requests');
          else setActiveTab(nextTab);
        }}
        className="space-y-6"
      >
        <TabsList className="h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
          {SUPPORT_WORKSPACE_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="border border-border/70 bg-card px-3 py-1.5">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="my-requests" className="space-y-6">
          <SupportDashboard overview={overview} onSelectRecentTicket={focusTicket} />
          {renderTicketQueue('Open Requests', 'Filter and manage requests that are still in progress.')}
        </TabsContent>

        <TabsContent value="report-problem" className="space-y-6">
          <SupportNewTicketForm
            mode="problem"
            createState={problemCreateState}
            isCreating={isCreating}
            onCreateStateChange={setProblemCreateState}
            onSubmit={() => void createTicket('problem')}
          />
        </TabsContent>

        <TabsContent value="request-feature" className="space-y-6">
          <SupportNewTicketForm
            mode="feature"
            createState={featureCreateState}
            isCreating={isCreating}
            onCreateStateChange={setFeatureCreateState}
            onSubmit={() => void createTicket('feature')}
          />
        </TabsContent>

        <TabsContent value="past-requests" className="space-y-6">
          {renderTicketQueue('Past Requests', 'Review completed requests and conversation history.')}
        </TabsContent>
      </Tabs>

      {isLoadingOverview ? <p className="text-xs text-muted-foreground">Refreshing overview metrics...</p> : null}
    </main>
  );
}
