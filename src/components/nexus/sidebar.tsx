'use client';

import {
  MessageSquare,
  Code,
  Bot,
  Search,
  Terminal,
  FolderOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useUIStore, type PanelView } from '@/stores/ui-store';
import { useChatStore } from '@/stores/chat-store';
import { useAgentStore } from '@/stores/agent-store';

// ── Nav Item Config ────────────────────────────────────────────────────────

interface NavItem {
  id: PanelView;
  label: string;
  icon: React.ReactNode;
  badge?: 'unread' | 'running' | null;
}

export function NexusSidebar() {
  const {
    sidebarOpen,
    activeSection,
    toggleSidebar,
    setActiveSection,
    setLeftPanelView,
  } = useUIStore();

  const chats = useChatStore((s) => s.chats);
  const activeChatId = useChatStore((s) => s.activeChatId);
  const isRunning = useAgentStore((s) => s.isRunning);

  // Determine badges
  const hasUnreadChat = chats.some(
    (c) =>
      c.id !== activeChatId &&
      c.messages.some((m) => m.role === 'assistant' && !m.isStreaming)
  );

  const navItems: NavItem[] = [
    {
      id: 'chat',
      label: 'Chat',
      icon: <MessageSquare className="h-5 w-5" />,
      badge: hasUnreadChat ? 'unread' : null,
    },
    {
      id: 'editor',
      label: 'Editor',
      icon: <Code className="h-5 w-5" />,
      badge: null,
    },
    {
      id: 'agent',
      label: 'Agent',
      icon: <Bot className="h-5 w-5" />,
      badge: isRunning ? 'running' : null,
    },
    {
      id: 'search',
      label: 'Search',
      icon: <Search className="h-5 w-5" />,
      badge: null,
    },
    {
      id: 'terminal',
      label: 'Terminal',
      icon: <Terminal className="h-5 w-5" />,
      badge: null,
    },
    {
      id: 'files',
      label: 'Files',
      icon: <FolderOpen className="h-5 w-5" />,
      badge: null,
    },
  ];

  const handleNavClick = (id: PanelView) => {
    setActiveSection(id);
    setLeftPanelView(id);
  };

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className={`flex h-full flex-col border-r border-zinc-800 bg-zinc-950 transition-all duration-200 ${
          sidebarOpen ? 'w-52' : 'w-14'
        }`}
      >
        {/* ── Brand ──────────────────────────────────────────────────── */}
        <div className="flex h-12 items-center gap-2 border-b border-zinc-800 px-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
            <Zap className="h-4 w-4 text-white" />
          </div>
          {sidebarOpen && (
            <span className="truncate text-sm font-bold tracking-wide text-zinc-100">
              MASSIVE
            </span>
          )}
        </div>

        {/* ── Nav Items ──────────────────────────────────────────────── */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-1.5 py-2">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;

            const button = (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`group relative flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                    : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
                } ${isActive ? 'before:absolute before:inset-y-1 before:left-0 before:w-0.5 before:rounded-r before:bg-emerald-500' : ''}`}
              >
                <span className="relative shrink-0">
                  {item.icon}
                  {/* Badge dot */}
                  {item.badge === 'unread' && (
                    <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                      !
                    </span>
                  )}
                  {item.badge === 'running' && (
                    <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                    </span>
                  )}
                </span>
                {sidebarOpen && (
                  <span className="truncate">{item.label}</span>
                )}
              </button>
            );

            // Tooltip only when sidebar is collapsed
            if (!sidebarOpen) {
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="border-zinc-700 bg-zinc-900 text-zinc-200"
                  >
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return button;
          })}
        </nav>

        {/* ── Bottom Section ──────────────────────────────────────────── */}
        <Separator className="bg-zinc-800" />

        <div className="space-y-0.5 px-1.5 py-2">
          {/* Settings */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleNavClick('settings')}
                className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-150 ${
                  activeSection === 'settings'
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm before:absolute before:inset-y-1 before:left-0 before:w-0.5 before:rounded-r before:bg-emerald-500'
                    : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
                } relative`}
              >
                <Settings className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span className="truncate">Settings</span>}
              </button>
            </TooltipTrigger>
            {!sidebarOpen && (
              <TooltipContent
                side="right"
                className="border-zinc-700 bg-zinc-900 text-zinc-200"
              >
                Settings
              </TooltipContent>
            )}
          </Tooltip>

          {/* Collapse toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleSidebar}
                className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-900 hover:text-zinc-400"
              >
                {sidebarOpen ? (
                  <>
                    <ChevronLeft className="h-5 w-5 shrink-0" />
                    <span className="truncate">Collapse</span>
                  </>
                ) : (
                  <ChevronRight className="h-5 w-5 shrink-0" />
                )}
              </button>
            </TooltipTrigger>
            {!sidebarOpen && (
              <TooltipContent
                side="right"
                className="border-zinc-700 bg-zinc-900 text-zinc-200"
              >
                Expand
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}

export default NexusSidebar;
