'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  initialTicketCreateState,
  readJson,
  type TicketCreateState
} from '@/components/edit/support/support-workspace.shared';
import { SupportNewTicketForm } from '@/components/edit/support/support-new-ticket-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type CreatedTicketPayload = {
  item?: {
    ticketRef?: string;
  };
  error?: string;
};

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

export function SupportSubmitPortal() {
  const [activeTab, setActiveTab] = useState<'report-problem' | 'request-feature'>('report-problem');
  const [problemCreateState, setProblemCreateState] = useState<TicketCreateState>(initialProblemCreateState());
  const [featureCreateState, setFeatureCreateState] = useState<TicketCreateState>(initialFeatureCreateState());
  const [isCreating, setIsCreating] = useState(false);

  async function submitTicket(mode: 'problem' | 'feature') {
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
      const payload = (await readJson(response)) as CreatedTicketPayload;
      if (!response.ok) throw new Error(payload.error || 'Unable to submit request');

      if (mode === 'feature') setFeatureCreateState(initialFeatureCreateState());
      else setProblemCreateState(initialProblemCreateState());

      const ticketRef = payload.item?.ticketRef ? ` (${payload.item.ticketRef})` : '';
      toast.success(`Request submitted${ticketRef}. We manage all support tickets in the central Velvet Dinosaur portal.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to submit request');
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1400px] space-y-6 py-10">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Customer Portal</h1>
        <p className="text-sm text-muted-foreground">
          Submit your request here. Ticket management is handled by Velvet Dinosaur support.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'report-problem' | 'request-feature')} className="space-y-6">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
          <TabsTrigger value="report-problem" className="border border-border/70 bg-card px-3 py-1.5">
            Report a Problem
          </TabsTrigger>
          <TabsTrigger value="request-feature" className="border border-border/70 bg-card px-3 py-1.5">
            Request a Feature
          </TabsTrigger>
        </TabsList>

        <TabsContent value="report-problem" className="space-y-6">
          <SupportNewTicketForm
            mode="problem"
            createState={problemCreateState}
            isCreating={isCreating}
            onCreateStateChange={setProblemCreateState}
            onSubmit={() => void submitTicket('problem')}
          />
        </TabsContent>

        <TabsContent value="request-feature" className="space-y-6">
          <SupportNewTicketForm
            mode="feature"
            createState={featureCreateState}
            isCreating={isCreating}
            onCreateStateChange={setFeatureCreateState}
            onSubmit={() => void submitTicket('feature')}
          />
        </TabsContent>
      </Tabs>
    </main>
  );
}
