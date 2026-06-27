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
  ChevronDown,
  Layers,
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
  Command,
  X,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PanelErrorBoundary } from '@/components/nexus/panel-error-boundary';
import { useUIStore, type PanelView } from '@/stores/ui-store';
import { useChatStore } from '@/stores/chat-store';
import { useAgentStore } from '@/stores/agent-store';
import { useModelStore } from '@/stores/model-store';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

// Dynamic imports — on-demand panel loading for memory efficiency
const panels = {
  ChatPanel: dynamic(() => import('@/components/nexus/chat-panel').then(m => ({ default: m.ChatPanel })), { ssr: false }),
  AgentPanel: dynamic(() => import('@/components/nexus/agent-panel').then(m => ({ default: m.AgentPanel })), { ssr: false }),
  SearchPanel: dynamic(() => import('@/components/nexus/search-panel').then(m => ({ default: m.SearchPanel })), { ssr: false }),
  EditorPanel: dynamic(() => import('@/components/nexus/editor-panel'), { ssr: false }),
  TerminalPanel: dynamic(() => import('@/components/nexus/terminal-panel'), { ssr: false }),
  FileExplorer: dynamic(() => import('@/components/nexus/file-explorer'), { ssr: false }),
  SettingsPanel: dynamic(() => import('@/components/nexus/settings-panel').then(m => ({ default: m.SettingsPanel })), { ssr: false }),
  CommandPalette: dynamic(() => import('@/components/nexus/command-palette').then(m => ({ default: m.CommandPalette })), { ssr: false }),
  MCPHub: dynamic(() => import('@/components/nexus/mcp-hub').then(m => ({ default: m.MCPHub })), { ssr: false }),
  GitPanel: dynamic(() => import('@/components/nexus/git-panel').then(m => ({ default: m.GitPanel })), { ssr: false }),
  CollabPanel: dynamic(() => import('@/components/nexus/collab-panel').then(m => ({ default: m.CollabPanel })), { ssr: false }),
  SpecPanel: dynamic(() => import('@/components/nexus/spec-panel').then(m => ({ default: m.SpecPanel })), { ssr: false }),
  MarketplacePanel: dynamic(() => import('@/components/nexus/marketplace-panel').then(m => ({ default: m.MarketplacePanel })), { ssr: false }),
  CompetitivePanel: dynamic(() => import('@/components/nexus/competitive-panel').then(m => ({ default: m.CompetitivePanel })), { ssr: false }),
  TemplatesPanel: dynamic(() => import('@/components/nexus/templates-panel').then(m => ({ default: m.TemplatesPanel })), { ssr: false }),
  NotificationsPanel: dynamic(() => import('@/components/nexus/notifications-panel').then(m => ({ default: m.NotificationsPanel })), { ssr: false }),
  CustomizationHub: dynamic(() => import('@/components/nexus/customization-hub').then(m => ({ default: m.CustomizationHub })), { ssr: false }),
  ContextMemory: dynamic(() => import('@/components/nexus/context-memory').then(m => ({ default: m.ContextMemory })), { ssr: false }),
  AccountPanel: dynamic(() => import('@/components/nexus/account-panel').then(m => ({ default: m.AccountPanel })), { ssr: false }),
  HistoryPanel: dynamic(() => import('@/components/nexus/history-panel').then(m => ({ default: m.HistoryPanel })), { ssr: false }),
  LibraryPanel: dynamic(() => import('@/components/nexus/library-panel').then(m => ({ default: m.LibraryPanel })), { ssr: false }),
  DevSurfacesPanel: dynamic(() => import('@/components/nexus/dev-surfaces-panel').then(m => ({ default: m.DevSurfacesPanel })), { ssr: false }),
  ImprovementPanel: dynamic(() => import('@/components/nexus/improvement-panel').then(m => ({ default: m.ImprovementPanel })), { ssr: false }),
};

// ── Navigation ────────────────────────────────────────────────────────────

const NAV_SECTIONS = [
  {
    label: 'Core',
    items: [
      { id: 'chat' as PanelView, label: 'Chat', icon: MessageSquare, shortcut: '1' },
      { id: 'editor' as PanelView, label: 'Editor', icon: Code, shortcut: '2' },
      { id: 'agent' as PanelView, label: 'Agent', icon: Bot, shortcut: '3' },
      { id: 'dev-surfaces' as PanelView, label: 'Surfaces', icon: LayoutGrid },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { id: 'history' as PanelView, label: 'History', icon: History },
      { id: 'library' as PanelView, label: 'Library', icon: Library },
      { id: 'account' as PanelView, label: 'Account', icon: User },
    ],
  },
  {
    label: 'Tools',
    items: [
      { id: 'search' as PanelView, label: 'Search', icon: Globe, shortcut: '4' },
      { id: 'terminal' as PanelView, label: 'Terminal', icon: TerminalIcon, shortcut: '5' },
      { id: 'files' as PanelView, label: 'Files', icon: FolderOpen, shortcut: '6' },
      { id: 'mcp' as PanelView, label: 'MCP', icon: Plug, shortcut: '7' },
      { id: 'git' as PanelView, label: 'Git', icon: GitBranch, shortcut: '8' },
      { id: 'collab' as PanelView, label: 'Collab', icon: Users, shortcut: '9' },
      { id: 'spec' as PanelView, label: 'Specs', icon: FileText, shortcut: '0' },
      { id: 'marketplace' as PanelView, label: 'Market', icon: Store },
      { id: 'competitive' as PanelView, label: 'Compare', icon: Crown },
      { id: 'templates' as PanelView, label: 'Templates', icon: LayoutTemplate },
      { id: 'notifications' as PanelView, label: 'Alerts', icon: Bell },
      { id: 'customization' as PanelView, label: 'Theme', icon: UserCog },
      { id: 'context' as PanelView, label: 'Memory', icon: Brain },
      { id: 'improvement' as PanelView, label: 'Improve', icon: TrendingUp },
    ],
  },
];

const ALL_ITEMS = NAV_SECTIONS.flatMap(s => s.items);

// ── Title Bar ────────────────────────────────────────────────────────────

function TitleBar() {
  const { selectedModel, models } = useModelStore();
  const activeModel = models.find(m => m.id === selectedModel);
  const [time, setTime] = useState(() => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center h-10 px-4 border-b border-white/[0.06] bg-[#0a0a0a] select-none shrink-0">
      {/* Left: Logo + Name */}
      <div className="flex items-center gap-2.5">
        <div className="h-6 w-6 rounded-md bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
          <Zap className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-[13px] font-semibold tracking-tight text-white/90">Massive Number</span>
        <span className="text-[10px] font-medium text-emerald-400/80 bg-emerald-400/10 px-1.5 py-0.5 rounded">v2.0</span>
      </div>

      {/* Center: Active model */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-1.5 text-[11px] text-white/40">
          <Sparkles className="h-3 w-3 text-amber-400/60" />
          <span>{activeModel?.name || 'Auto'}</span>
          <span className="text-white/20">·</span>
          <span>{models.filter(m => m.enabled).length} models</span>
        </div>
      </div>

      {/* Right: Time */}
      <div className="flex items-center gap-2 text-[11px] text-white/30 font-mono tabular-nums">
        <span>{time}</span>
      </div>
    </div>
  );
}

// ── Sidebar ──────────────────────────────────────────────────────────────

function Sidebar({
  activeView,
  onViewChange,
}: {
  activeView: PanelView;
  onViewChange: (view: PanelView) => void;
}) {
  const { chats } = useChatStore();
  const { isRunning } = useAgentStore();

  return (
    <div className="flex flex-col w-12 border-r border-white/[0.06] bg-[#0a0a0a] py-2 shrink-0">
      {/* Logo */}
      <div className="flex justify-center mb-3">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
          <Zap className="h-4 w-4 text-white" />
        </div>
      </div>

      <div className="w-6 mx-auto h-px bg-white/[0.06] mb-2" />

      {/* Nav sections */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col items-center gap-0.5 px-1.5">
          {NAV_SECTIONS.map((section, si) => (
            <div key={section.label} className="w-full">
              {si > 0 && <div className="w-6 mx-auto h-px bg-white/[0.06] my-1.5" />}
              {section.items.map((item) => {
                const isActive = activeView === item.id;
                const Icon = item.icon;
                return (
                  <TooltipProvider key={item.id} delayDuration={400}>
                    <Tooltip side="right" disableHoverableContent>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => onViewChange(item.id)}
                          className={`relative w-full h-9 rounded-lg flex items-center justify-center transition-all duration-150 ${
                            isActive
                              ? 'bg-white/[0.08] text-white'
                              : 'text-white/30 hover:bg-white/[0.04] hover:text-white/60'
                          }`}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="sidebar-active"
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gradient-to-b from-amber-400 to-orange-500 rounded-r-full"
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                          )}
                          <Icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2 : 1.5} />
                          {/* Status dots */}
                          {item.id === 'chat' && chats.length > 0 && (
                            <span className="absolute top-1 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 ring-2 ring-[#0a0a0a]" />
                          )}
                          {item.id === 'agent' && isRunning && (
                            <span className="absolute top-1 right-1.5 h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse ring-2 ring-[#0a0a0a]" />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" sideOffset={6} className="flex items-center gap-2">
                        <span className="text-xs font-medium">{item.label}</span>
                        {item.shortcut && (
                          <kbd className="text-[9px] font-mono bg-white/10 px-1 py-0.5 rounded text-white/50">{item.shortcut}</kbd>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Bottom: Settings */}
      <div className="flex flex-col items-center gap-1 px-1.5">
        <div className="w-6 h-px bg-white/[0.06] mb-1" />
        <TooltipProvider delayDuration={400}>
          <Tooltip side="right" disableHoverableContent>
            <TooltipTrigger asChild>
              <button
                onClick={() => onViewChange('settings')}
                className={`w-full h-9 rounded-lg flex items-center justify-center transition-all duration-150 ${
                  activeView === 'settings'
                    ? 'bg-white/[0.08] text-white'
                    : 'text-white/30 hover:bg-white/[0.04] hover:text-white/60'
                }`}
              >
                <Settings className="h-[18px] w-[18px]" strokeWidth={activeView === 'settings' ? 2 : 1.5} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={6} className="flex items-center gap-2">
              <span className="text-xs font-medium">Settings</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

// ── Panel Router ─────────────────────────────────────────────────────────

function PanelContent({ view, onLaunchSurface }: { view: PanelView; onLaunchSurface?: (surface: Record<string, unknown>, targetPanel: string) => void }) {
  const getPanel = (): React.ReactNode => {
    switch (view) {
      case 'chat': return <panels.ChatPanel />;
      case 'editor': return <panels.EditorPanel />;
      case 'agent': return <panels.AgentPanel />;
      case 'search': return <panels.SearchPanel />;
      case 'terminal': return <panels.TerminalPanel />;
      case 'files': return <panels.FileExplorer />;
      case 'settings': return <panels.SettingsPanel />;
      case 'mcp': return <panels.MCPHub />;
      case 'git': return <panels.GitPanel />;
      case 'collab': return <panels.CollabPanel />;
      case 'spec': return <panels.SpecPanel />;
      case 'marketplace': return <panels.MarketplacePanel />;
      case 'competitive': return <panels.CompetitivePanel />;
      case 'templates': return <panels.TemplatesPanel />;
      case 'notifications': return <panels.NotificationsPanel />;
      case 'customization': return <panels.CustomizationHub />;
      case 'context': return <panels.ContextMemory />;
      case 'account': return <panels.AccountPanel />;
      case 'history': return <panels.HistoryPanel />;
      case 'library': return <panels.LibraryPanel />;
      case 'dev-surfaces': return <panels.DevSurfacesPanel onLaunchSurface={onLaunchSurface} />;
      case 'improvement': return <panels.ImprovementPanel />;
      default: return null;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={view}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12 }}
        className="h-full"
      >
        <PanelErrorBoundary name={view}>
          {getPanel()}
        </PanelErrorBoundary>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Status Bar ───────────────────────────────────────────────────────────

function StatusBar() {
  const { chats } = useChatStore();
  const { agents } = useAgentStore();
  const { models, selectedModel } = useModelStore();
  const activeModel = models.find(m => m.id === selectedModel);

  return (
    <div className="flex items-center h-7 px-3 border-t border-white/[0.06] bg-[#0a0a0a] text-[10px] select-none shrink-0">
      <div className="flex items-center gap-3 text-white/35">
        {/* Brand */}
        <span className="flex items-center gap-1 text-amber-400/70 font-medium">
          <Zap className="h-2.5 w-2.5" />
          MASSIVE
        </span>

        <Separator orientation="vertical" className="h-3 bg-white/[0.06]" />

        {/* Model */}
        <span className="flex items-center gap-1">
          <Sparkles className="h-2.5 w-2.5 text-emerald-400/60" />
          {activeModel?.name || 'Auto'}
        </span>

        {/* Stats */}
        <span>{models.filter(m => m.enabled).length} models</span>
        <span>{chats.length} chats</span>
        <span>{agents.length} agents</span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-3 text-white/25">
        <span className="text-emerald-400/50">10 surfaces</span>
        <span>$0.00</span>
      </div>
    </div>
  );
}

// ── Command Palette (inline lightweight version) ──────────────────────────

function QuickCommandPalette({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState('');

  if (!open) return null;

  const filtered = ALL_ITEMS.filter(item =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.1 }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
      onClick={() => onOpenChange(false)}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-[#111] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 h-12 border-b border-white/[0.06]">
          <Search className="h-4 w-4 text-white/30 shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search panels..."
            className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/25 outline-none"
          />
          <kbd className="text-[9px] font-mono text-white/20 bg-white/[0.05] px-1.5 py-0.5 rounded">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-white/25 text-xs">No results</div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelect(item.id);
                    onOpenChange(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-white/[0.05] transition-colors group"
                >
                  <Icon className="h-4 w-4 text-white/30 group-hover:text-white/60 shrink-0" />
                  <span className="text-sm text-white/70 group-hover:text-white/90">{item.label}</span>
                  {item.shortcut && (
                    <kbd className="ml-auto text-[9px] font-mono text-white/15 bg-white/[0.04] px-1.5 py-0.5 rounded">
                      {item.shortcut}
                    </kbd>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 h-8 border-t border-white/[0.06] text-[9px] text-white/20">
          <span>Navigate</span>
          <span>↑↓</span>
          <span>Open</span>
          <span>↵</span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────

export default function Home() {
  const [activeView, setActiveView] = useState<PanelView>('chat');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
        return;
      }

      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        const numKey = parseInt(e.key);
        if (numKey >= 1 && numKey <= ALL_ITEMS.filter(i => i.shortcut).length) {
          const shortcutItems = ALL_ITEMS.filter(i => i.shortcut);
          const target = shortcutItems[numKey - 1];
          if (target) setActiveView(target.id);
        }
      }

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

  const handleCommandSelect = useCallback((viewId: string) => {
    setActiveView(viewId as PanelView);
    setCommandPaletteOpen(false);
  }, []);

  // Get current panel label for the breadcrumb
  const currentPanel = ALL_ITEMS.find(i => i.id === activeView);

  return (
    <div className="flex flex-col h-screen bg-[#09090b] text-white overflow-hidden">
      {/* Title bar */}
      <TitleBar />

      {/* Main area */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <Sidebar activeView={activeView} onViewChange={handleViewChange} />

        {/* Main content */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Panel breadcrumb header */}
          <div className="flex items-center h-9 px-4 border-b border-white/[0.06] bg-[#0d0d0f] shrink-0">
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-white/25">Panels</span>
              <ChevronDown className="h-3 w-3 text-white/15 -rotate-90" />
              <span className="text-white/70 font-medium">{currentPanel?.label || 'Unknown'}</span>
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-1">
              <TooltipProvider delayDuration={400}>
                <Tooltip disableHoverableContent>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setCommandPaletteOpen(true)}
                      className="h-6 px-2 rounded-md flex items-center gap-1.5 text-white/25 hover:text-white/40 hover:bg-white/[0.04] transition-colors"
                    >
                      <Search className="h-3 w-3" />
                      <span className="text-[10px]">Search</span>
                      <kbd className="text-[8px] font-mono bg-white/[0.05] px-1 py-0.5 rounded ml-1">⌘K</kbd>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Open command palette</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Panel content */}
          <div className="flex-1 min-h-0">
            <PanelContent
              view={activeView}
              onLaunchSurface={(surface, targetPanel) => {
                setActiveView(targetPanel as PanelView);
              }}
            />
          </div>
        </div>
      </div>

      {/* Status bar */}
      <StatusBar />

      {/* Command palette */}
      <AnimatePresence>
        {commandPaletteOpen && (
          <QuickCommandPalette
            key={commandPaletteOpen ? 'open' : 'closed'}
            open={commandPaletteOpen}
            onOpenChange={setCommandPaletteOpen}
            onSelect={handleCommandSelect}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
