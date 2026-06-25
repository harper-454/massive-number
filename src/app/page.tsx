'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Bot,
  Globe,
  Zap,
  Sparkles,
  Settings,
  Code,
  Terminal as TerminalIcon,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  Command,
  Wifi,
  WifiOff,
  Layers,
  Activity,
  Timer,
  Coins,
  Maximize2,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChatPanel } from '@/components/nexus/chat-panel';
import { AgentPanel } from '@/components/nexus/agent-panel';
import { SearchPanel } from '@/components/nexus/search-panel';
import EditorPanel from '@/components/nexus/editor-panel';
import TerminalPanel from '@/components/nexus/terminal-panel';
import FileExplorer from '@/components/nexus/file-explorer';
import { SettingsPanel } from '@/components/nexus/settings-panel';
import { CommandPalette } from '@/components/nexus/command-palette';
import { useUIStore, type PanelView } from '@/stores/ui-store';
import { useChatStore } from '@/stores/chat-store';
import { useAgentStore } from '@/stores/agent-store';
import { useModelStore } from '@/stores/model-store';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';

// ── Navigation Items ─────────────────────────────────────────────────────

const NAV_ITEMS: {
  id: PanelView;
  label: string;
  icon: React.ElementType;
  shortcut?: string;
}[] = [
  { id: 'chat', label: 'AI Chat', icon: MessageSquare, shortcut: '1' },
  { id: 'editor', label: 'Code Editor', icon: Code, shortcut: '2' },
  { id: 'agent', label: 'Agent Mode', icon: Bot, shortcut: '3' },
  { id: 'search', label: 'Web Search', icon: Globe, shortcut: '4' },
  { id: 'terminal', label: 'Terminal', icon: TerminalIcon, shortcut: '5' },
  { id: 'files', label: 'Files', icon: FolderOpen, shortcut: '6' },
];

// ── Title Bar ────────────────────────────────────────────────────────────

function TitleBar() {
  const { selectedModel, models } = useModelStore();
  const activeModel = models.find(m => m.id === selectedModel);
  const [wsConnected, setWsConnected] = useState(false);
  const [time, setTime] = useState('');

  useEffect(() => {
    const socket = io('/?XTransformPort=3003', { transports: ['websocket', 'polling'] });
    socket.on('connect', () => { setWsConnected(true); });
    socket.on('disconnect', () => { setWsConnected(false); });
    setTimeout(() => socket.disconnect(), 3000);

    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => { clearInterval(timer); socket.disconnect(); };
  }, []);

  return (
    <div className="flex items-center h-9 px-3 border-b border-border/40 bg-card/60 backdrop-blur-md select-none shrink-0">
      {/* Left: App identity */}
      <div className="flex items-center gap-2">
        <div className="h-5 w-5 rounded bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
          <Zap className="h-3 w-3 text-white" />
        </div>
        <span className="text-xs font-bold tracking-wide">MASSIVE NUMBER</span>
        <Separator orientation="vertical" className="h-4 mx-1" />
        <Badge variant="secondary" className="text-[9px] h-4 px-1.5 font-mono gap-1">
          <Activity className="h-2.5 w-2.5 text-emerald-400" />
          v1.0
        </Badge>
      </div>

      {/* Center: Model info */}
      <div className="flex-1 flex items-center justify-center gap-2">
        <Badge variant="outline" className="text-[10px] h-5 px-2 gap-1 border-emerald-500/30 text-emerald-400">
          <Sparkles className="h-3 w-3" />
          {activeModel?.name || 'Auto'}
        </Badge>
        <Badge variant="outline" className="text-[10px] h-5 px-2 gap-1">
          <Layers className="h-3 w-3" />
          {models.filter(m => m.enabled).length} models
        </Badge>
      </div>

      {/* Right: Status */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {wsConnected ? (
            <Wifi className="h-3 w-3 text-emerald-400" />
          ) : (
            <WifiOff className="h-3 w-3 text-muted-foreground/50" />
          )}
          <span className="text-[9px] text-muted-foreground">
            {wsConnected ? 'Connected' : 'Local'}
          </span>
        </div>
        <Separator orientation="vertical" className="h-4" />
        <span className="text-[10px] text-muted-foreground font-mono">{time}</span>
      </div>
    </div>
  );
}

// ── Activity Bar (vertical icon sidebar) ────────────────────────────────

function ActivityBar({
  activeView,
  onViewChange,
}: {
  activeView: PanelView;
  onViewChange: (view: PanelView) => void;
}) {
  const { chats } = useChatStore();
  const { agents, isRunning } = useAgentStore();

  return (
    <div className="flex flex-col items-center w-12 border-r border-border/40 bg-card/40 py-2 shrink-0">
      {/* Top: Logo */}
      <div className="mb-3">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-orange-500/20">
          <Zap className="h-4 w-4 text-white" />
        </div>
      </div>

      <Separator className="w-6 mb-2" />

      {/* Nav items */}
      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.id;
          const Icon = item.icon;
          return (
            <TooltipProvider key={item.id} delayDuration={300}>
              <Tooltip side="right" disableHoverableContent>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onViewChange(item.id)}
                    className={`relative h-10 w-10 rounded-lg flex items-center justify-center transition-all group ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-emerald-400 rounded-r"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                    <Icon className="h-4.5 w-4.5" />
                    {/* Badges */}
                    {item.id === 'chat' && chats.length > 0 && (
                      <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-emerald-400" />
                    )}
                    {item.id === 'agent' && isRunning && (
                      <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  <div className="flex items-center gap-2">
                    <span>{item.label}</span>
                    {item.shortcut && (
                      <kbd className="px-1 py-0.5 text-[9px] rounded bg-muted font-mono">
                        {item.shortcut}
                      </kbd>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </nav>

      {/* Bottom: Settings */}
      <Separator className="w-6 mb-2" />
      <TooltipProvider delayDuration={300}>
        <Tooltip side="right" disableHoverableContent>
          <TooltipTrigger asChild>
            <button
              onClick={() => onViewChange('settings')}
              className={`h-10 w-10 rounded-lg flex items-center justify-center transition-all ${
                activeView === 'settings'
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              }`}
            >
              <Settings className="h-4.5 w-4.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>Settings</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

// ── Panel Content Router ────────────────────────────────────────────────

function PanelContent({ view }: { view: PanelView }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={view}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.15 }}
        className="h-full"
      >
        {view === 'chat' && <ChatPanel />}
        {view === 'editor' && <EditorPanel />}
        {view === 'agent' && <AgentPanel />}
        {view === 'search' && <SearchPanel />}
        {view === 'terminal' && <TerminalPanel />}
        {view === 'files' && <FileExplorer />}
        {view === 'settings' && <SettingsPanel />}
      </motion.div>
    </AnimatePresence>
  );
}

// ── Stats Bar ───────────────────────────────────────────────────────────

function StatsBar() {
  const { chats } = useChatStore();
  const { agents } = useAgentStore();
  const { models } = useModelStore();

  const totalTokens = chats.reduce((sum, chat) =>
    sum + chat.messages.reduce((msgSum, msg) => msgSum + (msg.tokens || 0), 0), 0);
  const totalCost = chats.reduce((sum, chat) =>
    sum + chat.messages.reduce((msgSum, msg) => msgSum + (msg.cost || 0), 0), 0);

  return (
    <div className="flex items-center h-6 px-3 border-t border-border/30 bg-card/30 text-[10px] text-muted-foreground select-none shrink-0">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <Zap className="h-2.5 w-2.5 text-amber-400" />
          MASSIVE NUMBER
        </span>
        <Separator orientation="vertical" className="h-3" />
        <span className="flex items-center gap-1">
          <Layers className="h-2.5 w-2.5" />
          {models.filter(m => m.enabled).length} models
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare className="h-2.5 w-2.5" />
          {chats.length} chats
        </span>
        <span className="flex items-center gap-1">
          <Bot className="h-2.5 w-2.5" />
          {agents.length} agents
        </span>
        {totalTokens > 0 && (
          <span className="flex items-center gap-1">
            <Timer className="h-2.5 w-2.5" />
            {totalTokens.toLocaleString()} tokens
          </span>
        )}
        {totalCost > 0 && (
          <span className="flex items-center gap-1">
            <Coins className="h-2.5 w-2.5 text-emerald-400" />
            ${(totalCost / 1000).toFixed(4)}
          </span>
        )}
      </div>
      <div className="flex-1" />
      <span>June 24, 2026</span>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────

export default function Home() {
  const [activeView, setActiveView] = useState<PanelView>('chat');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [rightPanelView, setRightPanelView] = useState<PanelView>('editor');

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
        return;
      }

      // Number keys for quick panel switch (without modifiers)
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        const numKey = parseInt(e.key);
        if (numKey >= 1 && numKey <= NAV_ITEMS.length) {
          const target = NAV_ITEMS[numKey - 1];
          if (target) setActiveView(target.id);
        }
      }

      // Escape to close command palette
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleViewChange = useCallback((view: PanelView) => {
    setActiveView(view);
  }, []);

  const handleCommandSelect = useCallback((commandId: string) => {
    // Map commands to views
    const commandViewMap: Record<string, PanelView> = {
      'new-chat': 'chat',
      'new-agent': 'agent',
      'switch-model': 'chat',
      'open-settings': 'settings',
      'run-terminal': 'terminal',
      'search-web': 'search',
      'open-editor': 'editor',
      'open-files': 'files',
    };
    const view = commandViewMap[commandId];
    if (view) setActiveView(view);
    setCommandPaletteOpen(false);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden dark">
      {/* Title bar */}
      <TitleBar />

      {/* Main area */}
      <div className="flex flex-1 min-h-0">
        {/* Activity bar */}
        <ActivityBar activeView={activeView} onViewChange={handleViewChange} />

        {/* Left panel - main content */}
        <div className="flex-1 min-w-0 relative">
          <PanelContent view={activeView} />
        </div>

        {/* Toggle right panel button */}
        <div className="flex items-center px-0.5 border-l border-border/20">
          <TooltipProvider delayDuration={300}>
            <Tooltip side="left" disableHoverableContent>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowRightPanel(!showRightPanel)}
                  className="h-8 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                >
                  {showRightPanel ? (
                    <PanelLeftClose className="h-3 w-3" />
                  ) : (
                    <PanelLeftOpen className="h-3 w-3" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">
                {showRightPanel ? 'Close side panel' : 'Open side panel'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Right panel - secondary content */}
        <AnimatePresence>
          {showRightPanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '40%', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-l border-border/40 overflow-hidden min-w-0"
            >
              <div className="h-full">
                <PanelContent view={rightPanelView} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats bar */}
      <StatsBar />

      {/* Command palette overlay */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onSelect={handleCommandSelect}
      />
    </div>
  );
}
