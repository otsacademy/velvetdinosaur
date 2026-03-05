'use client';

import type { CustomFieldRender } from '@measured/puck';

export function checkboxField() {
  const render: CustomFieldRender<boolean> = ({ field, id, name, value, onChange, readOnly }) => {
    const checked = Boolean(value);
    const label =
      typeof field.label === 'string' && field.label.trim() ? field.label.trim() : 'Enabled';

    return (
      <label className="flex items-center gap-2 text-sm text-[var(--vd-fg)]">
        <input
          id={id}
          name={name}
          type="checkbox"
          className="h-4 w-4 rounded border border-[var(--vd-border)] bg-white text-[var(--vd-fg)]"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          disabled={readOnly}
        />
        <span className="text-xs text-[var(--vd-muted-fg)]">{label}</span>
      </label>
    );
  };

  return {
    type: 'custom',
    render
  } as const;
}
