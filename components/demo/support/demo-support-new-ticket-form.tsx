'use client';

import { Loader2, PlusCircle } from 'lucide-react';
import { SUPPORT_TICKET_CATEGORIES, SUPPORT_TICKET_MODULES } from '@/components/demo/support/demo-support.shared';
import type { TicketCreateState } from '@/components/demo/support/demo-support.shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const PRIORITY_OPTIONS = [
  {
    value: '1-critical',
    label: 'Urgent',
    description: 'Something is broken and affecting visitors now.'
  },
  {
    value: '3-medium',
    label: 'Soon',
    description: 'Needs attention in the next few days.'
  },
  {
    value: '5-standard',
    label: 'When you can',
    description: 'No rush, just when you get a chance.'
  }
] as const;

const PROBLEM_CATEGORY_KEYS: TicketCreateState['category'][] = ['support_request', 'content_update', 'technical_issue'];

type SupportNewTicketFormMode = 'problem' | 'feature';

export function DemoSupportNewTicketForm({
  mode,
  createState,
  isCreating,
  onCreateStateChange,
  onSubmit
}: {
  mode: SupportNewTicketFormMode;
  createState: TicketCreateState;
  isCreating: boolean;
  onCreateStateChange: (next: TicketCreateState) => void;
  onSubmit: () => void;
}) {
  const availableCategories = SUPPORT_TICKET_CATEGORIES.filter((item) => PROBLEM_CATEGORY_KEYS.includes(item.key));
  const selectedCategory = SUPPORT_TICKET_CATEGORIES.find((item) => item.key === createState.category);
  const isFeatureMode = mode === 'feature';

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>{isFeatureMode ? 'Request Something New' : 'Report a Problem'}</CardTitle>
        <CardDescription>
          {isFeatureMode
            ? "Describe what you'd like to add or improve. This is a sandboxed demo, so the request will stay local to this session."
            : "Describe what's broken or what needs updating on your website. The request will stay local to this demonstration session."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`support-subject-${mode}`}>Subject</Label>
          <Input
            id={`support-subject-${mode}`}
            value={createState.subject}
            onChange={(event) => onCreateStateChange({ ...createState, subject: event.target.value })}
            placeholder="Briefly describe what you need"
          />
        </div>

        {isFeatureMode ? (
          <div className="rounded-md border border-border/80 bg-muted/30 p-3 text-sm text-muted-foreground">
            New features may require additional development work. In this demo the request only updates the local queue.
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={createState.category}
              onValueChange={(value) => onCreateStateChange({ ...createState, category: value as TicketCreateState['category'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map((item) => (
                  <SelectItem key={item.key} value={item.key}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCategory?.description ? <p className="text-xs text-muted-foreground">{selectedCategory.description}</p> : null}
          </div>
        )}

        <div className="space-y-2">
          <Label>Priority</Label>
          <Select
            value={createState.priority}
            onValueChange={(value) => onCreateStateChange({ ...createState, priority: value as TicketCreateState['priority'] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {PRIORITY_OPTIONS.find((item) => item.value === createState.priority)?.description || 'No rush, just when you get a chance.'}
          </p>
        </div>

        <div className="space-y-2">
          <Label>Website Area</Label>
          <Select
            value={createState.module}
            onValueChange={(value) => onCreateStateChange({ ...createState, module: value as TicketCreateState['module'] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPPORT_TICKET_MODULES.map((item) => (
                <SelectItem key={item.key} value={item.key}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`support-requested-date-${mode}`}>Requested Date</Label>
          <Input
            id={`support-requested-date-${mode}`}
            type="date"
            value={createState.requestedDate}
            onChange={(event) => onCreateStateChange({ ...createState, requestedDate: event.target.value })}
          />
          <p className="text-xs text-muted-foreground">If this is time-sensitive, let the support team know when you need it done by.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`support-page-url-${mode}`}>Page URL</Label>
          <Input
            id={`support-page-url-${mode}`}
            value={createState.pageUrl}
            onChange={(event) => onCreateStateChange({ ...createState, pageUrl: event.target.value })}
            placeholder="https://www.example.com/page"
          />
          <p className="text-xs text-muted-foreground">If you can, paste the address of the page with the issue.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`support-description-${mode}`}>Request Details</Label>
          <Textarea
            id={`support-description-${mode}`}
            rows={6}
            value={createState.descriptionText}
            onChange={(event) => onCreateStateChange({ ...createState, descriptionText: event.target.value })}
            placeholder="Please describe what you need in as much detail as possible."
          />
        </div>

        <Button className="w-full" onClick={onSubmit} disabled={isCreating}>
          {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
          {isFeatureMode ? 'Submit Feature Request' : 'Submit Problem Report'}
        </Button>
      </CardContent>
    </Card>
  );
}
