import type { ComponentType, ReactNode } from 'react';
import { LayoutGrid, List, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { ViewMode } from '@/components/edit/pages-index-types';
import type { TabSortOption } from '@/components/edit/edit-index/registry';

type HeaderTab = { key: string; label: string; count: number };

type EditIndexHeaderBarProps = {
  heading: { title: string; subtitle: string };
  tabs: HeaderTab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  query: string;
  onQueryChange: (value: string) => void;
  searchPlaceholder: string;
  sortOptions: TabSortOption[];
  sortValue: string;
  onSortChange: (value: string) => void;
  sortPlaceholder: string;
  sortMenuOpen: boolean;
  onSortMenuOpenChange: (open: boolean) => void;
  HeaderFilter?: ComponentType<{ value: string; onChange: (value: string) => void }>;
  extraFilter: string;
  onExtraFilterChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (value: ViewMode) => void;
  actions: ReactNode;
};

export function EditIndexHeaderBar({
  heading,
  tabs,
  activeTab,
  onTabChange,
  query,
  onQueryChange,
  searchPlaceholder,
  sortOptions,
  sortValue,
  onSortChange,
  sortPlaceholder,
  sortMenuOpen,
  onSortMenuOpenChange,
  HeaderFilter,
  extraFilter,
  onExtraFilterChange,
  viewMode,
  onViewModeChange,
  actions
}: EditIndexHeaderBarProps) {
  return (
    <div data-testid="edit-index-header" className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-[var(--vd-fg)]">{heading.title}</h1>
          <p className="text-sm text-[var(--vd-muted-fg)]">{heading.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      </div>

      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList className="h-auto w-full justify-start gap-2 rounded-none bg-transparent p-0">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.key}
              value={tab.key}
              className="h-10 rounded-none border-b-2 border-b-transparent px-3 text-sm font-semibold text-[var(--vd-muted-fg)] transition-[background-color,border-color,color] hover:border-b-[var(--vd-ring)]/65 hover:bg-[var(--vd-ring)]/8 hover:text-[var(--vd-fg)] data-[state=active]:border-b-[var(--vd-ring)] data-[state=active]:bg-transparent data-[state=active]:text-[var(--vd-fg)]"
            >
              {tab.label}
              <span className="ml-1.5 rounded-full border border-[var(--vd-border)] bg-[var(--vd-bg)] px-2 py-0.5 text-[11px] font-semibold">
                {tab.count}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--vd-muted-fg)]" />
            <Input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9 focus-visible:ring-[var(--vd-ring)]/60"
            />
          </div>

          {HeaderFilter ? (
            <div className="w-full sm:w-56">
              <HeaderFilter value={extraFilter} onChange={onExtraFilterChange} />
            </div>
          ) : null}

          <div className="w-full sm:w-56">
            <Select
              value={sortValue}
              onValueChange={onSortChange}
              open={sortMenuOpen}
              onOpenChange={onSortMenuOpenChange}
            >
              <SelectTrigger className="hover:border-[var(--vd-ring)]/70 hover:ring-2 hover:ring-[var(--vd-ring)]/15">
                <span className="inline-flex items-center gap-2">
                  <span aria-hidden className="text-[var(--vd-ring)]">⇅</span>
                  <SelectValue placeholder={sortPlaceholder} />
                </span>
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs value={viewMode} onValueChange={(value) => onViewModeChange(value as ViewMode)}>
          <TabsList className="h-9 bg-[var(--vd-muted)]/60">
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="list" className="h-8 w-9 px-0" aria-label="List view">
                  <List className="h-4 w-4" />
                  <span className="sr-only">List view</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>List view</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="grid" className="h-8 w-9 px-0" aria-label="Grid view">
                  <LayoutGrid className="h-4 w-4" />
                  <span className="sr-only">Grid view</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>Grid view</TooltipContent>
            </Tooltip>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
