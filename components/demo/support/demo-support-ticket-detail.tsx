'use client';

import { useEffect, useRef } from 'react';
import { Bot, Loader2, Paperclip, Send, Star } from 'lucide-react';
import { SUPPORT_TICKET_STATUSES, SUPPORT_WAITING_ON, supportWaitingOnLabel } from '@/components/demo/support/demo-support.shared';
import {
  formatDateTime,
  type SupportTicketStatus,
  type SupportTicketThread,
  type SupportWaitingOn
} from '@/components/demo/support/demo-support.shared';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { DemoHelpTooltip } from '@/components/demo/demo-help-tooltip';
import {
  formatFileSize,
  initials,
  messageTone,
  priorityBadgeClass,
  ratingLabel,
  resolveMessageAvatar,
  resolveMessageName,
  resolveMessageType,
  statusBadgeClass,
  statusDescription,
  waitingOnBadgeClass
} from '@/components/demo/support/demo-support-ticket-detail.helpers';

export function DemoSupportTicketDetail({
  thread,
  isLoadingThread,
  canManageStatus,
  statusDraft,
  waitingOnDraft,
  statusNote,
  replyText,
  replyAttachmentName,
  replyAttachmentUrl,
  ratingDraft,
  ratingComment,
  canSubmitRating,
  isUpdatingStatus,
  isSendingReply,
  isSubmittingRating,
  onStatusDraftChange,
  onWaitingOnDraftChange,
  onStatusNoteChange,
  onReplyTextChange,
  onReplyAttachmentNameChange,
  onReplyAttachmentUrlChange,
  onRatingDraftChange,
  onRatingCommentChange,
  onUpdateStatus,
  onSendReply,
  onSubmitRating
}: {
  thread: SupportTicketThread | null;
  isLoadingThread: boolean;
  canManageStatus: boolean;
  statusDraft: SupportTicketStatus;
  waitingOnDraft: SupportWaitingOn;
  statusNote: string;
  replyText: string;
  replyAttachmentName: string;
  replyAttachmentUrl: string;
  ratingDraft: number;
  ratingComment: string;
  canSubmitRating: boolean;
  isUpdatingStatus: boolean;
  isSendingReply: boolean;
  isSubmittingRating: boolean;
  onStatusDraftChange: (value: SupportTicketStatus) => void;
  onWaitingOnDraftChange: (value: SupportWaitingOn) => void;
  onStatusNoteChange: (value: string) => void;
  onReplyTextChange: (value: string) => void;
  onReplyAttachmentNameChange: (value: string) => void;
  onReplyAttachmentUrlChange: (value: string) => void;
  onRatingDraftChange: (value: number) => void;
  onRatingCommentChange: (value: string) => void;
  onUpdateStatus: () => void;
  onSendReply: () => void;
  onSubmitRating: () => void;
}) {
  const replyRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = replyRef.current;
    if (!el) return;
    el.style.height = '0px';
    const nextHeight = Math.min(Math.max(140, el.scrollHeight), 380);
    el.style.height = `${nextHeight}px`;
  }, [replyText]);

  const replyLength = replyText.length;

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>Request Detail</CardTitle>
        <CardDescription>Conversation, metadata, and status management for the selected request.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {isLoadingThread ? (
          <div className="py-8 text-center text-muted-foreground">
            <Loader2 className="mx-auto mb-2 h-4 w-4 animate-spin" />
            Loading request...
          </div>
        ) : !thread ? (
          <p className="text-sm text-muted-foreground">Select a request from the list to view details.</p>
        ) : (
          <>
            <Card className="border-border/70 bg-muted/20">
              <CardContent className="space-y-4 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Reference</p>
                    <p className="text-base font-semibold">{thread.ticket.ticketRef}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={priorityBadgeClass(thread.ticket.priority)}>{thread.ticket.priorityLabel}</Badge>
                    <div className="space-y-1">
                      <Badge className={statusBadgeClass(thread.ticket.status)}>{thread.ticket.statusLabel}</Badge>
                      <p className="max-w-52 text-[11px] text-muted-foreground">{statusDescription(thread.ticket.status)}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Requester</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Avatar className="h-8 w-8 border border-border/70">
                        {thread.ticket.createdByAvatarUrl ? (
                          <AvatarImage
                            src={thread.ticket.createdByAvatarUrl}
                            alt={thread.ticket.createdByName || thread.ticket.createdByEmail || 'Requester'}
                            className="object-cover"
                          />
                        ) : null}
                        <AvatarFallback className="text-xs font-semibold">
                          {initials(thread.ticket.createdByName || thread.ticket.createdByEmail || 'Customer')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="line-clamp-1 text-sm font-medium">
                          {thread.ticket.createdByName || thread.ticket.createdByEmail || 'Customer'}
                        </p>
                        <p className="line-clamp-1 text-xs text-muted-foreground">{thread.ticket.createdByEmail || 'No email'}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Category</p>
                    <p className="mt-1 font-medium">{thread.ticket.categoryLabel}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Waiting On</p>
                    <div className="mt-1">
                      <Badge className={waitingOnBadgeClass(thread.ticket.waitingOn)}>
                        {supportWaitingOnLabel(thread.ticket.waitingOn)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Last Activity</p>
                    <p className="mt-1 font-medium">{formatDateTime(thread.ticket.lastActivityAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Website Area</p>
                    <p className="mt-1 font-medium">{thread.ticket.module || 'Other / not specified'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Customer Label</p>
                    <p className="mt-1 font-medium">{thread.ticket.organization || 'Website'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Initial Request</p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{thread.ticket.descriptionText || 'No description provided.'}</p>
            </div>

            {canManageStatus ? (
              <>
                <div className="grid gap-3 md:grid-cols-3">
                  <Select value={statusDraft} onValueChange={(value) => onStatusDraftChange(value as SupportTicketStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORT_TICKET_STATUSES.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item.replaceAll('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={waitingOnDraft} onValueChange={(value) => onWaitingOnDraftChange(value as SupportWaitingOn)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORT_WAITING_ON.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item === 'support' ? "We're working on this" : 'Needs your response'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <DemoHelpTooltip content="Apply the new ticket status and waiting state to this demo thread so the support flow updates immediately.">
                    <Button onClick={onUpdateStatus} disabled={isUpdatingStatus}>
                      {isUpdatingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Update Status
                    </Button>
                  </DemoHelpTooltip>
                </div>
                <Input placeholder="Optional status note" value={statusNote} onChange={(event) => onStatusNoteChange(event.target.value)} />
              </>
            ) : null}

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Conversation</h3>
                <p className="text-xs text-muted-foreground">
                  {thread.messages.length} {thread.messages.length === 1 ? 'message' : 'messages'}
                </p>
              </div>

              <div className="max-h-[430px] space-y-3 overflow-y-auto rounded-xl border border-border/70 bg-card p-4">
                {thread.messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No messages yet.</p>
                ) : (
                  thread.messages.map((message) => {
                    const type = resolveMessageType(message);
                    const tone = messageTone(type);
                    const name = resolveMessageName(message, type);
                    const avatar = resolveMessageAvatar(message, type);

                    if (type === 'automation') {
                      return (
                        <div key={message.id} className="flex justify-center">
                          <div className="max-w-[86%] text-center text-[11px]">
                            <div className={`${tone.bubble} inline-flex items-center gap-1.5`}>
                              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border/70 bg-background/80">
                                <Bot className="h-2.5 w-2.5" />
                              </span>
                              <span className="whitespace-pre-wrap text-left">{message.bodyText || 'System update'}</span>
                              <span className="font-normal text-muted-foreground">{formatDateTime(message.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={message.id} className={`flex ${type === 'staff' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex max-w-[86%] gap-3 ${type === 'staff' ? 'flex-row-reverse' : 'flex-row'}`}>
                          <Avatar className="h-9 w-9 border border-border/70">
                            {avatar ? <AvatarImage src={avatar} alt={name} className="object-cover" /> : null}
                            <AvatarFallback className="text-[11px] font-semibold">{initials(name)}</AvatarFallback>
                          </Avatar>

                          <div className={`space-y-1 ${type === 'staff' ? 'items-end text-right' : 'items-start text-left'}`}>
                            <div className={`flex flex-wrap items-center gap-2 ${type === 'staff' ? 'justify-end' : 'justify-start'}`}>
                              <span className="text-xs font-medium text-foreground">{name}</span>
                              <Badge className={tone.badge}>{tone.label}</Badge>
                              <span className="text-xs text-muted-foreground">{formatDateTime(message.createdAt)}</span>
                            </div>

                            <div className={`p-3 text-sm ${tone.bubble}`}>
                              <p className="whitespace-pre-wrap">{message.bodyText || '—'}</p>

                              {message.attachments.length > 0 ? (
                                <div className="mt-3 space-y-1 rounded-md border border-border/70 bg-background/70 p-2 text-left">
                                  <p className="text-[11px] font-medium text-muted-foreground">Attachments</p>
                                  {message.attachments.map((attachment, index) => (
                                    <a
                                      key={`${message.id}-${attachment.url}-${index}`}
                                      href={attachment.url}
                                      className="block text-sm text-primary underline-offset-2 hover:underline"
                                    >
                                      {attachment.name || attachment.url}
                                      {formatFileSize(attachment.size) ? ` (${formatFileSize(attachment.size)})` : ''}
                                    </a>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <Card className="border-border/70 bg-muted/20">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="support-reply">Reply</Label>
                    <span className={`text-xs ${replyLength > 118000 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {replyLength.toLocaleString()} / 120,000
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <Avatar className="h-9 w-9 border border-sidebar-primary/35">
                      <AvatarImage src="/logo.webp" alt="Velvet Dinosaur" className="object-cover" />
                      <AvatarFallback className="text-[11px] font-semibold">VD</AvatarFallback>
                    </Avatar>
                    <Textarea
                      id="support-reply"
                      ref={replyRef}
                      value={replyText}
                      onChange={(event) => onReplyTextChange(event.target.value)}
                      placeholder="Write your reply..."
                      className="min-h-[140px] resize-none bg-background"
                    />
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Plain text is sent to the customer portal. In this demo the reply only updates the local conversation thread.
                  </p>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="support-reply-attachment-name" className="text-xs text-muted-foreground">
                        Attachment name (optional)
                      </Label>
                      <Input
                        id="support-reply-attachment-name"
                        value={replyAttachmentName}
                        onChange={(event) => onReplyAttachmentNameChange(event.target.value)}
                        placeholder="Release notes"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="support-reply-attachment-url" className="text-xs text-muted-foreground">
                        Attachment URL
                      </Label>
                      <div className="flex items-center gap-2">
                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                        <Input
                          id="support-reply-attachment-url"
                          value={replyAttachmentUrl}
                          onChange={(event) => onReplyAttachmentUrlChange(event.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <DemoHelpTooltip content="Add your reply to the local ticket timeline and show the outbound support workflow without emailing a real customer.">
                      <Button onClick={onSendReply} disabled={isSendingReply || !replyText.trim()}>
                        {isSendingReply ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Send Reply
                      </Button>
                    </DemoHelpTooltip>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Satisfaction</h3>
                <p className="text-xs text-muted-foreground">Ratings are enabled when a request is in Resolved or Closed status.</p>
              </div>

              <Card className="border-border/70 bg-muted/20">
                <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_1fr_auto] md:items-center">
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">Rating</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((value) => {
                        const active = value <= ratingDraft;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => onRatingDraftChange(value)}
                            className="rounded-md p-1 transition hover:bg-muted"
                            aria-label={`Set rating to ${value}`}
                          >
                            <Star
                              className={`h-5 w-5 ${
                                active
                                  ? 'fill-amber-400 text-amber-500 dark:fill-amber-300 dark:text-amber-300'
                                  : 'text-muted-foreground'
                              }`}
                            />
                          </button>
                        );
                      })}
                      <span className="ml-2 text-xs text-muted-foreground">{ratingLabel(ratingDraft)}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="support-rating-comment" className="text-xs text-muted-foreground">
                      Optional feedback
                    </Label>
                    <Input
                      id="support-rating-comment"
                      value={ratingComment}
                      onChange={(event) => onRatingCommentChange(event.target.value)}
                      placeholder="Any additional feedback"
                    />
                  </div>

                  <DemoHelpTooltip content="Record a fictional satisfaction score so the demo can show the closed-loop support feedback journey.">
                    <Button onClick={onSubmitRating} disabled={isSubmittingRating || !canSubmitRating}>
                      {isSubmittingRating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Submit Rating
                    </Button>
                  </DemoHelpTooltip>
                </CardContent>
              </Card>

              <div className="rounded-md border bg-muted/20 p-3 text-sm">
                <p className="flex items-center gap-1">
                  Current rating:
                  <span className="font-medium">{thread.ticket.satisfactionRating ? `${thread.ticket.satisfactionRating}/5` : 'Not submitted'}</span>
                  {thread.ticket.satisfactionRating ? (
                    <span className="ml-1 inline-flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((value) => {
                        const active = value <= (thread.ticket.satisfactionRating || 0);
                        return (
                          <Star
                            key={`current-${value}`}
                            className={`h-3.5 w-3.5 ${
                              active ? 'fill-amber-400 text-amber-500 dark:fill-amber-300 dark:text-amber-300' : 'text-muted-foreground'
                            }`}
                          />
                        );
                      })}
                    </span>
                  ) : null}
                </p>
                {thread.ticket.satisfactionComment ? <p className="mt-1 text-muted-foreground">{thread.ticket.satisfactionComment}</p> : null}
              </div>

              {thread.ratings.length > 0 ? (
                <div className="rounded-md border p-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Rating History</p>
                  <div className="space-y-2">
                    {thread.ratings.slice(0, 5).map((entry) => (
                      <div key={entry.id} className="text-sm">
                        <p className="flex flex-wrap items-center gap-2 font-medium">
                          <span>{entry.rating}/5</span>
                          <span className="inline-flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((value) => {
                              const active = value <= entry.rating;
                              return (
                                <Star
                                  key={`${entry.id}-${value}`}
                                  className={`h-3.5 w-3.5 ${
                                    active
                                      ? 'fill-amber-400 text-amber-500 dark:fill-amber-300 dark:text-amber-300'
                                      : 'text-muted-foreground'
                                  }`}
                                />
                              );
                            })}
                          </span>
                          <span className="text-xs font-normal text-muted-foreground">{formatDateTime(entry.submittedAt)}</span>
                        </p>
                        {entry.comment ? <p className="text-muted-foreground">{entry.comment}</p> : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
