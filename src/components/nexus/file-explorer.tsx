'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  File,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Plus,
  RefreshCw,
  Trash2,
  FileCode,
  FileText,
  ImageIcon,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { Input } from '@/components/ui/input';

// ── Types ───────────────────────────────────────────────────────────────────

export interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

// ── Sample file tree ────────────────────────────────────────────────────────

const SAMPLE_TREE: FileNode = {
  name: 'my-project',
  type: 'folder',
  children: [
    {
      name: 'src',
      type: 'folder',
      children: [
        {
          name: 'app',
          type: 'folder',
          children: [
            { name: 'page.tsx', type: 'file' },
            { name: 'layout.tsx', type: 'file' },
          ],
        },
        {
          name: 'components',
          type: 'folder',
          children: [
            { name: 'header.tsx', type: 'file' },
            { name: 'sidebar.tsx', type: 'file' },
          ],
        },
        {
          name: 'lib',
          type: 'folder',
          children: [
            { name: 'utils.ts', type: 'file' },
            { name: 'db.ts', type: 'file' },
          ],
        },
      ],
    },
    {
      name: 'prisma',
      type: 'folder',
      children: [{ name: 'schema.prisma', type: 'file' }],
    },
    { name: 'package.json', type: 'file' },
    { name: 'tsconfig.json', type: 'file' },
    { name: 'README.md', type: 'file' },
  ],
};

// ── File icon by extension ──────────────────────────────────────────────────

function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  switch (ext) {
    case 'tsx':
    case 'jsx':
    case 'ts':
    case 'js':
      return <FileCode className="h-3.5 w-3.5 text-sky-400 shrink-0" />;
    case 'css':
    case 'scss':
    case 'less':
      return <FileText className="h-3.5 w-3.5 text-pink-400 shrink-0" />;
    case 'json':
      return <FileText className="h-3.5 w-3.5 text-yellow-400 shrink-0" />;
    case 'md':
      return <FileText className="h-3.5 w-3.5 text-zinc-400 shrink-0" />;
    case 'prisma':
      return <FileText className="h-3.5 w-3.5 text-purple-400 shrink-0" />;
    case 'png':
    case 'jpg':
    case 'svg':
    case 'gif':
    case 'webp':
      return <ImageIcon className="h-3.5 w-3.5 text-orange-400 shrink-0" />;
    default:
      return <File className="h-3.5 w-3.5 text-zinc-500 shrink-0" />;
  }
}

// ── Pure function for filtering tree ────────────────────────────────────────

function filterTreeNode(
  node: FileNode,
  parentPath: string,
  query: string
): FileNode | null {
  if (!query) return node;
  const fullPath = parentPath ? `${parentPath}/${node.name}` : node.name;

  if (node.type === 'file') {
    return node.name.toLowerCase().includes(query.toLowerCase()) ? node : null;
  }

  // Folder: keep if any child matches
  const filteredChildren = node.children
    ?.map((child) => filterTreeNode(child, fullPath, query))
    .filter(Boolean) as FileNode[] | undefined;

  if (
    node.name.toLowerCase().includes(query.toLowerCase()) ||
    (filteredChildren && filteredChildren.length > 0)
  ) {
    return {
      ...node,
      children: filteredChildren ?? [],
    };
  }

  return null;
}

// ── Tree item component ─────────────────────────────────────────────────────

interface TreeItemProps {
  node: FileNode;
  depth: number;
  expandedFolders: Set<string>;
  onToggleFolder: (path: string) => void;
  onFileClick: (path: string) => void;
  selectedFile: string | null;
  parentPath: string;
}

function buildFullPath(name: string, parentPath: string) {
  return parentPath ? `${parentPath}/${name}` : name;
}

function TreeItem({
  node,
  depth,
  expandedFolders,
  onToggleFolder,
  onFileClick,
  selectedFile,
  parentPath,
}: TreeItemProps) {
  const fullPath = buildFullPath(node.name, parentPath);
  const isExpanded = expandedFolders.has(fullPath);
  const isSelected = selectedFile === fullPath;

  if (node.type === 'folder') {
    return (
      <div>
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <button
              onClick={() => onToggleFolder(fullPath)}
              className={`flex items-center gap-1.5 w-full py-1 pr-2 text-xs rounded transition-colors hover:bg-zinc-800/60 ${
                isSelected ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-300'
              }`}
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3 text-zinc-500 shrink-0" />
              ) : (
                <ChevronRight className="h-3 w-3 text-zinc-500 shrink-0" />
              )}
              {isExpanded ? (
                <FolderOpen className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              ) : (
                <Folder className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              )}
              <span className="truncate">{node.name}</span>
            </button>
          </ContextMenuTrigger>
          <ContextMenuContent className="bg-[#1a1a1a] border-[#333]">
            <ContextMenuItem
              className="text-xs text-zinc-300 focus:bg-emerald-500/10 focus:text-emerald-400"
              onSelect={() => {
                // Simulate creating new file
              }}
            >
              <Plus className="h-3 w-3 mr-2" />
              New File
            </ContextMenuItem>
            <ContextMenuItem
              className="text-xs text-zinc-300 focus:bg-emerald-500/10 focus:text-emerald-400"
              onSelect={() => {}}
            >
              <Plus className="h-3 w-3 mr-2" />
              New Folder
            </ContextMenuItem>
            <ContextMenuSeparator className="bg-[#333]" />
            <ContextMenuItem
              className="text-xs text-red-400 focus:bg-red-500/10 focus:text-red-400"
              variant="destructive"
              onSelect={() => {}}
            >
              <Trash2 className="h-3 w-3 mr-2" />
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        {isExpanded && node.children && (
          <div>
            {node.children.map((child) => (
              <TreeItem
                key={child.name}
                node={child}
                depth={depth + 1}
                expandedFolders={expandedFolders}
                onToggleFolder={onToggleFolder}
                onFileClick={onFileClick}
                selectedFile={selectedFile}
                parentPath={fullPath}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // File node
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button
          onClick={() => onFileClick(fullPath)}
          className={`flex items-center gap-1.5 w-full py-1 pr-2 text-xs rounded transition-colors hover:bg-zinc-800/60 ${
            selectedFile === fullPath
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'text-zinc-400'
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <span className="w-3 shrink-0" /> {/* Spacer for alignment */}
          {getFileIcon(node.name)}
          <span className="truncate">{node.name}</span>
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent className="bg-[#1a1a1a] border-[#333]">
        <ContextMenuItem
          className="text-xs text-zinc-300 focus:bg-emerald-500/10 focus:text-emerald-400"
          onSelect={() => {}}
        >
          Rename
        </ContextMenuItem>
        <ContextMenuItem
          className="text-xs text-zinc-300 focus:bg-emerald-500/10 focus:text-emerald-400"
          onSelect={() => {
            navigator.clipboard.writeText(fullPath);
          }}
        >
          Copy Path
        </ContextMenuItem>
        <ContextMenuSeparator className="bg-[#333]" />
        <ContextMenuItem
          className="text-xs text-red-400 focus:bg-red-500/10 focus:text-red-400"
          variant="destructive"
          onSelect={() => {}}
        >
          <Trash2 className="h-3 w-3 mr-2" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

// ── File Explorer Panel ─────────────────────────────────────────────────────

interface FileExplorerProps {
  onFileSelect?: (path: string) => void;
}

export default function FileExplorer({ onFileSelect }: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(['my-project', 'my-project/src', 'my-project/src/app', 'my-project/src/components', 'my-project/src/lib', 'my-project/prisma'])
  );
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleFolder = useCallback((path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const handleFileClick = useCallback(
    (path: string) => {
      setSelectedFile(path);
      onFileSelect?.(path);
    },
    [onFileSelect]
  );

  const filteredTree = useMemo(() => {
    return filterTreeNode(SAMPLE_TREE, '', searchQuery);
  }, [searchQuery]);

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0a0a] rounded-lg border border-[#262626] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#262626] bg-[#111111]">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Files
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-zinc-500 hover:text-zinc-300"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-zinc-500 hover:text-zinc-300"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="px-2 py-2 border-b border-[#262626]">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 bg-[#111] border-[#262626] text-xs text-zinc-300 placeholder:text-zinc-600 pl-7 focus-visible:ring-emerald-500/30"
          />
        </div>
      </div>

      {/* Tree */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredTree ? (
            <TreeItem
              node={filteredTree}
              depth={0}
              expandedFolders={
                searchQuery
                  ? new Set([
                      'my-project',
                      'my-project/src',
                      'my-project/src/app',
                      'my-project/src/components',
                      'my-project/src/lib',
                      'my-project/prisma',
                    ])
                  : expandedFolders
              }
              onToggleFolder={toggleFolder}
              onFileClick={handleFileClick}
              selectedFile={selectedFile}
              parentPath=""
            />
          ) : (
            <div className="text-xs text-zinc-600 text-center py-4">
              No files found
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-[#262626] bg-[#111111] text-[10px] text-zinc-600">
        {selectedFile ? selectedFile.replace('my-project/', '') : 'No file selected'}
      </div>
    </div>
  );
}
