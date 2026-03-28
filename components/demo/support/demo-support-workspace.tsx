'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
  createDemoSupportSeed,
  createSupportOverview,
  deriveTicketSummaries,
  formatDateTime,
  initialFeatureCreateState,
  initialProblemCreateState,
  slugify,
  SUPPORT_TICKET_CATEGORIES,
  SUPPORT_TICKET_OPEN_STATUSES,
  SUPPORT_TICKET_STATUSES,
  supportCategoryLabel,
  supportPriorityLabel,
  supportStatusIsOpen,
  supportStatusLabel,
  type SupportArticleSummary,
  type SupportDevelopmentHoursPayload,
  type SupportDocSummary,
  type SupportPriority,
  type SupportSystemStatusPayload,
  type SupportTicketStatus,
  type SupportTicketThread,
  type SupportWaitingOn,
  type SupportWorkspaceTab,
  type TicketCreateState,
  SUPPORT_WORKSPACE_TABS
} from '@/components/demo/support/demo-support.shared';
import { DemoSupportDashboard } from '@/components/demo/support/demo-support-dashboard';
import { DemoSupportNewTicketForm } from '@/components/demo/support/demo-support-new-ticket-form';
import { DemoSupportTicketDetail } from '@/components/demo/support/demo-support-ticket-detail';
import { DemoSupportTicketTable } from '@/components/demo/support/demo-support-ticket-table';
import { DemoSupportToolkit } from '@/components/demo/support/demo-support-toolkit';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const TAB_HELP: Record<SupportWorkspaceTab, string> = {
  'my-requests': 'Open tickets that still need active handling.',
  'report-problem': 'Submit a new issue or content fix request.',
  'request-feature': 'Capture new feature ideas and scoped improvements.',
  'support-tools': 'Search, docs, system status, and support knowledge tools.',
  'past-requests': 'Closed or resolved tickets and their history.'
};

type SupportTicketQueueFiltersProps = {
  statusFilter: 'all' | SupportTicketStatus;
  categoryFilter: 'all' | (typeof SUPPORT_TICKET_CATEGORIES)[number]['key'];
  waitingOnFilter: 'all' | SupportWaitingOn;
  query: string;
  onStatusFilterChange: (value: 'all' | SupportTicketStatus) => void;
  onCategoryFilterChange: (value: 'all' | (typeof SUPPORT_TICKET_CATEGORIES)[number]['key']) => void;
  onWaitingOnFilterChange: (value: 'all' | SupportWaitingOn) => void;
  onQueryChange: (value: string) => void;
};

function SupportTicketQueueFilters({
  statusFilter,
  categoryFilter,
  waitingOnFilter,
  query,
  onStatusFilterChange,
  onCategoryFilterChange,
  onWaitingOnFilterChange,
  onQueryChange
}: SupportTicketQueueFiltersProps) {
  const customerVisibleCategories = SUPPORT_TICKET_CATEGORIES.filter((item) => item.customerVisible !== false);

  return (
    <div className="grid gap-3 md:grid-cols-4">
      <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as 'all' | SupportTicketStatus)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {SUPPORT_TICKET_STATUSES.map((item) => (
            <SelectItem key={item} value={item}>
              {item.replaceAll('_', ' ')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={categoryFilter}
        onValueChange={(value) =>
          onCategoryFilterChange(value as 'all' | (typeof SUPPORT_TICKET_CATEGORIES)[number]['key'])
        }
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {customerVisibleCategories.map((item) => (
            <SelectItem key={item.key} value={item.key}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={waitingOnFilter} onValueChange={(value) => onWaitingOnFilterChange(value as 'all' | SupportWaitingOn)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All ownership</SelectItem>
          <SelectItem value="support">We are working on this</SelectItem>
          <SelectItem value="customer">Needs your response</SelectItem>
        </SelectContent>
      </Select>

      <Input placeholder="Search by reference or subject" value={query} onChange={(event) => onQueryChange(event.target.value)} />
    </div>
  );
}

function isoNow() {
  return new Date().toISOString();
}

function buildHtml(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${line}</p>`)
    .join('');
}

function messageCounterStart(threads: SupportTicketThread[]) {
  return threads.reduce((max, thread) => Math.max(max, thread.messages.length + thread.events.length + thread.ratings.length), 1) + 1;
}

export function DemoSupportWorkspace() {
  const initialSeed = useMemo(() => createDemoSupportSeed(), []);
  const [threads, setThreads] = useState(initialSeed.threads);
  const [documents, setDocuments] = useState<SupportDocSummary[]>(initialSeed.documents);
  const [articles, setArticles] = useState<SupportArticleSummary[]>(initialSeed.articles);
  const [systemStatus, setSystemStatus] = useState<SupportSystemStatusPayload>(initialSeed.systemStatus);
  const [developmentHours, setDevelopmentHours] = useState<SupportDevelopmentHoursPayload>(initialSeed.developmentHours);

  const ticketCounterRef = useRef(1049);
  const messageCounterRef = useRef(messageCounterStart(initialSeed.threads));

  const [activeTab, setActiveTab] = useState<SupportWorkspaceTab>('my-requests');
  const [selectedTicketId, setSelectedTicketId] = useState(initialSeed.threads[0]?.ticket.id ?? '');

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

  const [isCreating, setIsCreating] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const tickets = useMemo(() => deriveTicketSummaries(threads), [threads]);
  const overview = useMemo(() => createSupportOverview(tickets), [tickets]);
  const thread = useMemo(() => threads.find((item) => item.ticket.id === selectedTicketId) ?? null, [selectedTicketId, threads]);
  const currentTicket = thread?.ticket ?? null;

  const filteredTickets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return tickets.filter((ticket) => {
      if (statusGroup === 'open' && !supportStatusIsOpen(ticket.status)) return false;
      if (statusGroup === 'closed' && supportStatusIsOpen(ticket.status)) return false;
      if (statusFilter !== 'all' && ticket.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && ticket.category !== categoryFilter) return false;
      if (waitingOnFilter !== 'all' && ticket.waitingOn !== waitingOnFilter) return false;
      if (!normalizedQuery) return true;
      return [ticket.ticketRef, ticket.subject, ticket.createdByName, ticket.createdByEmail, ticket.categoryLabel, ticket.module]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [categoryFilter, query, statusFilter, statusGroup, tickets, waitingOnFilter]);

  useEffect(() => {
    if (!thread) return;
    setStatusDraft(thread.ticket.status);
    setWaitingOnDraft(thread.ticket.waitingOn);
    setStatusNote('');
    setRatingDraft(thread.ticket.satisfactionRating || 5);
    setRatingComment(thread.ticket.satisfactionComment || '');
    setReplyText('');
    setReplyAttachmentName('');
    setReplyAttachmentUrl('');
  }, [thread]);

  useEffect(() => {
    if (!filteredTickets.length) {
      if (activeTab === 'my-requests' || activeTab === 'past-requests') {
        setSelectedTicketId('');
      }
      return;
    }

    if (filteredTickets.some((ticket) => ticket.id === selectedTicketId)) return;
    setSelectedTicketId(filteredTickets[0]?.id ?? '');
  }, [activeTab, filteredTickets, selectedTicketId]);

  function switchToRequestTab(tab: 'my-requests' | 'past-requests') {
    setActiveTab(tab);
    setStatusGroup(tab === 'my-requests' ? 'open' : 'closed');
    setStatusFilter('all');
  }

  function focusTicket(ticket: { id: string; status: SupportTicketStatus }) {
    setSelectedTicketId(ticket.id);
    const isOpen = SUPPORT_TICKET_OPEN_STATUSES.includes(ticket.status as (typeof SUPPORT_TICKET_OPEN_STATUSES)[number]);
    switchToRequestTab(isOpen ? 'my-requests' : 'past-requests');
  }

  function focusTicketById(ticketId: string, status?: SupportTicketStatus) {
    setSelectedTicketId(ticketId);
    const isOpen = status ? SUPPORT_TICKET_OPEN_STATUSES.includes(status as (typeof SUPPORT_TICKET_OPEN_STATUSES)[number]) : true;
    switchToRequestTab(isOpen ? 'my-requests' : 'past-requests');
  }

  function updateThread(ticketId: string, updater: (thread: SupportTicketThread) => SupportTicketThread) {
    setThreads((current) => current.map((item) => (item.ticket.id === ticketId ? updater(item) : item)));
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
      const referenceNumber = ticketCounterRef.current++;
      const now = isoNow();
      const id = `support-ticket-${referenceNumber}`;
      const ticketRef = `HP-${referenceNumber}`;
      const initialMessage = {
        id: `support-message-${messageCounterRef.current++}`,
        ticketId: id,
        authorUserId: `${id}-requester`,
        authorEmail: 'demo@harbour-pine-demo.co.uk',
        authorName: 'Demo Customer',
        authorRole: 'admin-requester' as const,
        authorType: 'requester' as const,
        bodyHtml: buildHtml(sourceState.descriptionText.trim()),
        bodyText: sourceState.descriptionText.trim(),
        attachments: [],
        isInternal: false,
        createdAt: now,
        updatedAt: now
      };

      const nextThread: SupportTicketThread = {
        ticket: {
          id,
          ticketRef,
          createdByUserId: `${id}-requester`,
          createdByEmail: 'demo@harbour-pine-demo.co.uk',
          createdByName: 'Demo Customer',
          createdByAvatarUrl: '',
          organization: 'Harbour & Pine Demo',
          category,
          categoryLabel: supportCategoryLabel(category),
          module: sourceState.module,
          priority: sourceState.priority as SupportPriority,
          priorityLabel: supportPriorityLabel(sourceState.priority),
          requestedDate: sourceState.requestedDate || null,
          caseRefs: [],
          pageUrl: sourceState.pageUrl.trim(),
          subject: sourceState.subject.trim(),
          status: 'open',
          statusLabel: supportStatusLabel('open'),
          waitingOn: 'support',
          notes: '',
          assignedToUserId: 'vd-support',
          assignedToEmail: 'support@velvetdinosaur.com',
          assignedToName: 'Velvet Dinosaur Support',
          assignedToAvatarUrl: '/logo.webp',
          messageCount: 1,
          lastActivityAt: now,
          closedAt: null,
          satisfactionRating: null,
          satisfactionComment: '',
          createdAt: now,
          updatedAt: now,
          descriptionText: sourceState.descriptionText.trim(),
          descriptionHtml: buildHtml(sourceState.descriptionText.trim())
        },
        messages: [initialMessage],
        events: [
          {
            id: `support-event-${messageCounterRef.current++}`,
            ticketId: id,
            eventType: 'ticket_created',
            actorUserId: `${id}-requester`,
            actorEmail: 'demo@harbour-pine-demo.co.uk',
            actorName: 'Demo Customer',
            actorRole: 'admin-requester',
            fromStatus: '',
            toStatus: 'open',
            fromWaitingOn: '',
            toWaitingOn: 'support',
            message: 'Ticket created in the public demo workspace.',
            metadata: {},
            createdAt: now,
            updatedAt: now
          }
        ],
        ratings: []
      };

      setThreads((current) => [nextThread, ...current]);
      setSelectedTicketId(id);
      switchToRequestTab('my-requests');
      if (mode === 'feature') setFeatureCreateState(initialFeatureCreateState());
      else setProblemCreateState(initialProblemCreateState());
      toast.info(`Request ${ticketRef} created for this demonstration session only.`);
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
      const now = isoNow();
      const attachmentUrl = replyAttachmentUrl.trim();
      const attachmentName = replyAttachmentName.trim();
      updateThread(selectedTicketId, (current) => ({
        ...current,
        ticket: {
          ...current.ticket,
          waitingOn: 'customer',
          updatedAt: now,
          lastActivityAt: now,
          messageCount: current.messages.length + 1
        },
        messages: [
          {
            id: `support-message-${messageCounterRef.current++}`,
            ticketId: selectedTicketId,
            authorUserId: 'vd-support',
            authorEmail: 'support@velvetdinosaur.com',
            authorName: 'Velvet Dinosaur Support',
            authorRole: 'support-agent',
            authorDisplayName: 'Velvet Dinosaur Support',
            authorAvatarUrl: '/logo.webp',
            authorType: 'staff',
            bodyHtml: buildHtml(replyText.trim()),
            bodyText: replyText.trim(),
            attachments: attachmentUrl
              ? [
                  {
                    key: '',
                    name: attachmentName || 'Attachment',
                    url: attachmentUrl,
                    mime: '',
                    size: null
                  }
                ]
              : [],
            isInternal: false,
            createdAt: now,
            updatedAt: now
          },
          ...current.messages
        ],
        events: [
          {
            id: `support-event-${messageCounterRef.current++}`,
            ticketId: selectedTicketId,
            eventType: 'message_added',
            actorUserId: 'vd-support',
            actorEmail: 'support@velvetdinosaur.com',
            actorName: 'Velvet Dinosaur Support',
            actorRole: 'support-agent',
            fromStatus: current.ticket.status,
            toStatus: current.ticket.status,
            fromWaitingOn: current.ticket.waitingOn,
            toWaitingOn: 'customer',
            message: 'Reply added in the demo workspace.',
            metadata: {},
            createdAt: now,
            updatedAt: now
          },
          ...current.events
        ]
      }));
      setReplyText('');
      setReplyAttachmentName('');
      setReplyAttachmentUrl('');
      toast.info('Reply added to the demonstration conversation only.');
    } finally {
      setIsSendingReply(false);
    }
  }

  async function submitRating() {
    if (!selectedTicketId) return;
    setIsSubmittingRating(true);
    try {
      const now = isoNow();
      updateThread(selectedTicketId, (current) => {
        const nextRating = {
          id: `support-rating-${messageCounterRef.current++}`,
          ticketId: selectedTicketId,
          rating: ratingDraft,
          comment: ratingComment.trim(),
          submittedByUserId: current.ticket.createdByUserId,
          submittedAt: now,
          createdAt: now,
          updatedAt: now
        };

        return {
          ...current,
          ticket: {
            ...current.ticket,
            satisfactionRating: ratingDraft,
            satisfactionComment: ratingComment.trim(),
            updatedAt: now
          },
          ratings: [nextRating, ...current.ratings]
        };
      });
      toast.info('Rating stored for this demonstration session only.');
    } finally {
      setIsSubmittingRating(false);
    }
  }

  async function updateStatus() {
    if (!selectedTicketId) return;
    setIsUpdatingStatus(true);
    try {
      const now = isoNow();
      updateThread(selectedTicketId, (current) => {
        const nextWaitingOn = waitingOnDraft;
        const nextStatus = statusDraft;
        const note = statusNote.trim();
        const statusMessage = [
          `Status changed to ${supportStatusLabel(nextStatus)}.`,
          `Waiting on: ${nextWaitingOn === 'support' ? "We're working on this" : 'Needs your response'}.`,
          note ? `Note: ${note}` : ''
        ]
          .filter(Boolean)
          .join(' ');

        return {
          ...current,
          ticket: {
            ...current.ticket,
            status: nextStatus,
            statusLabel: supportStatusLabel(nextStatus),
            waitingOn: nextWaitingOn,
            notes: note || current.ticket.notes,
            closedAt: supportStatusIsOpen(nextStatus) ? null : now,
            updatedAt: now,
            lastActivityAt: now
          },
          messages: [
            {
              id: `support-message-${messageCounterRef.current++}`,
              ticketId: selectedTicketId,
              authorUserId: 'vd-support',
              authorEmail: 'support@velvetdinosaur.com',
              authorName: 'Velvet Dinosaur Support',
              authorRole: 'system',
              authorType: 'automation',
              bodyHtml: buildHtml(statusMessage),
              bodyText: statusMessage,
              attachments: [],
              isInternal: false,
              createdAt: now,
              updatedAt: now
            },
            ...current.messages
          ],
          events: [
            {
              id: `support-event-${messageCounterRef.current++}`,
              ticketId: selectedTicketId,
              eventType: supportStatusIsOpen(nextStatus) ? 'status_changed' : 'closed',
              actorUserId: 'vd-support',
              actorEmail: 'support@velvetdinosaur.com',
              actorName: 'Velvet Dinosaur Support',
              actorRole: 'support-agent',
              fromStatus: current.ticket.status,
              toStatus: nextStatus,
              fromWaitingOn: current.ticket.waitingOn,
              toWaitingOn: nextWaitingOn,
              message: statusMessage,
              metadata: {},
              createdAt: now,
              updatedAt: now
            },
            ...current.events
          ]
        };
      });
      setStatusNote('');
      toast.info('Status updated for this demonstration session only.');
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  function createDocument(input: { title: string; description: string; module: string; category: string; linkType: 'view' | 'download'; url: string }) {
    const now = isoNow();
    const id = slugify(input.title);
    setDocuments((current) => [
      {
        id,
        title: input.title,
        description: input.description,
        module: input.module,
        category: input.category,
        tags: [],
        linkType: input.linkType,
        url: input.url,
        searchable: true,
        publishedAt: now,
        createdAt: now,
        updatedAt: now
      },
      ...current
    ]);
  }

  function createArticle(input: { type: 'knowledge' | 'announcement' | 'feature'; title: string; summary: string; bodyText: string; category: string; module: string }) {
    const now = isoNow();
    const slug = slugify(input.title);
    setArticles((current) => [
      {
        id: `${input.type}-${slug}`,
        title: input.title,
        slug,
        type: input.type,
        category: input.category,
        module: input.module,
        tags: [],
        summary: input.summary,
        bodyText: input.bodyText,
        searchable: true,
        publishedAt: now,
        createdAt: now,
        updatedAt: now
      },
      ...current
    ]);
  }

  function refreshSystemStatus() {
    const now = isoNow();
    setSystemStatus((current) => ({
      ...current,
      fetchedAt: now,
      checks: current.checks.map((item) => ({ ...item, updatedAt: now }))
    }));
    toast.info('The seeded system status board has been refreshed.');
  }

  function refreshDevelopmentHours() {
    const now = isoNow();
    setDevelopmentHours((current) => ({
      ...current,
      fetchedAt: now,
      items: current.items.map((item) => ({ ...item, updatedAt: now }))
    }));
    toast.info('The seeded development schedule has been refreshed.');
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
            <DemoSupportTicketTable
              tickets={filteredTickets}
              selectedTicketId={selectedTicketId}
              isLoading={false}
              onSelectTicket={setSelectedTicketId}
            />
          </CardContent>
        </Card>

        <DemoSupportTicketDetail
          thread={thread}
          isLoadingThread={false}
          canManageStatus
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
          <h1 className="text-3xl font-semibold text-foreground">Support Portal</h1>
          <p className="text-sm text-muted-foreground">
            Report website issues, request improvements, and track progress in one place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={() => {
                  refreshSystemStatus();
                  refreshDevelopmentHours();
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reload the seeded queue, metrics, and support toolkit snapshots.</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={() => toast.info('Queue exports are disabled because this is a public demonstration workspace.')}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Queue
              </Button>
            </TooltipTrigger>
            <TooltipContent>Exports are intentionally disabled in the public sandbox.</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={() =>
                  toast.info(
                    currentTicket
                      ? `Evidence export for ${currentTicket.ticketRef} is disabled because this is a public demonstration workspace.`
                      : 'Select a ticket first if you want to inspect the demonstration evidence trail.'
                  )
                }
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export Evidence
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {currentTicket
                ? 'Evidence export is intentionally disabled in the public sandbox.'
                : 'Select a ticket first, then inspect its messages, status notes, and rating history inside the demo.'}
            </TooltipContent>
          </Tooltip>
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
            <Tooltip key={tab.value}>
              <TooltipTrigger asChild>
                <TabsTrigger value={tab.value} className="border border-border/70 bg-card px-3 py-1.5">
                  {tab.label}
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>{TAB_HELP[tab.value]}</TooltipContent>
            </Tooltip>
          ))}
        </TabsList>

        <TabsContent value="my-requests" className="space-y-6">
          <DemoSupportDashboard overview={overview} onSelectRecentTicket={focusTicket} />
          {renderTicketQueue('Open Requests', 'Filter and manage requests that are still in progress.')}
        </TabsContent>

        <TabsContent value="report-problem" className="space-y-6">
          <DemoSupportNewTicketForm
            mode="problem"
            createState={problemCreateState}
            isCreating={isCreating}
            onCreateStateChange={setProblemCreateState}
            onSubmit={() => void createTicket('problem')}
          />
        </TabsContent>

        <TabsContent value="request-feature" className="space-y-6">
          <DemoSupportNewTicketForm
            mode="feature"
            createState={featureCreateState}
            isCreating={isCreating}
            onCreateStateChange={setFeatureCreateState}
            onSubmit={() => void createTicket('feature')}
          />
        </TabsContent>

        <TabsContent value="support-tools" className="space-y-6">
          <DemoSupportToolkit
            tickets={tickets}
            documents={documents}
            articles={articles}
            systemStatus={systemStatus}
            developmentHours={developmentHours}
            onSelectTicket={focusTicketById}
            onCreateDocument={createDocument}
            onCreateArticle={createArticle}
            onRefreshSystemStatus={refreshSystemStatus}
            onRefreshDevelopmentHours={refreshDevelopmentHours}
          />
        </TabsContent>

        <TabsContent value="past-requests" className="space-y-6">
          {renderTicketQueue('Past Requests', 'Review closed requests, resolved fixes, and historic support notes.')}
        </TabsContent>
      </Tabs>

      <div className="rounded-xl border border-dashed border-border/70 bg-muted/15 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Demonstration note</p>
        <p className="mt-1">
          Every request, reply, document, article, and status change in this portal is fictional and resets when you leave or refresh the page.
        </p>
        <p className="mt-2">Current queue snapshot updated: {formatDateTime(overview.recentTickets[0]?.lastActivityAt ?? null)}</p>
      </div>
    </main>
  );
}
