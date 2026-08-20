'use client';

import type { DragEvent } from 'react';
import { Folder, FolderPlus, Loader2, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { AssetFolderItem } from '@/lib/uploads';
import { FOLDER_ALL, FOLDER_ROOT, FOLDER_TRASH } from './media-library.types';

export function MediaLibrarySidebar({
  folderFilter,
  onFolderChange,
  folders,
  foldersLoading,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  onDropToFolder
}: {
  folderFilter: string;
  onFolderChange: (value: string) => void;
  folders: AssetFolderItem[];
  foldersLoading: boolean;
  onCreateFolder: () => void;
  onEditFolder: (folder: AssetFolderItem) => void;
  onDeleteFolder: (folder: AssetFolderItem) => void;
  onDropToFolder: (path: string) => void;
}) {
  const handleFolderDrop = (event: DragEvent<HTMLElement>, path: string) => {
    event.preventDefault();
    if (!event.dataTransfer.types.includes('text/asap-media')) return;
    onDropToFolder(path);
  };

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
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => handleFolderDrop(event, FOLDER_ROOT)}
        >
          <Folder className="mr-2 h-4 w-4" />
          Root
        </Button>
        <Button
          variant={folderFilter === FOLDER_TRASH ? 'default' : 'outline'}
          className="w-full justify-start"
          onClick={() => onFolderChange(FOLDER_TRASH)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Trash
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
                <div
                  key={folder.path}
                  className="flex items-center gap-1"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => handleFolderDrop(event, folder.path)}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={folderFilter === folder.path ? 'default' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => onFolderChange(folder.path)}
                      >
                        <Folder className="mr-2 h-4 w-4" />
                        <span className="truncate">{folder.label ? folder.label : folder.path}</span>
                        <span className="ml-2 text-xs text-[var(--vd-muted-fg)]">{folder.count || 0}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <div className="max-w-[260px] space-y-1 text-xs">
                        <p>{folder.label ? `${folder.label} (${folder.path})` : folder.path}</p>
                        {folder.description ? <p className="text-[var(--vd-muted-fg)]">{folder.description}</p> : null}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label={`Manage ${folder.path}`}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditFolder(folder)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit folder
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDeleteFolder(folder)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete folder
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
