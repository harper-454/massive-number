'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  FolderOpen,
  FolderPlus,
  Pin,
  Archive,
  Trash2,
  Clock,
  MessageSquare,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  Pencil,
  FolderInput,
  PinOff,
  ArchiveRestore,
  Loader2,
  Inbox,
  Hash,
  CalendarDays,
  ArrowUpDown,
  X,
  Check,
  Bot,
  User,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

/* ───────── Types ───────── */

interface ChatFolder {
  id: string;
  name: string;
  color: string;
  icon?: string | null;
  sortOrder: number;
  _count?: { chats: number };
}

interface PreviewMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

interface ChatHistoryItem {
  id: string;
  title: string;
  model: string;
  mode: string;
  persona: string;
  folderId: string | null;
  folder: { id: string; name: string; color: string } | null;
  pinned: boolean;
  archived: boolean;
  messageCount: number;
  preview: string | null;
  previewMessages: PreviewMessage[];
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface HistoryResponse {
  chats: ChatHistoryItem[];
  folders: ChatFolder[];
  total: number;
  limit: number;
  offset: number;
}

type DateFilter = 'today' | 'week' | 'month' | 'all';
type SortOption = 'updatedAt' | 'createdAt' | 'messageCount';
type FilterMode = 'all' | 'pinned' | 'archived';

/* ───────── Helpers ───────── */

const MODEL_COLORS: Record<string, string> = {
  auto: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
  'gemini-2.5-flash': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'gemini-3-flash': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'deepseek-v4-flash': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  'deepseek-r1': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  'llama-4-scout-17b': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'llama-4-maverick-17b': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'qwen3-coder-480b': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'qwen3.7-max': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'mistral-large': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  codestral: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'gpt-oss-120b': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'cerebras-glm-4.7': 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  'command-r-plus': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'deepseek-r1-sambanova': 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  'openrouter-free': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
};

function getModelBadgeClass(model: string): string {
  return MODEL_COLORS[model] || 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30';
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getModelDisplayName(model: string): string {
  const names: Record<string, string> = {
    auto: 'Auto',
    'gemini-2.5-flash': 'Gemini 2.5 Flash',
    'gemini-3-flash': 'Gemini 3 Flash',
    'deepseek-v4-flash': 'DeepSeek V4',
    'deepseek-r1': 'DeepSeek R1',
    'llama-4-scout-17b': 'Llama 4 Scout',
    'llama-4-maverick-17b': 'Llama 4 Maverick',
    'qwen3-coder-480b': 'Qwen3 Coder',
    'qwen3.7-max': 'Qwen3.7 Max',
    'mistral-large': 'Mistral Large',
    codestral: 'Codestral',
    'gpt-oss-120b': 'GPT-OSS',
    'cerebras-glm-4.7': 'GLM 4.7',
    'command-r-plus': 'Command R+',
    'deepseek-r1-sambanova': 'DeepSeek R1 SN',
    'openrouter-free': 'OpenRouter',
  };
  return names[model] || model;
}

/* ───────── Sub-Components ───────── */

function ChatListItem({
  chat,
  isSelected,
  onSelect,
  onAction,
}: {
  chat: ChatHistoryItem;
  isSelected: boolean;
  onSelect: () => void;
  onAction: (action: string, chatId: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15 }}
      className={`group relative rounded-lg border transition-all cursor-pointer ${
        isSelected
          ? 'bg-zinc-800/80 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
          : 'bg-zinc-900/40 border-zinc-800/50 hover:bg-zinc-800/60 hover:border-zinc-700/60'
      }`}
      onClick={onSelect}
    >
      <div className="p-3">
        <div className="flex items-start gap-2">
          {/* Pin indicator */}
          {chat.pinned && (
            <Pin className="h-3 w-3 text-amber-400 shrink-0 mt-1 rotate-45" />
          )}

          {/* Chat info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`text-sm font-medium truncate ${
                isSelected ? 'text-emerald-300' : 'text-zinc-200'
              }`}>
                {chat.title}
              </h3>
              {chat.archived && (
                <Archive className="h-3 w-3 text-zinc-500 shrink-0" />
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Model badge */}
              <Badge
                variant="outline"
                className={`text-[10px] h-4 px-1.5 font-mono border ${getModelBadgeClass(chat.model)}`}
              >
                {getModelDisplayName(chat.model)}
              </Badge>

              {/* Message count */}
              <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                <MessageSquare className="h-2.5 w-2.5" />
                {chat.messageCount}
              </span>

              {/* Folder badge */}
              {chat.folder && (
                <span
                  className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${chat.folder.color}15`,
                    color: chat.folder.color,
                  }}
                >
                  <FolderOpen className="h-2.5 w-2.5" />
                  {chat.folder.name}
                </span>
              )}
            </div>

            {/* Preview text */}
            {chat.preview && (
              <p className="text-xs text-zinc-500 line-clamp-1 mt-1.5 leading-relaxed">
                {chat.preview}
              </p>
            )}

            {/* Timestamp */}
            <div className="flex items-center gap-1 mt-1.5">
              <Clock className="h-2.5 w-2.5 text-zinc-600" />
              <span className="text-[10px] text-zinc-600">
                {formatRelativeTime(chat.updatedAt)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-zinc-500 hover:text-zinc-300"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 bg-zinc-900 border-zinc-800"
            >
              <DropdownMenuItem
                className="text-zinc-300 focus:text-zinc-100 focus:bg-zinc-800"
                onClick={(e) => {
                  e.stopPropagation();
                  onAction('rename', chat.id);
                }}
              >
                <Pencil className="h-3.5 w-3.5 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-zinc-300 focus:text-zinc-100 focus:bg-zinc-800"
                onClick={(e) => {
                  e.stopPropagation();
                  onAction('moveToFolder', chat.id);
                }}
              >
                <FolderInput className="h-3.5 w-3.5 mr-2" />
                Move to Folder
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem
                className="text-zinc-300 focus:text-zinc-100 focus:bg-zinc-800"
                onClick={(e) => {
                  e.stopPropagation();
                  onAction(chat.pinned ? 'unpin' : 'pin', chat.id);
                }}
              >
                {chat.pinned ? (
                  <PinOff className="h-3.5 w-3.5 mr-2" />
                ) : (
                  <Pin className="h-3.5 w-3.5 mr-2" />
                )}
                {chat.pinned ? 'Unpin' : 'Pin'}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-zinc-300 focus:text-zinc-100 focus:bg-zinc-800"
                onClick={(e) => {
                  e.stopPropagation();
                  onAction(chat.archived ? 'unarchive' : 'archive', chat.id);
                }}
              >
                {chat.archived ? (
                  <ArchiveRestore className="h-3.5 w-3.5 mr-2" />
                ) : (
                  <Archive className="h-3.5 w-3.5 mr-2" />
                )}
                {chat.archived ? 'Unarchive' : 'Archive'}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem
                className="text-red-400 focus:text-red-300 focus:bg-red-500/10"
                onClick={(e) => {
                  e.stopPropagation();
                  onAction('delete', chat.id);
                }}
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );
}

function FolderTreeItem({
  folder,
  isActive,
  chatCount,
  onClick,
  onAction,
}: {
  folder: ChatFolder;
  isActive: boolean;
  chatCount: number;
  onClick: () => void;
  onAction: (action: string, folderId: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div>
      <div
        className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-all ${
          isActive
            ? 'bg-zinc-800/80 text-zinc-100'
            : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
        }`}
        onClick={() => {
          setCollapsed(!collapsed);
          onClick();
        }}
      >
        <button
          className="h-4 w-4 flex items-center justify-center shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            setCollapsed(!collapsed);
          }}
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </button>
        <div
          className="h-2.5 w-2.5 rounded-sm shrink-0"
          style={{ backgroundColor: folder.color }}
        />
        <span className="text-xs font-medium truncate flex-1">{folder.name}</span>
        <span className="text-[10px] text-zinc-600 tabular-nums">{chatCount}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-zinc-500 hover:text-zinc-300"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-40 bg-zinc-900 border-zinc-800"
          >
            <DropdownMenuItem
              className="text-zinc-300 focus:text-zinc-100 focus:bg-zinc-800"
              onClick={(e) => {
                e.stopPropagation();
                onAction('rename', folder.id);
              }}
            >
              <Pencil className="h-3.5 w-3.5 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem
              className="text-red-400 focus:text-red-300 focus:bg-red-500/10"
              onClick={(e) => {
                e.stopPropagation();
                onAction('delete', folder.id);
              }}
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function ChatSkeleton() {
  return (
    <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/40 p-3">
      <div className="flex items-start gap-2">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4 bg-zinc-800/60" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16 bg-zinc-800/60" />
            <Skeleton className="h-3 w-8 bg-zinc-800/60" />
          </div>
          <Skeleton className="h-3 w-full bg-zinc-800/60" />
        </div>
      </div>
    </div>
  );
}

function PreviewPane({ chat }: { chat: ChatHistoryItem }) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-zinc-800/60">
        <div className="flex items-center gap-2 mb-1">
          {chat.pinned && <Pin className="h-3 w-3 text-amber-400 rotate-45" />}
          <h3 className="text-sm font-semibold text-zinc-100 truncate">
            {chat.title}
          </h3>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className={`text-[10px] h-4 px-1.5 font-mono border ${getModelBadgeClass(chat.model)}`}
          >
            {getModelDisplayName(chat.model)}
          </Badge>
          <span className="flex items-center gap-1 text-[10px] text-zinc-500">
            <MessageSquare className="h-2.5 w-2.5" />
            {chat.messageCount} messages
          </span>
          {chat.folder && (
            <span
              className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: `${chat.folder.color}15`,
                color: chat.folder.color,
              }}
            >
              <FolderOpen className="h-2.5 w-2.5" />
              {chat.folder.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-600">
          <span className="flex items-center gap-1">
            <CalendarDays className="h-2.5 w-2.5" />
            Created {new Date(chat.createdAt).toLocaleDateString()}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" />
            Updated {formatRelativeTime(chat.updatedAt)}
          </span>
        </div>
      </div>

      {/* Preview messages */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {chat.previewMessages.length > 0 ? (
            chat.previewMessages.map((msg) => (
              <div key={msg.id} className="flex gap-2">
                <div className={`h-5 w-5 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                  msg.role === 'user'
                    ? 'bg-zinc-700/60'
                    : 'bg-emerald-500/15'
                }`}>
                  {msg.role === 'user' ? (
                    <User className="h-3 w-3 text-zinc-400" />
                  ) : (
                    <Bot className="h-3 w-3 text-emerald-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-400 font-medium mb-0.5">
                    {msg.role === 'user' ? 'You' : 'Assistant'}
                  </p>
                  <p className="text-xs text-zinc-500 leading-relaxed line-clamp-3">
                    {msg.content}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6">
              <MessageSquare className="h-6 w-6 text-zinc-700 mx-auto mb-2" />
              <p className="text-xs text-zinc-600">No messages yet</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

/* ───────── Main Component ───────── */

export function HistoryPanel() {
  // Data state
  const [chats, setChats] = useState<ChatHistoryItem[]>([]);
  const [folders, setFolders] = useState<ChatFolder[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Filter/sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('updatedAt');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [modelFilter, setModelFilter] = useState<string>('all');

  // Pagination
  const [offset, setOffset] = useState(0);
  const PAGE_SIZE = 20;

  // Selection
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  // Dialogs
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [renameTarget, setRenameTarget] = useState<{ type: 'chat' | 'folder'; id: string } | null>(null);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#10b981');
  const [moveToFolderDialogOpen, setMoveToFolderDialogOpen] = useState(false);
  const [moveChatId, setMoveChatId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'chat' | 'folder'; id: string } | null>(null);

  // Folder sidebar collapse
  const [foldersCollapsed, setFoldersCollapsed] = useState(false);

  // Debounced search
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const selectedChat = chats.find((c) => c.id === selectedChatId) ?? null;

  /* ───────── Data Fetching ───────── */

  const fetchChats = useCallback(
    async (append = false) => {
      if (!append) setIsLoading(true);
      else setIsLoadingMore(true);

      try {
        const params = new URLSearchParams({
          limit: PAGE_SIZE.toString(),
          offset: append ? offset.toString() : '0',
          sortBy,
          dateRange: dateFilter,
        });

        if (searchQuery) params.set('search', searchQuery);
        if (activeFolderId) params.set('folderId', activeFolderId);
        if (filterMode === 'pinned') params.set('pinned', 'true');
        if (filterMode === 'archived') params.set('archived', 'true');
        if (modelFilter !== 'all') params.set('model', modelFilter);

        const res = await fetch(`/api/history?${params}`);
        if (!res.ok) throw new Error('Failed to fetch');

        const data: HistoryResponse = await res.json();

        if (append) {
          setChats((prev) => [...prev, ...data.chats]);
        } else {
          setChats(data.chats);
        }
        setFolders(data.folders);
        setTotal(data.total);
      } catch (err) {
        console.error('Failed to fetch chat history:', err);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [searchQuery, activeFolderId, dateFilter, sortBy, filterMode, modelFilter, offset]
  );

  useEffect(() => {
    setOffset(0);
    fetchChats(false);
  }, [searchQuery, activeFolderId, dateFilter, sortBy, filterMode, modelFilter]);

  /* ───────── API Actions ───────── */

  const updateChat = async (chatId: string, updates: Record<string, unknown>) => {
    try {
      const res = await fetch('/api/history', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, ...updates }),
      });
      if (!res.ok) throw new Error('Failed to update');
      fetchChats();
    } catch (err) {
      console.error('Failed to update chat:', err);
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      const res = await fetch('/api/history', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      if (selectedChatId === chatId) setSelectedChatId(null);
      fetchChats();
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  };

  const createFolder = async (name: string, color: string) => {
    try {
      const res = await fetch('/api/chat-folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color }),
      });
      if (!res.ok) throw new Error('Failed to create folder');
      fetchChats();
    } catch (err) {
      console.error('Failed to create folder:', err);
    }
  };

  const updateFolder = async (folderId: string, updates: Record<string, unknown>) => {
    try {
      const res = await fetch('/api/chat-folders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId, ...updates }),
      });
      if (!res.ok) throw new Error('Failed to update folder');
      fetchChats();
    } catch (err) {
      console.error('Failed to update folder:', err);
    }
  };

  const deleteFolder = async (folderId: string) => {
    try {
      const res = await fetch('/api/chat-folders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId }),
      });
      if (!res.ok) throw new Error('Failed to delete folder');
      if (activeFolderId === folderId) setActiveFolderId(null);
      fetchChats();
    } catch (err) {
      console.error('Failed to delete folder:', err);
    }
  };

  /* ───────── Action Handlers ───────── */

  const handleChatAction = (action: string, chatId: string) => {
    const chat = chats.find((c) => c.id === chatId);
    switch (action) {
      case 'rename':
        setRenameTarget({ type: 'chat', id: chatId });
        setRenameValue(chat?.title || '');
        setRenameDialogOpen(true);
        break;
      case 'pin':
        updateChat(chatId, { pinned: true });
        break;
      case 'unpin':
        updateChat(chatId, { pinned: false });
        break;
      case 'archive':
        updateChat(chatId, { archived: true });
        break;
      case 'unarchive':
        updateChat(chatId, { archived: false });
        break;
      case 'delete':
        setDeleteTarget({ type: 'chat', id: chatId });
        setDeleteDialogOpen(true);
        break;
      case 'moveToFolder':
        setMoveChatId(chatId);
        setMoveToFolderDialogOpen(true);
        break;
    }
  };

  const handleFolderAction = (action: string, folderId: string) => {
    const folder = folders.find((f) => f.id === folderId);
    switch (action) {
      case 'rename':
        setRenameTarget({ type: 'folder', id: folderId });
        setRenameValue(folder?.name || '');
        setRenameDialogOpen(true);
        break;
      case 'delete':
        setDeleteTarget({ type: 'folder', id: folderId });
        setDeleteDialogOpen(true);
        break;
    }
  };

  const handleSearchChange = (value: string) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, 300);
  };

  const handleLoadMore = () => {
    const newOffset = offset + PAGE_SIZE;
    setOffset(newOffset);
    fetchChats(true);
  };

  const handleRenameConfirm = () => {
    if (!renameTarget || !renameValue.trim()) return;
    if (renameTarget.type === 'chat') {
      updateChat(renameTarget.id, { title: renameValue.trim() });
    } else {
      updateFolder(renameTarget.id, { name: renameValue.trim() });
    }
    setRenameDialogOpen(false);
    setRenameTarget(null);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'chat') {
      deleteChat(deleteTarget.id);
    } else {
      deleteFolder(deleteTarget.id);
    }
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  const handleMoveToFolder = (folderId: string) => {
    if (!moveChatId) return;
    updateChat(moveChatId, { folderId: folderId === '__none__' ? null : folderId });
    setMoveToFolderDialogOpen(false);
    setMoveChatId(null);
  };

  // Unique models from chats for filter
  const availableModels = Array.from(new Set(chats.map((c) => c.model)));

  // Count chats per folder
  const folderChatCounts = folders.reduce<Record<string, number>>((acc, f) => {
    acc[f.id] = f._count?.chats ?? 0;
    return acc;
  }, {});
  const uncategorizedCount = chats.filter((c) => !c.folderId).length;

  const hasMore = chats.length < total;

  return (
    <div className="flex h-full">
      {/* ── Folder Sidebar ── */}
      <div className={`flex flex-col border-r border-zinc-800/60 bg-zinc-950/60 transition-all ${
        foldersCollapsed ? 'w-10' : 'w-48'
      }`}>
        {/* Sidebar header */}
        <div className="flex items-center justify-between p-2 border-b border-zinc-800/60">
          {!foldersCollapsed && (
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
              Folders
            </span>
          )}
          <div className="flex items-center gap-0.5">
            {!foldersCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-zinc-500 hover:text-zinc-300"
                onClick={() => {
                  setNewFolderName('');
                  setNewFolderColor('#10b981');
                  setCreateFolderDialogOpen(true);
                }}
              >
                <FolderPlus className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-zinc-500 hover:text-zinc-300"
              onClick={() => setFoldersCollapsed(!foldersCollapsed)}
            >
              {foldersCollapsed ? (
                <ChevronRight className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>

        {!foldersCollapsed && (
          <ScrollArea className="flex-1">
            <div className="p-1.5 space-y-0.5">
              {/* All chats */}
              <div
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-all ${
                  !activeFolderId && filterMode === 'all'
                    ? 'bg-zinc-800/80 text-zinc-100'
                    : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
                }`}
                onClick={() => {
                  setActiveFolderId(null);
                  setFilterMode('all');
                }}
              >
                <Inbox className="h-3.5 w-3.5 shrink-0" />
                <span className="text-xs font-medium truncate flex-1">All Chats</span>
                <span className="text-[10px] text-zinc-600 tabular-nums">{total}</span>
              </div>

              {/* Pinned */}
              <div
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-all ${
                  filterMode === 'pinned'
                    ? 'bg-zinc-800/80 text-amber-400'
                    : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
                }`}
                onClick={() => {
                  setActiveFolderId(null);
                  setFilterMode('pinned');
                }}
              >
                <Pin className="h-3.5 w-3.5 shrink-0 rotate-45" />
                <span className="text-xs font-medium truncate flex-1">Pinned</span>
              </div>

              {/* Archived */}
              <div
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-all ${
                  filterMode === 'archived'
                    ? 'bg-zinc-800/80 text-zinc-200'
                    : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
                }`}
                onClick={() => {
                  setActiveFolderId(null);
                  setFilterMode('archived');
                }}
              >
                <Archive className="h-3.5 w-3.5 shrink-0" />
                <span className="text-xs font-medium truncate flex-1">Archived</span>
              </div>

              <Separator className="my-1.5 bg-zinc-800/60" />

              {/* Uncategorized */}
              <div
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-all ${
                  activeFolderId === 'uncategorized'
                    ? 'bg-zinc-800/80 text-zinc-100'
                    : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
                }`}
                onClick={() => {
                  setActiveFolderId('uncategorized');
                  setFilterMode('all');
                }}
              >
                <Hash className="h-3.5 w-3.5 shrink-0" />
                <span className="text-xs font-medium truncate flex-1">Uncategorized</span>
                <span className="text-[10px] text-zinc-600 tabular-nums">{uncategorizedCount}</span>
              </div>

              {/* Folder items */}
              {folders.map((folder) => (
                <FolderTreeItem
                  key={folder.id}
                  folder={folder}
                  isActive={activeFolderId === folder.id}
                  chatCount={folderChatCounts[folder.id] || 0}
                  onClick={() => {
                    setActiveFolderId(folder.id);
                    setFilterMode('all');
                  }}
                  onAction={handleFolderAction}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Search & Filters Bar */}
        <div className="p-3 border-b border-zinc-800/60 space-y-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <Input
              placeholder="Search chats..."
              className="pl-8 h-8 text-xs bg-zinc-900/60 border-zinc-800/60 text-zinc-200 placeholder:text-zinc-600 focus:border-emerald-500/40 focus:ring-emerald-500/20"
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          {/* Filter row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Date filter */}
            <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
              <SelectTrigger className="h-6 w-[90px] text-[10px] bg-zinc-900/60 border-zinc-800/60 text-zinc-400">
                <CalendarDays className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                <SelectItem value="all" className="text-xs text-zinc-300">All Time</SelectItem>
                <SelectItem value="today" className="text-xs text-zinc-300">Today</SelectItem>
                <SelectItem value="week" className="text-xs text-zinc-300">This Week</SelectItem>
                <SelectItem value="month" className="text-xs text-zinc-300">This Month</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="h-6 w-[110px] text-[10px] bg-zinc-900/60 border-zinc-800/60 text-zinc-400">
                <ArrowUpDown className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                <SelectItem value="updatedAt" className="text-xs text-zinc-300">Last Updated</SelectItem>
                <SelectItem value="createdAt" className="text-xs text-zinc-300">Created Date</SelectItem>
                <SelectItem value="messageCount" className="text-xs text-zinc-300">Message Count</SelectItem>
              </SelectContent>
            </Select>

            {/* Model filter */}
            {availableModels.length > 1 && (
              <Select value={modelFilter} onValueChange={setModelFilter}>
                <SelectTrigger className="h-6 w-[100px] text-[10px] bg-zinc-900/60 border-zinc-800/60 text-zinc-400">
                  <Bot className="h-3 w-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="all" className="text-xs text-zinc-300">All Models</SelectItem>
                  {availableModels.map((m) => (
                    <SelectItem key={m} value={m} className="text-xs text-zinc-300">
                      {getModelDisplayName(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Active filter badges */}
            {filterMode === 'pinned' && (
              <Badge className="text-[10px] h-5 px-1.5 bg-amber-500/15 text-amber-400 border-amber-500/30 border hover:bg-amber-500/25 cursor-pointer"
                onClick={() => setFilterMode('all')}
              >
                Pinned <X className="h-2.5 w-2.5 ml-1" />
              </Badge>
            )}
            {filterMode === 'archived' && (
              <Badge className="text-[10px] h-5 px-1.5 bg-zinc-500/15 text-zinc-400 border-zinc-500/30 border hover:bg-zinc-500/25 cursor-pointer"
                onClick={() => setFilterMode('all')}
              >
                Archived <X className="h-2.5 w-2.5 ml-1" />
              </Badge>
            )}

            <span className="text-[10px] text-zinc-600 ml-auto tabular-nums">
              {total} chat{total !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Chat List + Preview */}
        <div className="flex-1 flex min-h-0">
          {/* Chat list */}
          <ScrollArea className={`${selectedChat ? 'w-1/2' : 'w-full'} border-r border-zinc-800/40`}>
            <div className="p-2 space-y-1.5">
              <AnimatePresence mode="popLayout">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => <ChatSkeleton key={i} />)
                ) : chats.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-12 text-center"
                  >
                    <div className="h-12 w-12 rounded-xl bg-zinc-800/60 flex items-center justify-center mb-3">
                      <MessageSquare className="h-5 w-5 text-zinc-600" />
                    </div>
                    <p className="text-sm text-zinc-500 mb-1">No chats found</p>
                    <p className="text-xs text-zinc-600 max-w-[200px]">
                      {searchQuery
                        ? 'Try a different search term'
                        : filterMode === 'archived'
                        ? 'No archived chats'
                        : filterMode === 'pinned'
                        ? 'No pinned chats'
                        : 'Start a conversation to see it here'}
                    </p>
                  </motion.div>
                ) : (
                  chats.map((chat) => (
                    <ChatListItem
                      key={chat.id}
                      chat={chat}
                      isSelected={selectedChatId === chat.id}
                      onSelect={() =>
                        setSelectedChatId(selectedChatId === chat.id ? null : chat.id)
                      }
                      onAction={handleChatAction}
                    />
                  ))
                )}
              </AnimatePresence>

              {/* Load more */}
              {!isLoading && hasMore && (
                <div className="flex justify-center py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-zinc-500 hover:text-zinc-300"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : null}
                    Load More ({total - chats.length} remaining)
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Preview pane */}
          <AnimatePresence>
            {selectedChat && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '50%', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex flex-col h-full bg-zinc-950/40">
                  {/* Preview header */}
                  <div className="flex items-center justify-between p-2 border-b border-zinc-800/60">
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                      Preview
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-zinc-500 hover:text-zinc-300"
                      onClick={() => setSelectedChatId(null)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <PreviewPane chat={selectedChat} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Rename Dialog ── */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">
              Rename {renameTarget?.type === 'chat' ? 'Chat' : 'Folder'}
            </DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            className="bg-zinc-800/60 border-zinc-700 text-zinc-200"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameConfirm();
            }}
          />
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-zinc-200"
              onClick={() => setRenameDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
              onClick={handleRenameConfirm}
              disabled={!renameValue.trim()}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create Folder Dialog ── */}
      <Dialog open={createFolderDialogOpen} onOpenChange={setCreateFolderDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Create Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="bg-zinc-800/60 border-zinc-700 text-zinc-200"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newFolderName.trim()) {
                  createFolder(newFolderName.trim(), newFolderColor);
                  setCreateFolderDialogOpen(false);
                }
              }}
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Color:</span>
              <div className="flex gap-1.5">
                {['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'].map(
                  (color) => (
                    <button
                      key={color}
                      className={`h-5 w-5 rounded-full transition-all ${
                        newFolderColor === color ? 'ring-2 ring-white/30 scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewFolderColor(color)}
                    />
                  )
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-zinc-200"
              onClick={() => setCreateFolderDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
              onClick={() => {
                if (newFolderName.trim()) {
                  createFolder(newFolderName.trim(), newFolderColor);
                  setCreateFolderDialogOpen(false);
                }
              }}
              disabled={!newFolderName.trim()}
            >
              <FolderPlus className="h-3.5 w-3.5 mr-1" />
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Move to Folder Dialog ── */}
      <Dialog open={moveToFolderDialogOpen} onOpenChange={setMoveToFolderDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Move to Folder</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-60">
            <div className="space-y-1">
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer hover:bg-zinc-800/60 transition-colors"
                onClick={() => handleMoveToFolder('__none__')}
              >
                <Hash className="h-3.5 w-3.5 text-zinc-500" />
                <span className="text-sm text-zinc-300">No Folder</span>
              </div>
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer hover:bg-zinc-800/60 transition-colors"
                  onClick={() => handleMoveToFolder(folder.id)}
                >
                  <div
                    className="h-3 w-3 rounded-sm"
                    style={{ backgroundColor: folder.color }}
                  />
                  <span className="text-sm text-zinc-300">{folder.name}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">
              Delete {deleteTarget?.type === 'chat' ? 'Chat' : 'Folder'}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-400">
            {deleteTarget?.type === 'chat'
              ? 'Are you sure you want to delete this chat? This action cannot be undone and will delete all messages.'
              : 'Are you sure you want to delete this folder? Chats inside will be moved to Uncategorized.'}
          </p>
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-zinc-200"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="bg-red-600 hover:bg-red-500 text-white"
              onClick={handleDeleteConfirm}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
