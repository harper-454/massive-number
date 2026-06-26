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
  Wifi,
  WifiOff,
  Layers,
  Activity,
  Timer,
  Coins,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Plug,
  GitBranch,
  Users,
  FileText,
  Store,
  Crown,
  LayoutTemplate,
  Bell,
  UserCog,
  Brain,
  User,
  History,
  Library,
  LayoutGrid,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PanelErrorBoundary } from '@/components/nexus/panel-error-boundary';
import { useUIStore, type PanelView } from '@/stores/ui-store';
import { useChatStore } from '@/stores/chat-store';
import { useAgentStore } from '@/stores/agent-store';
import { useModelStore } from '@/stores/model-store';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';

// Static imports — bundles all panels together to avoid chunk load failures
import { ChatPanel } from '@/components/nexus/chat-panel';
import { AgentPanel } from '@/components/nexus/agent-panel';
import { SearchPanel } from '@/components/nexus/search-panel';
import EditorPanel from '@/components/nexus/editor-panel';
import TerminalPanel from '@/components/nexus/terminal-panel';
import FileExplorer from '@/components/nexus/file-explorer';
import { SettingsPanel } from '@/components/nexus/settings-panel';
import { CommandPalette } from '@/components/nexus/command-palette';
import { MCPHub } from '@/components/nexus/mcp-hub';
import { GitPanel } from '@/components/nexus/git-panel';
import { CollabPanel } from '@/components/nexus/collab-panel';
import { SpecPanel } from '@/components/nexus/spec-panel';
import { MarketplacePanel } from '@/components/nexus/marketplace-panel';
import { CompetitivePanel } from '@/components/nexus/competitive-panel';
import { TemplatesPanel } from '@/components/nexus/templates-panel';
import { NotificationsPanel } from '@/components/nexus/notifications-panel';
import { CustomizationHub } from '@/components/nexus/customization-hub';
import { ContextMemory } from '@/components/nexus/context-memory';
import { AccountPanel } from '@/components/nexus/account-panel';
import { HistoryPanel } from '@/components/nexus/history-panel';
import { LibraryPanel } from '@/components/nexus/library-panel';
import { DevSurfacesPanel } from '@/components/nexus/dev-surfaces-panel';

// ── Navigation Items ─────────────────────────────────────────────────────

const NAV_ITEMS: {
  id: PanelView;
  label: string;
  icon: React.ElementType;
  shortcut?: string;
  section?: 'primary' | 'workspace' | 'tools';
}[] = [
  // ── Primary ──
  { id: 'chat', label: 'AI Chat', icon: MessageSquare, shortcut: '1', section: 'primary' },
  { id: 'editor', label: 'Code Editor', icon: Code, shortcut: '2', section: 'primary' },
  { id: 'agent', label: 'Agent Mode', icon: Bot, shortcut: '3', section: 'primary' },
  { id: 'dev-surfaces', label: 'Dev Surfaces', icon: LayoutGrid, section: 'primary' },
  // ── Workspace ──
  { id: 'history', label: 'Chat History', icon: History, section: 'workspace' },
  { id: 'library', label: 'Library', icon: Library, section: 'workspace' },
  { id: 'account', label: 'Account', icon: User, section: 'workspace' },
  // ── Tools ──
  { id: 'search', label: 'Web Search', icon: Globe, shortcut: '4', section: 'tools' },
  { id: 'terminal', label: 'Terminal', icon: TerminalIcon, shortcut: '5', section: 'tools' },
  { id: 'files', label: 'Files', icon: FolderOpen, shortcut: '6', section: 'tools' },
  { id: 'mcp', label: 'MCP Hub', icon: Plug, shortcut: '7', section: 'tools' },
  { id: 'git', label: 'Git Panel', icon: GitBranch, shortcut: '8', section: 'tools' },
  { id: 'collab', label: 'Collaboration', icon: Users, shortcut: '9', section: 'tools' },
  { id: 'spec', label: 'Spec Pipeline', icon: FileText, shortcut: '0', section: 'tools' },
  { id: 'marketplace', label: 'Marketplace', icon: Store, section: 'tools' },
  { id: 'competitive', label: 'Comparison', icon: Crown, section: 'tools' },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate, section: 'tools' },
  { id: 'notifications', label: 'Notifications', icon: Bell, section: 'tools' },
  { id: 'customization', label: 'Customize', icon: UserCog, section: 'tools' },
  { id: 'context', label: 'Context & Memory', icon: Brain, section: 'tools' },
];

// ── Title Bar ────────────────────────────────────────────────────────────

function TitleBar() {
  const { selectedModel, models } = useModelStore();
  const activeModel = models.find(m => m.id === selectedModel);
  const [wsConnected, setWsConnected] = useState(false);
  const [time, setTime] = useState('');

  useEffect(() => {
    try {
      const socket = io('/?XTransformPort=3003', { transports: ['websocket', 'polling'] });
      socket.on('connect', () => { setWsConnected(true); });
      socket.on('disconnect', () => { setWsConnected(false); });
      setTimeout(() => socket.disconnect(), 3000);

      const timer = setInterval(() => {
        setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      }, 1000);
      return () => { clearInterval(timer); socket.disconnect(); };
    } catch {
      const timer = setInterval(() => {
        setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      }, 1000);
      return () => { clearInterval(timer); };
    }
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
          v2.0
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
        <Badge variant="outline" className="text-[10px] h-5 px-2 gap-1 border-amber-500/30 text-amber-400">
          <LayoutGrid className="h-3 w-3" />
          10 surfaces
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

  const primaryItems = NAV_ITEMS.filter(i => i.section === 'primary');
  const workspaceItems = NAV_ITEMS.filter(i => i.section === 'workspace');
  const toolItems = NAV_ITEMS.filter(i => i.section === 'tools');

  const renderNavGroup = (items: typeof NAV_ITEMS) =>
    items.map((item) => {
      const isActive = activeView === item.id;
      const Icon = item.icon;
      return (
        <TooltipProvider key={item.id} delayDuration={300}>
          <Tooltip side="right" disableHoverableContent>
            <TooltipTrigger asChild>
              <button
                onClick={() => onViewChange(item.id)}
                className={`relative h-9 w-9 rounded-lg flex items-center justify-center transition-all group ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-emerald-400 rounded-r"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <Icon className="h-4 w-4" />
                {/* Badges */}
                {item.id === 'chat' && chats.length > 0 && (
                  <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                )}
                {item.id === 'agent' && isRunning && (
                  <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
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
    });

  return (
    <div className="flex flex-col items-center w-11 border-r border-border/40 bg-card/40 py-2 shrink-0">
      {/* Top: Logo */}
      <div className="mb-2">
        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-orange-500/20">
          <Zap className="h-3.5 w-3.5 text-white" />
        </div>
      </div>

      <Separator className="w-5 mb-1.5" />

      {/* Primary */}
      <nav className="flex flex-col gap-0.5">
        {renderNavGroup(primaryItems)}
      </nav>

      <Separator className="w-5 my-1.5" />

      {/* Workspace */}
      <nav className="flex flex-col gap-0.5">
        {renderNavGroup(workspaceItems)}
      </nav>

      <Separator className="w-5 my-1.5" />

      {/* Tools */}
      <nav className="flex flex-col gap-0.5 flex-1 overflow-y-auto">
        {renderNavGroup(toolItems)}
      </nav>

      {/* Bottom: Settings */}
      <Separator className="w-5 mb-1.5" />
      <TooltipProvider delayDuration={300}>
        <Tooltip side="right" disableHoverableContent>
          <TooltipTrigger asChild>
            <button
              onClick={() => onViewChange('settings')}
              className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all ${
                activeView === 'settings'
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              }`}
            >
              <Settings className="h-4 w-4" />
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
  // Only render the active panel
  const getPanel = (): React.ReactNode => {
    switch (view) {
      case 'chat': return <ChatPanel />;
      case 'editor': return <EditorPanel />;
      case 'agent': return <AgentPanel />;
      case 'search': return <SearchPanel />;
      case 'terminal': return <TerminalPanel />;
      case 'files': return <FileExplorer />;
      case 'settings': return <SettingsPanel />;
      case 'mcp': return <MCPHub />;
      case 'git': return <GitPanel />;
      case 'collab': return <CollabPanel />;
      case 'spec': return <SpecPanel />;
      case 'marketplace': return <MarketplacePanel />;
      case 'competitive': return <CompetitivePanel />;
      case 'templates': return <TemplatesPanel />;
      case 'notifications': return <NotificationsPanel />;
      case 'customization': return <CustomizationHub />;
      case 'context': return <ContextMemory />;
      case 'account': return <AccountPanel />;
      case 'history': return <HistoryPanel />;
      case 'library': return <LibraryPanel />;
      case 'dev-surfaces': return <DevSurfacesPanel />;
      default: return null;
    }
  };

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
        <PanelErrorBoundary name={view}>
          {getPanel()}
        </PanelErrorBoundary>
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
        <span className="flex items-center gap-1 text-emerald-400">
          <LayoutGrid className="h-2.5 w-2.5" />
          10 surfaces
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
      <span>June 26, 2026</span>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────

export default function Home() {
  const [activeView, setActiveView] = useState<PanelView>('dev-surfaces');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [rightPanelView, setRightPanelView] = useState<PanelView>('competitive');

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
        if (numKey >= 1 && numKey <= NAV_ITEMS.filter(i => i.shortcut).length) {
          const shortcutItems = NAV_ITEMS.filter(i => i.shortcut);
          const target = shortcutItems[numKey - 1];
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
    const commandViewMap: Record<string, PanelView> = {
      'new-chat': 'chat',
      'new-agent': 'agent',
      'switch-model': 'chat',
      'open-settings': 'settings',
      'run-terminal': 'terminal',
      'search-web': 'search',
      'open-editor': 'editor',
      'open-files': 'files',
      'open-mcp': 'mcp',
      'open-git': 'git',
      'open-collab': 'collab',
      'open-spec': 'spec',
      'open-marketplace': 'marketplace',
      'open-competitive': 'competitive',
      'open-templates': 'templates',
      'open-notifications': 'notifications',
      'open-customization': 'customization',
      'open-context': 'context',
      'open-account': 'account',
      'open-history': 'history',
      'open-library': 'library',
      'open-dev-surfaces': 'dev-surfaces',
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
