import * as React from 'react';

export type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> & {
  onCheckedChange?: (checked: boolean) => void;
};

export function Checkbox({ onCheckedChange, checked, className, ...rest }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      {...rest}
      checked={Boolean(checked)}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      className={['h-4 w-4 rounded border border-[var(--vd-border)]', className].filter(Boolean).join(' ')}
    />
  );
}
