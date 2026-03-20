import Link from 'next/link';
import {
  FileSignature,
  Home,
  Image as ImageIcon,
  LayoutGrid,
  List,
  Mail,
  MoreHorizontal,
  Palette,
  PanelBottom,
  PanelTop,
  Plus,
  Search,
  Store
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { SortKey, ViewMode } from '@/components/edit/pages-index-types';

const sortOptions: Array<{ value: SortKey; label: string }> = [
  { value: 'slug-asc', label: 'Slug (A-Z)' },
  { value: 'draft-desc', label: 'Draft updated' },
  { value: 'published-desc', label: 'Published date' },
  { value: 'updated-desc', label: 'Recently updated' }
];

type EditIndexHeaderBarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  sortKey: SortKey;
  onSortChange: (value: SortKey) => void;
  viewMode: ViewMode;
  onViewModeChange: (value: ViewMode) => void;
  filteredCount: number;
  totalCount: number;
  hasContractsPage?: boolean;
  onNewPage: () => void;
  onNewWorkArticle: () => void;
};

export function EditIndexHeaderBar({
  query,
  onQueryChange,
  sortKey,
  onSortChange,
  viewMode,
  onViewModeChange,
  filteredCount,
  totalCount,
  hasContractsPage = false,
  onNewPage,
  onNewWorkArticle
}: EditIndexHeaderBarProps) {
  return (
    <div data-testid="edit-index-header" className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-black tracking-tight text-[var(--vd-fg)]">Content</h1>
          <Badge className="text-[11px]">
            Showing {filteredCount} of {totalCount} items
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild data-testid="edit-index-theme-editor">
            <Link href="/admin/theme">
              <Palette className="h-4 w-4" />
              Theme editor
            </Link>
          </Button>
          <Button size="sm" onClick={onNewPage} data-testid="edit-index-new-page">
            <Plus className="h-4 w-4" />
            New page
          </Button>
          <Button variant="outline" size="sm" onClick={onNewWorkArticle} data-testid="edit-index-new-work">
            <Plus className="h-4 w-4" />
            New work
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
                More
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/edit/contact-templates">
                  <Mail className="h-4 w-4" />
                  Contact templates
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin/store">
                  <Store className="h-4 w-4" />
                  Store
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/edit/home">
                  <Home className="h-4 w-4" />
                  Edit home
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/edit/media">
                  <ImageIcon className="h-4 w-4" />
                  Media library
                </Link>
              </DropdownMenuItem>
              {hasContractsPage ? (
                <DropdownMenuItem asChild>
                  <Link href="/edit/contracts">
                    <FileSignature className="h-4 w-4" />
                    Contracts
                  </Link>
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem asChild>
                <Link href="/edit/global-header">
                  <PanelTop className="h-4 w-4" />
                  Edit header
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/edit/global-footer">
                  <PanelBottom className="h-4 w-4" />
                  Edit footer
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--vd-muted-fg)]" />
            <Input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search pages or work"
              className="pl-9"
            />
          </div>
          <div className="w-full sm:w-52">
            <Select value={sortKey} onValueChange={(value) => onSortChange(value as SortKey)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort" />
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
