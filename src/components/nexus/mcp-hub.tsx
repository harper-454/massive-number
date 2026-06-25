'use client';

import { useState, useMemo } from 'react';
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

interface MCPTool {
  name: string;
  description: string;
}

interface MCPServer {
  id: string;
  name: string;
  description: string;
  category: Category;
  icon: React.ElementType;
  toolCount: number;
  connected: boolean;
  tools: MCPTool[];
}

// ── Data ────────────────────────────────────────────────────────────────

const CATEGORIES: Category[] = [
  'All',
  'Version Control',
  'Database',
  'Cloud',
  'DevOps',
  'Productivity',
  'Communication',
  'Automation',
];

const SERVERS: MCPServer[] = [
  {
    id: 'github',
    name: 'GitHub MCP',
    description: 'Full GitHub integration — PRs, issues, repositories, and code reviews.',
    category: 'Version Control',
    icon: Github,
    toolCount: 12,
    connected: false,
    tools: [
      { name: 'create_pr', description: 'Create a pull request with diff' },
      { name: 'list_issues', description: 'List repository issues with filters' },
      { name: 'search_code', description: 'Search code across repositories' },
      { name: 'create_issue', description: 'Create a new issue' },
      { name: 'review_pr', description: 'AI-powered PR review' },
      { name: 'merge_pr', description: 'Merge a pull request' },
      { name: 'list_repos', description: 'List user repositories' },
      { name: 'get_file', description: 'Get file contents from repo' },
      { name: 'create_branch', description: 'Create a new branch' },
      { name: 'list_commits', description: 'List commits on a branch' },
      { name: 'create_release', description: 'Create a GitHub release' },
      { name: 'manage_actions', description: 'Trigger and monitor GitHub Actions' },
    ],
  },
  {
    id: 'postgres',
    name: 'PostgreSQL MCP',
    description: 'Direct PostgreSQL database access — query, migrate, and inspect schemas.',
    category: 'Database',
    icon: Database,
    toolCount: 8,
    connected: false,
    tools: [
      { name: 'query', description: 'Execute SQL query' },
      { name: 'list_tables', description: 'List all tables in schema' },
      { name: 'describe_table', description: 'Show table structure' },
      { name: 'migrate', description: 'Run database migration' },
      { name: 'seed', description: 'Seed database with fixtures' },
      { name: 'backup', description: 'Create database backup' },
      { name: 'explain', description: 'EXPLAIN query plan' },
      { name: 'stats', description: 'Database size and stats' },
    ],
  },
  {
    id: 'stripe',
    name: 'Stripe MCP',
    description: 'Payment processing — customers, subscriptions, invoices, and disputes.',
    category: 'Payments',
    icon: CreditCard,
    toolCount: 6,
    connected: false,
    tools: [
      { name: 'create_customer', description: 'Create a Stripe customer' },
      { name: 'list_invoices', description: 'List recent invoices' },
      { name: 'create_subscription', description: 'Create a subscription plan' },
      { name: 'handle_dispute', description: 'Respond to payment disputes' },
      { name: 'get_balance', description: 'Get account balance' },
      { name: 'refund', description: 'Process a refund' },
    ],
  },
  {
    id: 'sentry',
    name: 'Sentry MCP',
    description: 'Error monitoring — track issues, resolve bugs, and analyze stack traces.',
    category: 'Monitoring',
    icon: AlertTriangle,
    toolCount: 5,
    connected: false,
    tools: [
      { name: 'list_issues', description: 'List error issues' },
      { name: 'get_issue', description: 'Get issue details and stacktrace' },
      { name: 'resolve_issue', description: 'Mark issue as resolved' },
      { name: 'list_projects', description: 'List Sentry projects' },
      { name: 'create_release', description: 'Track deployment release' },
    ],
  },
  {
    id: 'linear',
    name: 'Linear MCP',
    description: 'Project management — tasks, cycles, teams, and workflow automation.',
    category: 'Project Management',
    icon: List,
    toolCount: 7,
    connected: false,
    tools: [
      { name: 'create_task', description: 'Create a Linear task' },
      { name: 'list_tasks', description: 'List tasks with filters' },
      { name: 'update_status', description: 'Update task status' },
      { name: 'list_cycles', description: 'List active cycles' },
      { name: 'add_comment', description: 'Add comment to task' },
      { name: 'list_teams', description: 'List team members' },
      { name: 'search', description: 'Search tasks and projects' },
    ],
  },
  {
    id: 'notion',
    name: 'Notion MCP',
    description: 'Knowledge management — pages, databases, and team wikis.',
    category: 'Productivity',
    icon: FileText,
    toolCount: 6,
    connected: false,
    tools: [
      { name: 'search', description: 'Search Notion pages' },
      { name: 'get_page', description: 'Get page content' },
      { name: 'create_page', description: 'Create a new page' },
      { name: 'update_page', description: 'Update page properties' },
      { name: 'query_db', description: 'Query a Notion database' },
      { name: 'append_blocks', description: 'Append content blocks' },
    ],
  },
  {
    id: 'docker',
    name: 'Docker MCP',
    description: 'Container orchestration — build, run, and manage Docker containers.',
    category: 'DevOps',
    icon: Container,
    toolCount: 7,
    connected: false,
    tools: [
      { name: 'build', description: 'Build Docker image' },
      { name: 'run', description: 'Run a container' },
      { name: 'list_containers', description: 'List running containers' },
      { name: 'logs', description: 'Get container logs' },
      { name: 'compose_up', description: 'Run docker compose up' },
      { name: 'compose_down', description: 'Run docker compose down' },
      { name: 'prune', description: 'Remove unused resources' },
    ],
  },
  {
    id: 'aws',
    name: 'AWS MCP',
    description: 'Amazon Web Services — S3, Lambda, EC2, CloudFormation, and more.',
    category: 'Cloud',
    icon: Cloud,
    toolCount: 10,
    connected: false,
    tools: [
      { name: 'list_s3', description: 'List S3 buckets' },
      { name: 'upload_s3', description: 'Upload file to S3' },
      { name: 'invoke_lambda', description: 'Invoke Lambda function' },
      { name: 'list_ec2', description: 'List EC2 instances' },
      { name: 'deploy_cf', description: 'Deploy CloudFormation stack' },
      { name: 'get_logs', description: 'Get CloudWatch logs' },
      { name: 'list_functions', description: 'List Lambda functions' },
      { name: 'manage_iam', description: 'Manage IAM policies' },
      { name: 'rds_status', description: 'Check RDS instance status' },
      { name: 'cost_report', description: 'Get cost and usage report' },
    ],
  },
  {
    id: 'vercel',
    name: 'Vercel MCP',
    description: 'Deployment platform — deploys, domains, serverless functions, and edge.',
    category: 'Deployment',
    icon: Triangle,
    toolCount: 5,
    connected: false,
    tools: [
      { name: 'deploy', description: 'Trigger a deployment' },
      { name: 'list_deploys', description: 'List recent deployments' },
      { name: 'get_deploy', description: 'Get deployment details' },
      { name: 'manage_domains', description: 'Configure custom domains' },
      { name: 'env_vars', description: 'Manage environment variables' },
    ],
  },
  {
    id: 'slack',
    name: 'Slack MCP',
    description: 'Team communication — send messages, manage channels, and read threads.',
    category: 'Communication',
    icon: Hash,
    toolCount: 6,
    connected: false,
    tools: [
      { name: 'send_message', description: 'Send message to channel' },
      { name: 'list_channels', description: 'List workspace channels' },
      { name: 'get_thread', description: 'Read message thread' },
      { name: 'search_messages', description: 'Search messages' },
      { name: 'set_status', description: 'Set user status' },
      { name: 'upload_file', description: 'Upload file to channel' },
    ],
  },
  {
    id: 'filesystem',
    name: 'Filesystem MCP',
    description: 'Local file system access — read, write, search, and manage files.',
    category: 'System',
    icon: Folder,
    toolCount: 8,
    connected: true,
    tools: [
      { name: 'read_file', description: 'Read file contents' },
      { name: 'write_file', description: 'Write content to file' },
      { name: 'list_dir', description: 'List directory contents' },
      { name: 'search_files', description: 'Search files by pattern' },
      { name: 'create_dir', description: 'Create directory' },
      { name: 'move_file', description: 'Move or rename file' },
      { name: 'delete_file', description: 'Delete a file' },
      { name: 'get_info', description: 'Get file metadata' },
    ],
  },
  {
    id: 'puppeteer',
    name: 'Puppeteer MCP',
    description: 'Browser automation — scrape, screenshot, and interact with web pages.',
    category: 'Automation',
    icon: Globe,
    toolCount: 5,
    connected: false,
    tools: [
      { name: 'navigate', description: 'Navigate to URL' },
      { name: 'screenshot', description: 'Capture page screenshot' },
      { name: 'click', description: 'Click element on page' },
      { name: 'extract', description: 'Extract data from page' },
      { name: 'fill_form', description: 'Fill and submit forms' },
    ],
  },
];

// ── Component ───────────────────────────────────────────────────────────

export function MCPHub() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category>('All');
  const [expandedServer, setExpandedServer] = useState<string | null>(null);
  const [serverStates, setServerStates] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    SERVERS.forEach((s) => {
      initial[s.id] = s.connected;
    });
    return initial;
  });

  const filteredServers = useMemo(() => {
    return SERVERS.filter((s) => {
      const matchesCategory = category === 'All' || s.category === category;
      const matchesSearch =
        search === '' ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase()) ||
        s.tools.some((t) => t.name.toLowerCase().includes(search.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [search, category]);

  const connectedCount = Object.values(serverStates).filter(Boolean).length;
  const availableCount = SERVERS.length;
  const totalTools = SERVERS.reduce((sum, s) => sum + s.toolCount, 0);

  const toggleConnection = (id: string) => {
    setServerStates((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleExpand = (id: string) => {
    setExpandedServer((prev) => (prev === id ? null : id));
  };

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
          <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-400 gap-1">
            <Zap className="h-2.5 w-2.5" />
            {connectedCount} connected
          </Badge>
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
                        className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
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
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold truncate">{server.name}</span>
                          {isConnected && (
                            <Badge className="text-[8px] h-4 px-1.5 bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20">
                              Connected
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
                          {server.tools.map((tool) => (
                            <div
                              key={tool.name}
                              className="flex items-center gap-2 p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors group"
                            >
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
                                disabled={!isConnected}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Play className="h-2 w-2 mr-0.5" />
                                Run
                              </Button>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredServers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Search className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-xs">No servers match your search</p>
          </div>
        )}
      </ScrollArea>

      <Separator className="shrink-0" />

      {/* Stats Footer */}
      <div className="shrink-0 px-4 py-2 flex items-center justify-between text-[10px] text-muted-foreground bg-card/30">
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
    </div>
  );
}
