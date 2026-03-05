'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

type MenuDockContextValue = {
  showLabels: boolean;
  animated: boolean;
};

const MenuDockContext = React.createContext<MenuDockContextValue>({
  showLabels: true,
  animated: true
});

function useMenuDockContext() {
  return React.useContext(MenuDockContext);
}

const menuDockVariants = cva(
  'relative inline-flex items-center gap-2 rounded-2xl border border-[var(--vd-border)] bg-[var(--vd-bg)] p-2 shadow-lg backdrop-blur',
  {
    variants: {
      variant: {
        default: ''
      },
      orientation: {
        horizontal: 'flex-row',
        vertical: 'flex-col'
      }
    },
    defaultVariants: {
      variant: 'default',
      orientation: 'horizontal'
    }
  }
);

const menuDockItemVariants = cva(
  'group inline-flex min-w-[72px] flex-col items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vd-ring)] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      active: {
        true: 'bg-[var(--vd-accent)] text-[var(--vd-accent-fg)] shadow-sm',
        false: 'text-[var(--vd-muted-fg)] hover:bg-[var(--vd-muted)] hover:text-[var(--vd-fg)]'
      },
      showLabels: {
        true: '',
        false: 'min-w-0 px-2 py-2'
      }
    },
    defaultVariants: {
      active: false,
      showLabels: true
    }
  }
);

type MenuDockProps = React.ComponentProps<'nav'> &
  VariantProps<typeof menuDockVariants> & {
    showLabels?: boolean;
    animated?: boolean;
  };

export function MenuDock({
  className,
  variant,
  orientation,
  showLabels = true,
  animated = true,
  ...props
}: MenuDockProps) {
  return (
    <MenuDockContext.Provider value={{ showLabels, animated }}>
      <nav
        data-slot="menu-dock"
        data-variant={variant}
        data-orientation={orientation}
        className={cn(menuDockVariants({ variant, orientation, className }))}
        {...props}
      />
    </MenuDockContext.Provider>
  );
}

type MenuDockItemProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
};

export const MenuDockItem = React.forwardRef<HTMLButtonElement, MenuDockItemProps>(
  ({ className, icon, label, active, type, ...props }, ref) => {
    const { showLabels, animated } = useMenuDockContext();

    return (
      <button
        ref={ref}
        type={type ?? 'button'}
        data-slot="menu-dock-item"
        data-active={active ? 'true' : 'false'}
        className={cn(menuDockItemVariants({ active, showLabels }), className)}
        {...props}
      >
        <span
          className={cn(
            'flex items-center justify-center',
            animated ? 'transition-transform duration-200 ease-out group-hover:scale-110' : null
          )}
        >
          {icon}
        </span>
        {showLabels ? (
          <span className="text-[11px] font-medium leading-none">{label}</span>
        ) : (
          <span className="sr-only">{label}</span>
        )}
      </button>
    );
  }
);

MenuDockItem.displayName = 'MenuDockItem';
