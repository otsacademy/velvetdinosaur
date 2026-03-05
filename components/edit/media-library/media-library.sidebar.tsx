'use client';

import { FolderPlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { AssetFolderItem } from '@/lib/uploads';
import { FOLDER_ALL, FOLDER_ROOT } from './media-library.types';

export function MediaLibrarySidebar({
  folderFilter,
  onFolderChange,
  folders,
  foldersLoading,
  onCreateFolder
}: {
  folderFilter: string;
  onFolderChange: (value: string) => void;
  folders: AssetFolderItem[];
  foldersLoading: boolean;
  onCreateFolder: () => void;
}) {
  return (
    <Card className="h-fit">
      <CardHeader className="space-y-1">
        <CardTitle className="text-sm">Folders</CardTitle>
        <p className="text-xs text-[var(--vd-muted-fg)]">Browse and keep uploads tidy.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <TooltipProvider>
        <div className="flex items-center gap-2">
          <Button
            variant={folderFilter === FOLDER_ALL ? 'default' : 'outline'}
            className="w-full justify-start"
            onClick={() => onFolderChange(FOLDER_ALL)}
          >
            All files
          </Button>
          <Button variant="outline" size="icon" onClick={onCreateFolder} aria-label="New folder">
            <FolderPlus className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant={folderFilter === FOLDER_ROOT ? 'default' : 'outline'}
          className="w-full justify-start"
          onClick={() => onFolderChange(FOLDER_ROOT)}
        >
          Root
        </Button>
        <Separator />
        <ScrollArea className="h-[320px] pr-2">
          <div className="space-y-2">
            {foldersLoading ? (
              <div className="flex items-center gap-2 text-xs text-[var(--vd-muted-fg)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading folders
              </div>
            ) : folders.length === 0 ? (
              <p className="text-xs text-[var(--vd-muted-fg)]">No folders yet.</p>
            ) : (
              folders.map((folder) => (
                <Tooltip key={folder.path}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={folderFilter === folder.path ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => onFolderChange(folder.path)}
                    >
                      <span className="truncate">{folder.label ? folder.label : folder.path}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="max-w-[240px] text-xs">
                      {folder.label ? `${folder.label} (${folder.path})` : folder.path}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ))
            )}
          </div>
        </ScrollArea>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
