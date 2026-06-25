'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  File,
  Bot,
  Settings,
  Terminal,
  Hash,
  ArrowRight,
  MessageSquare,
  Code,
  Zap,
  FolderOpen,
  LayoutTemplate,
  Bell,
  Plug,
  GitBranch,
  Users,
  FileText,
  Store,
  Crown,
  Globe,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useModelStore } from '@/stores/model-store';
import { useChatStore } from '@/stores/chat-store';

// ── Command Item Types ─────────────────────────────────────────────────────

interface CommandItem {
  id: string;
  type: 'action' | 'chat' | 'model' | 'file';
  label: string;
  description: string;
  icon: React.ReactNode;
  shortcut?: string;
}

// ── Component Props ────────────────────────────────────────────────────────

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (commandId: string) => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export function CommandPalette({ open, onOpenChange, onSelect }: CommandPaletteProps) {
  const { models, setSelectedModel } = useModelStore();
  const { chats, createChat, setActiveChat } = useChatStore();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // ── Build command list ──────────────────────────────────────────────────

  const buildCommands = useCallback((): CommandItem[] => {
    const actions: CommandItem[] = [
      {
        id: 'new-chat',
        type: 'action',
        label: 'New Chat',
        description: 'Start a new conversation',
        icon: <MessageSquare className="h-4 w-4 text-emerald-400" />,
        shortcut: '⌘N',
      },
      {
        id: 'new-agent',
        type: 'action',
        label: 'New Agent',
        description: 'Launch an AI agent task',
        icon: <Bot className="h-4 w-4 text-orange-400" />,
      },
      {
        id: 'switch-model',
        type: 'action',
        label: 'Switch Model',
        description: 'Change the active AI model',
        icon: <Zap className="h-4 w-4 text-amber-400" />,
      },
      {
        id: 'open-settings',
        type: 'action',
        label: 'Open Settings',
        description: 'Configure providers and preferences',
        icon: <Settings className="h-4 w-4 text-zinc-400" />,
        shortcut: '⌘,',
      },
      {
        id: 'run-terminal',
        type: 'action',
        label: 'Run Terminal Command',
        description: 'Execute a shell command',
        icon: <Terminal className="h-4 w-4 text-cyan-400" />,
      },
      {
        id: 'open-editor',
        type: 'action',
        label: 'Open Editor',
        description: 'Switch to code editor view',
        icon: <Code className="h-4 w-4 text-teal-400" />,
      },
      {
        id: 'open-files',
        type: 'action',
        label: 'Browse Files',
        description: 'Navigate project files',
        icon: <FolderOpen className="h-4 w-4 text-rose-400" />,
      },
      {
        id: 'search-web',
        type: 'action',
        label: 'Web Search',
        description: 'Search the web for information',
        icon: <Search className="h-4 w-4 text-red-400" />,
      },
      {
        id: 'open-mcp',
        type: 'action',
        label: 'Open MCP Hub',
        description: 'Manage MCP servers and tools',
        icon: <Plug className="h-4 w-4 text-teal-400" />,
      },
      {
        id: 'open-git',
        type: 'action',
        label: 'Open Git Panel',
        description: 'View repository status and changes',
        icon: <GitBranch className="h-4 w-4 text-emerald-400" />,
      },
      {
        id: 'open-collab',
        type: 'action',
        label: 'Open Collaboration',
        description: 'Share and collaborate on sessions',
        icon: <Users className="h-4 w-4 text-blue-400" />,
      },
      {
        id: 'open-spec',
        type: 'action',
        label: 'Open Spec Pipeline',
        description: 'Create and manage AI specs',
        icon: <FileText className="h-4 w-4 text-orange-400" />,
      },
      {
        id: 'open-marketplace',
        type: 'action',
        label: 'Open Marketplace',
        description: 'Browse and install integrations',
        icon: <Store className="h-4 w-4 text-amber-400" />,
      },
      {
        id: 'open-competitive',
        type: 'action',
        label: 'Open Comparison',
        description: 'Compare with competing platforms',
        icon: <Crown className="h-4 w-4 text-yellow-400" />,
      },
      {
        id: 'open-templates',
        type: 'action',
        label: 'Open Templates',
        description: 'Browse project templates & code snippets',
        icon: <LayoutTemplate className="h-4 w-4 text-emerald-400" />,
      },
      {
        id: 'open-notifications',
        type: 'action',
        label: 'Open Notifications',
        description: 'View alerts and activity timeline',
        icon: <Bell className="h-4 w-4 text-amber-400" />,
      },
    ];

    const chatItems: CommandItem[] = chats.slice(0, 5).map((chat) => ({
      id: `chat-${chat.id}`,
      type: 'chat' as const,
      label: chat.title,
      description: `${chat.messages.length} messages · ${chat.model}`,
      icon: <MessageSquare className="h-4 w-4 text-zinc-500" />,
    }));

    const modelItems: CommandItem[] = models
      .filter((m) => m.enabled)
      .map((model) => ({
        id: `model-${model.id}`,
        type: 'model' as const,
        label: model.name,
        description: `${model.provider} · $${model.costPer1kTokens}/1K`,
        icon: <Hash className="h-4 w-4 text-zinc-500" />,
      }));

    const fileItems: CommandItem[] = [
      {
        id: 'file-src-app',
        type: 'file',
        label: 'src/app/page.tsx',
        description: 'Main application page',
        icon: <File className="h-4 w-4 text-zinc-500" />,
      },
      {
        id: 'file-src-layout',
        type: 'file',
        label: 'src/app/layout.tsx',
        description: 'Root layout component',
        icon: <File className="h-4 w-4 text-zinc-500" />,
      },
      {
        id: 'file-prisma-schema',
        type: 'file',
        label: 'prisma/schema.prisma',
        description: 'Database schema',
        icon: <File className="h-4 w-4 text-zinc-500" />,
      },
    ];

    return [...actions, ...chatItems, ...modelItems, ...fileItems];
  }, [chats, models]);

  // ── Filter commands ─────────────────────────────────────────────────────

  const allCommands = buildCommands();
  const filtered = query.trim()
    ? allCommands.filter(
        (cmd) =>
          cmd.label.toLowerCase().includes(query.toLowerCase()) ||
          cmd.description.toLowerCase().includes(query.toLowerCase())
      )
    : allCommands;

  // Reset selected index when filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // ── Handle command selection ────────────────────────────────────────────

  const handleSelect = useCallback((cmd: CommandItem) => {
    // Handle special model selection
    if (cmd.type === 'model') {
      const modelId = cmd.id.replace('model-', '');
      setSelectedModel(modelId);
    }
    // Handle special chat selection
    if (cmd.type === 'chat') {
      const chatId = cmd.id.replace('chat-', '');
      setActiveChat(chatId);
    }
    // Handle new chat
    if (cmd.id === 'new-chat') {
      createChat();
    }
    // Notify parent
    onSelect?.(cmd.id);
    onOpenChange(false);
  }, [onSelect, onOpenChange, setSelectedModel, setActiveChat, createChat]);

  // ── Keyboard navigation ─────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex]);
      }
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(
      `[data-command-index="${selectedIndex}"]`
    );
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  // ── Group filtered results ──────────────────────────────────────────────

  const grouped = filtered.reduce<
    Record<string, { label: string; items: CommandItem[] }>
  >((acc, cmd) => {
    const groupLabel =
      cmd.type === 'action'
        ? 'Actions'
        : cmd.type === 'chat'
          ? 'Recent Chats'
          : cmd.type === 'model'
            ? 'Models'
            : 'Files';
    if (!acc[cmd.type]) {
      acc[cmd.type] = { label: groupLabel, items: [] };
    }
    acc[cmd.type].items.push(cmd);
    return acc;
  }, {});

  // ── Render ──────────────────────────────────────────────────────────────

  let runningIndex = 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[20%] translate-y-0 border-border bg-card/95 p-0 shadow-2xl backdrop-blur-xl sm:max-w-lg">
        {/* Search input */}
        <div className="flex items-center border-b border-border px-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="h-11 border-0 bg-transparent text-sm placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <kbd className="hidden shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline-block">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto px-1 py-1.5 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            Object.entries(grouped).map(([type, group]) => {
              const groupItems = (
                <div key={type}>
                  <div className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                    {group.label}
                  </div>
                  {group.items.map((cmd) => {
                    const idx = runningIndex++;
                    const isSelected = idx === selectedIndex;
                    return (
                      <div
                        key={cmd.id}
                        data-command-index={idx}
                        onClick={() => handleSelect(cmd)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                          isSelected
                            ? 'bg-accent text-foreground'
                            : 'text-muted-foreground hover:bg-accent/50'
                        }`}
                      >
                        <span className="shrink-0">{cmd.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{cmd.label}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {cmd.description}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {cmd.shortcut && (
                            <Badge variant="outline" className="text-[10px]">
                              {cmd.shortcut}
                            </Badge>
                          )}
                          {isSelected && (
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
              return groupItems;
            })
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center justify-between border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px]">↑↓</kbd>{' '}
              Navigate
            </span>
            <span>
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px]">↵</kbd>{' '}
              Select
            </span>
          </div>
          <span>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CommandPalette;
