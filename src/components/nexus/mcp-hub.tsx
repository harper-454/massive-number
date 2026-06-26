'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Github,
  Database,
  CreditCard,
  AlertTriangle,
  List,
  FileText,
  Container,
  Cloud,
  Triangle,
  Hash,
  Folder,
  Globe,
  Search,
  Plug,
  ChevronDown,
  ChevronRight,
  Zap,
  Play,
  Server,
  X,
  Check,
  Clock,
  Loader2,
  Link2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ───────────────────────────────────────────────────────────────

type Category =
  | 'All'
  | 'Version Control'
  | 'Database'
  | 'Cloud'
  | 'DevOps'
  | 'Productivity'
  | 'Communication'
  | 'Automation'
  | 'Payments'
  | 'Monitoring'
  | 'Project Management'
  | 'Deployment'
  | 'System';

type HealthStatus = 'healthy' | 'degraded' | 'error';

interface MCPTool {
  name: string;
  description: string;
  sampleOutput?: string;
}

interface MCPServer {
  id: string;
  name: string;
  description: string;
  category: Category;
  icon: React.ElementType;
  toolCount: number;
  connected: boolean;
  health: HealthStatus;
  lastConnected: number | null; // minutes ago
  popular?: boolean;
  tools: MCPTool[];
}

interface ToolExecution {
  toolName: string;
  serverId: string;
  status: 'running' | 'success' | 'error';
  output: string;
  duration?: number;
}

// ── Icon map ────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  github: Github,
  database: Database,
  creditcard: CreditCard,
  alerttriangle: AlertTriangle,
  list: List,
  filetext: FileText,
  container: Container,
  cloud: Cloud,
  triangle: Triangle,
  hash: Hash,
  folder: Folder,
  globe: Globe,
  server: Server,
  plug: Plug,
};

function getIcon(iconName: string): React.ElementType {
  return ICON_MAP[iconName?.toLowerCase()] || Server;
}

// ── Categories (config, not data) ─────────────────────────────────────────

const CATEGORIES: Category[] = [
  'All',
  'Version Control',
  'Database',
  'Cloud',
  'DevOps',
  'Productivity',
  'Communication',
  'Automation',
  'Payments',
  'Monitoring',
  'Project Management',
  'Deployment',
  'System',
];

// ── Component ───────────────────────────────────────────────────────────

export function MCPHub() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category>('All');
  const [expandedServer, setExpandedServer] = useState<string | null>(null);
  const [toolExecutions, setToolExecutions] = useState<Record<string, ToolExecution>>({});
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [serverStates, setServerStates] = useState<Record<string, boolean>>({});
  const [serverLastConnected, setServerLastConnected] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/mcp')
      .then(res => res.json())
      .then(data => {
        const mapped = (data.servers || []).map((s: { id: string; name: string; description: string; category: string; icon: string; tools: Array<{ name: string; description: string; sampleOutput?: string }>; connected: boolean; health: string; lastConnectedAt: string | null }) => ({
          id: s.id,
          name: s.name,
          description: s.description || '',
          category: s.category as Category,
          icon: getIcon(s.icon || 'server'),
          toolCount: s.tools?.length || 0,
          connected: s.connected,
          health: (s.health || 'healthy') as HealthStatus,
          lastConnected: s.lastConnectedAt ? Math.floor((Date.now() - new Date(s.lastConnectedAt).getTime()) / 60000) : null,
          tools: (s.tools || []).map((t: { name: string; description: string; sampleOutput?: string }) => ({
            name: t.name,
            description: t.description,
            sampleOutput: t.sampleOutput,
          })),
        }));
        setServers(mapped);
        // Initialize server states from fetched data
        const initialStates: Record<string, boolean> = {};
        const initialLastConnected: Record<string, number> = {};
        mapped.forEach((s: MCPServer) => {
          initialStates[s.id] = s.connected;
          if (s.lastConnected !== null) initialLastConnected[s.id] = s.lastConnected;
        });
        setServerStates(initialStates);
        setServerLastConnected(initialLastConnected);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredServers = useMemo(() => {
    return servers.filter((s) => {
      const matchesCategory = category === 'All' || s.category === category;
      const matchesSearch =
        search === '' ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase()) ||
        s.tools.some((t) => t.name.toLowerCase().includes(search.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [search, category, servers]);

  const connectedCount = Object.values(serverStates).filter(Boolean).length;
  const availableCount = servers.length;
  const totalTools = servers.reduce((sum, s) => sum + s.toolCount, 0);

  const toggleConnection = useCallback((id: string) => {
    setServerStates((prev) => {
      const newState = !prev[id];
      if (newState) {
        setServerLastConnected((lc) => ({ ...lc, [id]: 0 }));
      }
      return { ...prev, [id]: newState };
    });
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setExpandedServer((prev) => (prev === id ? null : id));
  }, []);

  const batchConnectPopular = useCallback(() => {
    const popularIds = servers.filter((s) => s.popular).map((s) => s.id);
    setServerStates((prev) => {
      const next = { ...prev };
      popularIds.forEach((id) => {
        next[id] = true;
      });
      return next;
    });
    setServerLastConnected((prev) => {
      const next = { ...prev };
      popularIds.forEach((id) => {
        next[id] = 0;
      });
      return next;
    });
  }, [servers]);

  const runTool = useCallback((serverId: string, tool: MCPTool) => {
    const key = `${serverId}-${tool.name}`;
    setToolExecutions((prev) => ({
      ...prev,
      [key]: {
        toolName: tool.name,
        serverId,
        status: 'running',
        output: '',
      },
    }));

    // Simulate execution
    setTimeout(() => {
      setToolExecutions((prev) => ({
        ...prev,
        [key]: {
          toolName: tool.name,
          serverId,
          status: 'success',
          output: tool.sampleOutput || `✓ ${tool.name} executed successfully\n  Duration: ${Math.floor(Math.random() * 200 + 50)}ms`,
          duration: Math.floor(Math.random() * 200 + 50),
        },
      }));
    }, 800 + Math.random() * 600);
  }, []);

  const getHealthColor = (serverId: string, isConnected: boolean) => {
    if (!isConnected) return '';
    const server = servers.find((s) => s.id === serverId);
    if (!server) return '';
    switch (server.health) {
      case 'healthy': return 'bg-emerald-400';
      case 'degraded': return 'bg-amber-400';
      case 'error': return 'bg-red-400';
      default: return 'bg-emerald-400';
    }
  };

  const getHealthTooltip = (serverId: string) => {
    const server = servers.find((s) => s.id === serverId);
    if (!server) return '';
    switch (server.health) {
      case 'healthy': return 'Healthy';
      case 'degraded': return 'Degraded';
      case 'error': return 'Error';
      default: return 'Healthy';
    }
  };

  const formatLastConnected = (minutes: number | undefined) => {
    if (minutes === undefined) return 'Never';
    if (minutes === 0) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return `${Math.floor(minutes / 1440)}d ago`;
  };

  // Get connected servers with their last connected times for the footer
  const connectedServers = useMemo(() => {
    return servers.filter((s) => serverStates[s.id]);
  }, [servers, serverStates]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <Plug className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">MCP Integration Hub</h2>
              <p className="text-[10px] text-muted-foreground">Connect and manage your tool servers</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-[9px] px-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              onClick={batchConnectPopular}
            >
              <Link2 className="h-3 w-3 mr-1" />
              Connect All Popular
            </Button>
            <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-400 gap-1">
              <Zap className="h-2.5 w-2.5" />
              {connectedCount} connected
            </Badge>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search servers and tools..."
            className="pl-8 h-8 text-xs bg-card/50"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2"
            >
              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        {/* Category filters */}
        <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition-colors shrink-0 ${
                category === cat
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-muted/50 text-muted-foreground hover:text-foreground border border-transparent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <Separator className="shrink-0" />

      {/* Server Grid */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AnimatePresence>
            {filteredServers.map((server) => {
              const isConnected = serverStates[server.id] ?? false;
              const isExpanded = expandedServer === server.id;
              const Icon = server.icon;
              const healthDot = getHealthColor(server.id, isConnected);
              const healthLabel = getHealthTooltip(server.id);

              return (
                <motion.div
                  key={server.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className={`rounded-lg border transition-colors ${
                    isConnected
                      ? 'border-emerald-500/40 bg-emerald-500/5'
                      : 'border-border bg-card/50'
                  }`}
                >
                  {/* Card Header */}
                  <div
                    className="p-3 cursor-pointer"
                    onClick={() => toggleExpand(server.id)}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 relative ${
                          isConnected
                            ? 'bg-emerald-500/15'
                            : 'bg-muted/50'
                        }`}
                      >
                        <Icon
                          className={`h-4.5 w-4.5 ${
                            isConnected ? 'text-emerald-400' : 'text-muted-foreground'
                          }`}
                        />
                        {/* Health indicator dot */}
                        {healthDot && (
                          <span
                            className={`absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ${healthDot} ring-2 ring-background`}
                            title={healthLabel}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold truncate">{server.name}</span>
                          {isConnected && (
                            <Badge className="text-[8px] h-4 px-1.5 bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20">
                              Connected
                            </Badge>
                          )}
                          {server.popular && (
                            <Badge variant="secondary" className="text-[7px] h-3.5 px-1 bg-amber-500/15 text-amber-500 border-amber-500/20">
                              Popular
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-[8px] h-4 px-1.5 ml-auto shrink-0">
                            {server.category}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                          {server.description}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                            <Server className="h-2.5 w-2.5" />
                            {server.toolCount} tools
                          </span>
                          {isConnected && serverLastConnected[server.id] !== undefined && (
                            <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5" />
                              {formatLastConnected(serverLastConnected[server.id])}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Toggle + Expand indicator */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={isConnected}
                          onCheckedChange={() => toggleConnection(server.id)}
                          className="scale-75"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="text-[9px] text-muted-foreground">
                          {isConnected ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <span className="text-[9px]">{isExpanded ? 'Hide' : 'Tools'}</span>
                        {isExpanded ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Tools */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 space-y-1.5">
                          <Separator className="mb-2" />
                          {server.tools.map((tool) => {
                            const execKey = `${server.id}-${tool.name}`;
                            const execution = toolExecutions[execKey];

                            return (
                              <div key={tool.name}>
                                <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors group">
                                  <div className="h-5 w-5 rounded bg-card/80 flex items-center justify-center shrink-0">
                                    <Zap className="h-2.5 w-2.5 text-amber-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-[10px] font-mono font-medium">
                                      {tool.name}
                                    </span>
                                    <p className="text-[9px] text-muted-foreground truncate">
                                      {tool.description}
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-5 px-1.5 text-[8px] opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                    disabled={!isConnected || execution?.status === 'running'}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      runTool(server.id, tool);
                                    }}
                                  >
                                    {execution?.status === 'running' ? (
                                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                    ) : (
                                      <Play className="h-2 w-2 mr-0.5" />
                                    )}
                                    {execution?.status === 'running' ? 'Running' : 'Run'}
                                  </Button>
                                </div>

                                {/* Tool Output Viewer */}
                                <AnimatePresence>
                                  {execution && execution.status !== 'running' && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="mt-1 ml-7 p-2 rounded-md bg-card/80 border border-border/40">
                                        <div className="flex items-center gap-1.5 mb-1">
                                          {execution.status === 'success' ? (
                                            <Check className="h-3 w-3 text-emerald-400" />
                                          ) : (
                                            <X className="h-3 w-3 text-red-400" />
                                          )}
                                          <span className="text-[8px] font-medium text-muted-foreground">
                                            Output{execution.duration ? ` (${execution.duration}ms)` : ''}
                                          </span>
                                        </div>
                                        <pre className="text-[9px] font-mono text-foreground/80 whitespace-pre-wrap break-words leading-relaxed">
                                          {execution.output}
                                        </pre>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {servers.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Plug className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-xs">No MCP servers connected. Connect a server to get started.</p>
          </div>
        )}
        {filteredServers.length === 0 && servers.length > 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Search className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-xs">No servers match your search</p>
          </div>
        )}
      </ScrollArea>

      <Separator className="shrink-0" />

      {/* Stats Footer with Connection Stats */}
      <div className="shrink-0 px-4 py-2 bg-card/30">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Check className="h-2.5 w-2.5 text-emerald-400" />
              {connectedCount} connected
            </span>
            <span className="flex items-center gap-1">
              <Server className="h-2.5 w-2.5" />
              {availableCount} available
            </span>
            <span className="flex items-center gap-1">
              <Zap className="h-2.5 w-2.5 text-amber-400" />
              {totalTools} total tools
            </span>
          </div>
        </div>
        {/* Connection Stats: Last connected for each connected server */}
        {connectedServers.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[8px] text-muted-foreground/70">
            {connectedServers.map((s) => (
              <span key={s.id} className="flex items-center gap-1">
                <span className={`h-1.5 w-1.5 rounded-full ${getHealthColor(s.id, true)}`} />
                {s.name.replace(' MCP', '')}: {formatLastConnected(serverLastConnected[s.id])}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
