'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, CircleHelp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  demoOnboardingContent,
  type DemoOnboardingGuide,
  type DemoOnboardingPageKey,
} from '@/components/demo/onboarding/demo-onboarding-content';
import { cn } from '@/lib/utils';

const STORAGE_KEY_PREFIX = 'vd:demo-onboarding:dismissed:v1:';

function readDismissed(pageKey: DemoOnboardingPageKey) {
  try {
    return window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${pageKey}`) === '1';
  } catch {
    return false;
  }
}

function persistDismissed(pageKey: DemoOnboardingPageKey) {
  try {
    window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${pageKey}`, '1');
  } catch {
    // Ignore storage access issues in restricted browser contexts.
  }
}

type DemoOnboardingControlsProps = {
  pageKey: DemoOnboardingPageKey;
  className?: string;
};

type StepListItemProps = {
  guide: DemoOnboardingGuide;
  index: number;
  activeStep: number;
  onSelect: (index: number) => void;
};

function StepListItem({ guide, index, activeStep, onSelect }: StepListItemProps) {
  const step = guide.steps[index];
  const Icon = step.icon;
  const state = index < activeStep ? 'complete' : index === activeStep ? 'active' : 'upcoming';

  return (
    <button
      type="button"
      onClick={() => onSelect(index)}
      className={cn(
        'flex w-full items-start gap-3 rounded-[0.875rem] border px-4 py-3 text-left transition-all duration-200',
        state === 'active'
          ? 'border-[color-mix(in_oklch,var(--vd-primary)_20%,var(--vd-border))] bg-[color-mix(in_oklch,var(--vd-primary)_8%,var(--vd-bg))] shadow-[0_14px_30px_-28px_color-mix(in_oklch,var(--vd-primary)_70%,transparent)]'
          : 'border-[color-mix(in_oklch,var(--vd-border)_72%,transparent)] bg-[color-mix(in_oklch,var(--vd-card)_92%,transparent)] hover:border-[color-mix(in_oklch,var(--vd-border)_92%,transparent)] hover:bg-[color-mix(in_oklch,var(--vd-muted)_50%,transparent)]'
      )}
    >
      <div
        className={cn(
          'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.5rem] border',
          state === 'active'
            ? 'border-[color-mix(in_oklch,var(--vd-primary)_30%,var(--vd-border))] bg-[color-mix(in_oklch,var(--vd-primary)_14%,var(--vd-bg))] text-[var(--vd-primary)]'
            : state === 'complete'
              ? 'border-[color-mix(in_oklch,var(--vd-accent)_26%,var(--vd-border))] bg-[color-mix(in_oklch,var(--vd-accent)_18%,var(--vd-bg))] text-[var(--vd-accent-fg)]'
              : 'border-[var(--vd-border)] bg-[var(--vd-bg)] text-[var(--vd-muted-fg)]'
        )}
      >
        {state === 'complete' ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
      </div>
      <div className="space-y-0.5">
        <p className="text-[0.625rem] font-semibold uppercase tracking-[0.28em] text-[var(--vd-muted-fg)] opacity-60">
          Step {index + 1}
        </p>
        <p className="text-[0.8125rem] font-semibold leading-[1.4] text-[var(--vd-fg)]">{step.title}</p>
      </div>
    </button>
  );
}

export function DemoOnboardingControls({ pageKey, className }: DemoOnboardingControlsProps) {
  const guide = demoOnboardingContent[pageKey];
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    setActiveStep(0);
    if (readDismissed(pageKey)) {
      setOpen(false);
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setOpen(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [pageKey]);

  const progress = useMemo(() => ((activeStep + 1) / guide.steps.length) * 100, [activeStep, guide.steps.length]);
  const currentStep = guide.steps[activeStep];
  const CurrentIcon = currentStep.icon;
  const GuideIcon = guide.icon;
  const isLastStep = activeStep === guide.steps.length - 1;

  function openGuide() {
    setActiveStep(0);
    setOpen(true);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      persistDismissed(pageKey);
    }
  }

  function handleFinish() {
    persistDismissed(pageKey);
    setOpen(false);
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={openGuide}
        className={cn('shrink-0 gap-1.5 whitespace-nowrap', className)}
      >
        <CircleHelp className="h-4 w-4" />
        <span className="hidden sm:inline">How it works</span>
        <span className="sm:hidden">Guide</span>
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          overlayClassName="bg-black/45 backdrop-blur-[4px] [-webkit-backdrop-filter:blur(4px)]"
          className="w-[min(1120px,92vw)] max-w-none gap-0 overflow-hidden rounded-[1.25rem] bg-[var(--vd-bg)] p-0 text-[var(--vd-fg)] [&>button]:right-4 [&>button]:top-4 [&>button]:flex [&>button]:h-8 [&>button]:w-8 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-[0.5rem] [&>button]:border [&>button]:border-[color-mix(in_oklch,var(--vd-border)_55%,transparent)] [&>button]:bg-[color-mix(in_oklch,var(--vd-card)_92%,transparent)] [&>button]:p-0 [&>button]:text-[var(--vd-muted-fg)] [&>button]:opacity-100 [&>button:hover]:bg-[var(--vd-muted)] [&>button:hover]:text-[var(--vd-fg)] [&>button:focus-visible]:ring-[var(--vd-ring)] [&>button:focus-visible]:ring-offset-0"
          style={{
            borderColor: 'color-mix(in oklch, var(--vd-border) 60%, transparent)',
            boxShadow:
              '0 0 0 1px color-mix(in oklch, var(--vd-border) 20%, transparent), 0 24px 80px -12px rgba(0, 0, 0, 0.18), 0 8px 24px -4px rgba(0, 0, 0, 0.08)',
          }}
        >
          <div className="grid max-h-[88dvh] min-h-[38rem] md:grid-cols-[300px_minmax(0,1fr)]">
            <aside className="hidden border-r border-[color-mix(in_oklch,var(--vd-border)_50%,transparent)] bg-[color-mix(in_oklch,var(--vd-card)_97%,var(--vd-primary)_3%)] md:flex md:flex-col">
              <div className="border-b border-[color-mix(in_oklch,var(--vd-border)_40%,transparent)] px-6 pb-6 pt-7">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-[var(--vd-primary)] opacity-70">
                  Guided tour
                </p>
                <p className="mt-3 text-[1.15rem] font-semibold tracking-tight text-[var(--vd-fg)]">{guide.label}</p>
                <p className="mt-2.5 text-[0.8125rem] leading-[1.65] text-[var(--vd-muted-fg)] opacity-[0.72]">
                  {guide.description}
                </p>
              </div>
              <div className="space-y-2 overflow-y-auto p-4">
                {guide.steps.map((_, index) => (
                  <StepListItem
                    key={guide.steps[index].id}
                    guide={guide}
                    index={index}
                    activeStep={activeStep}
                    onSelect={setActiveStep}
                  />
                ))}
              </div>
            </aside>

            <div className="flex min-h-0 flex-col">
              <DialogHeader className="gap-2 border-b border-[color-mix(in_oklch,var(--vd-border)_40%,transparent)] px-5 py-5 text-left md:px-8 md:pb-6 md:pt-7">
                <div className="mb-1 flex flex-wrap items-center gap-2 text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[var(--vd-primary)]">
                  <GuideIcon className="h-3.5 w-3.5 text-[var(--vd-primary)] opacity-[0.85]" />
                  {guide.label}
                </div>
                <DialogTitle className="text-[1.5rem] font-semibold leading-[1.3] tracking-[-0.02em] text-[var(--vd-fg)]">
                  {guide.title}
                </DialogTitle>
                <DialogDescription className="max-w-[36rem] text-[0.8125rem] leading-[1.65] text-[var(--vd-muted-fg)] opacity-[0.72]">
                  {guide.description}
                </DialogDescription>
                <div className="mt-4">
                  <div className="h-[3px] overflow-hidden rounded-[2px] bg-[color-mix(in_oklch,var(--vd-muted)_50%,transparent)]">
                    <motion.div
                      className="h-full rounded-[2px] bg-[var(--vd-primary)]"
                      initial={false}
                      animate={{ width: `${progress}%` }}
                      transition={reduceMotion ? { duration: 0 } : { duration: 0.28, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="mt-2.5 flex items-center justify-between gap-3 text-[0.6875rem] text-[var(--vd-muted-fg)] opacity-60">
                    <span>
                      Step {activeStep + 1} of {guide.steps.length}
                    </span>
                    <span>{currentStep.title}</span>
                  </div>
                </div>
              </DialogHeader>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-8 md:py-8">
                <div className="mb-6 grid gap-2.5 md:hidden">
                  {guide.steps.map((_, index) => (
                    <StepListItem
                      key={guide.steps[index].id}
                      guide={guide}
                      index={index}
                      activeStep={activeStep}
                      onSelect={setActiveStep}
                    />
                  ))}
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={currentStep.id}
                    initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                    animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -16 }}
                    transition={reduceMotion ? { duration: 0 } : { duration: 0.24, ease: 'easeOut' }}
                    className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_220px]"
                  >
                    <div className="space-y-5">
                      <div className="flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-[0.875rem] border border-[color-mix(in_oklch,var(--vd-primary)_24%,var(--vd-border))] bg-[color-mix(in_oklch,var(--vd-primary)_12%,var(--vd-bg))] text-[var(--vd-primary)]">
                        <CurrentIcon className="h-[1.375rem] w-[1.375rem]" />
                      </div>
                      <div className="space-y-3">
                        <p className="mb-1 text-[0.625rem] font-semibold uppercase tracking-[0.28em] text-[var(--vd-muted-fg)] opacity-[0.55]">
                          Step {activeStep + 1}
                        </p>
                        <h3 className="text-[1.75rem] font-semibold leading-[1.25] tracking-[-0.02em] text-[var(--vd-fg)]">
                          {currentStep.title}
                        </h3>
                        <p className="max-w-2xl text-[0.9375rem] leading-[1.75] text-[var(--vd-muted-fg)] opacity-[0.72]">
                          {currentStep.description}
                        </p>
                      </div>
                    </div>

                    <div className="self-start rounded-[1rem] border border-[color-mix(in_oklch,var(--vd-primary)_12%,var(--vd-border))] bg-[color-mix(in_oklch,var(--vd-card)_96%,var(--vd-primary)_4%)] p-5">
                      <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-[var(--vd-primary)]">
                        In this demo
                      </p>
                      <ul className="mt-3.5 space-y-2.5 text-[0.8rem] leading-[1.6] text-[var(--vd-muted-fg)]">
                        <li className="relative pl-3 opacity-[0.75] before:absolute before:left-0 before:top-[0.55em] before:h-1 before:w-1 before:rounded-full before:bg-[var(--vd-primary)] before:opacity-50">
                          Everything is backed by dummy content.
                        </li>
                        <li className="relative pl-3 opacity-[0.75] before:absolute before:left-0 before:top-[0.55em] before:h-1 before:w-1 before:rounded-full before:bg-[var(--vd-primary)] before:opacity-50">
                          Buttons and updates change local state only.
                        </li>
                        <li className="relative pl-3 opacity-[0.75] before:absolute before:left-0 before:top-[0.55em] before:h-1 before:w-1 before:rounded-full before:bg-[var(--vd-primary)] before:opacity-50">
                          Refreshing the page clears the session.
                        </li>
                      </ul>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[color-mix(in_oklch,var(--vd-border)_40%,transparent)] px-5 py-4 md:px-8">
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-[0.875rem]"
                  onClick={() => setActiveStep((current) => Math.max(current - 1, 0))}
                  disabled={activeStep === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-[0.875rem]"
                    onClick={() => handleOpenChange(false)}
                  >
                    Close
                  </Button>
                  <Button
                    type="button"
                    className="rounded-[0.875rem]"
                    onClick={() => {
                      if (isLastStep) {
                        handleFinish();
                        return;
                      }
                      setActiveStep((current) => Math.min(current + 1, guide.steps.length - 1));
                    }}
                  >
                    {isLastStep ? 'Finish tour' : 'Next step'}
                    {!isLastStep ? <ChevronRight className="h-4 w-4" /> : null}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
