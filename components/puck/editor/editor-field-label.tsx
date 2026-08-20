'use client';

import * as React from 'react';
import { ChevronDown, ChevronRight, Lock } from 'lucide-react';
import { FieldLabel } from '@puckeditor/core';

type EditorFieldLabelProps = {
  children?: React.ReactNode;
  icon?: React.ReactNode;
  label: string;
  el?: 'label' | 'div';
  readOnly?: boolean;
  className?: string;
};

const ADVANCED_LABEL_KEY = 'advanced (developers)';

export function EditorFieldLabel({
  children,
  icon,
  label,
  el = 'label',
  readOnly,
  className
}: EditorFieldLabelProps) {
  const isAdvanced = label.trim().toLowerCase() === ADVANCED_LABEL_KEY;
  const [expanded, setExpanded] = React.useState(false);

  if (!isAdvanced) {
    return (
      <FieldLabel
        label={label}
        icon={icon}
        el={el}
        readOnly={readOnly}
        className={className}
      >
        {children}
      </FieldLabel>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        className="flex w-full items-center gap-2 py-0.5 text-left text-sm text-[var(--vd-fg)]"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
      >
        {icon ? <span className="inline-flex text-[var(--vd-muted-fg)]">{icon}</span> : null}
        <span className="flex-1 font-medium">{label}</span>
        {readOnly ? <Lock className="h-3.5 w-3.5 text-[var(--vd-muted-fg)]" /> : null}
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-[var(--vd-muted-fg)]" />
        ) : (
          <ChevronRight className="h-4 w-4 text-[var(--vd-muted-fg)]" />
        )}
      </button>
      {expanded ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}
