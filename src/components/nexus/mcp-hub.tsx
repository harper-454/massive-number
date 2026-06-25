'use client';

import { useState, useMemo, useCallback } from 'react';
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
    health: 'healthy',
    lastConnected: null,
    popular: true,
    tools: [
      { name: 'create_pr', description: 'Create a pull request with diff', sampleOutput: '✓ Pull request #42 created: "feat: add dark mode support"\n→ https://github.com/org/repo/pull/42\n  Branch: feature/dark-mode → main\n  Files changed: 8 | +234 −56' },
      { name: 'list_issues', description: 'List repository issues with filters', sampleOutput: 'Found 12 open issues:\n  #38 - Fix authentication timeout [bug, priority:high]\n  #35 - Add export functionality [feature]\n  #31 - Update API docs [docs]\n  ...9 more' },
      { name: 'search_code', description: 'Search code across repositories', sampleOutput: 'Search results for "useAuth":\n  src/hooks/useAuth.ts (exact match)\n  src/components/Login.tsx (2 references)\n  src/pages/Dashboard.tsx (1 reference)' },
      { name: 'create_issue', description: 'Create a new issue', sampleOutput: '✓ Issue #39 created: "Bug: Login fails on mobile"\n  Labels: bug, priority:high\n  Assignee: @developer' },
      { name: 'review_pr', description: 'AI-powered PR review', sampleOutput: "AI Review Summary:\n  ⚠ 2 potential issues found:\n    - L14: Unused import 'useState'\n    - L42: Missing error handling\n  ✓ 3 suggestions:\n    - Consider using useCallback\n    - Extract helper function" },
      { name: 'merge_pr', description: 'Merge a pull request', sampleOutput: '✓ PR #40 merged successfully\n  Merge strategy: squash\n  Commit: abc1234 "feat: add user profiles"' },
      { name: 'list_repos', description: 'List user repositories', sampleOutput: 'Found 15 repositories:\n  org/main-app (⭐ 234, TypeScript)\n  org/api-service (⭐ 89, Go)\n  org/design-system (⭐ 56, React)' },
      { name: 'get_file', description: 'Get file contents from repo', sampleOutput: '📄 src/config.ts (1.2KB)\n---\nexport const config = {\n  apiUrl: process.env.API_URL,\n  timeout: 30000,\n};' },
      { name: 'create_branch', description: 'Create a new branch', sampleOutput: '✓ Branch created: feature/user-settings\n  Based on: main (abc1234)' },
      { name: 'list_commits', description: 'List commits on a branch', sampleOutput: 'Recent commits on main:\n  abc1234 feat: add user profiles (2h ago)\n  def5678 fix: auth timeout (5h ago)\n  ghi9012 chore: update deps (1d ago)' },
      { name: 'create_release', description: 'Create a GitHub release', sampleOutput: '✓ Release v2.1.0 created\n  Tag: v2.1.0\n  Title: "Major Performance Improvements"' },
      { name: 'manage_actions', description: 'Trigger and monitor GitHub Actions', sampleOutput: 'Workflow "CI" triggered: run #847\n  Status: ✅ Success (2m 34s)\n  Jobs: lint ✓ → test ✓ → build ✓' },
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
    health: 'healthy',
    lastConnected: null,
    popular: true,
    tools: [
      { name: 'query', description: 'Execute SQL query', sampleOutput: 'Query executed in 12ms\n  3 rows returned:\n  id | name         | email\n  1  | Alice Chen   | alice@example.com\n  2  | Bob Smith    | bob@example.com\n  3  | Carol Davis  | carol@example.com' },
      { name: 'list_tables', description: 'List all tables in schema', sampleOutput: 'Tables in "public" schema:\n  users (12,345 rows)\n  orders (89,012 rows)\n  products (1,234 rows)\n  sessions (45,678 rows)' },
      { name: 'describe_table', description: 'Show table structure', sampleOutput: 'Table "users":\n  id          UUID      PRIMARY KEY\n  email       VARCHAR   NOT NULL UNIQUE\n  name        VARCHAR   NOT NULL\n  created_at  TIMESTAMP DEFAULT NOW()\n  role        VARCHAR   DEFAULT \'user\'' },
      { name: 'migrate', description: 'Run database migration', sampleOutput: '✓ Migration 004_add_user_settings applied\n  - Added table "user_settings"\n  - Added column "preferences" to "users"\n  Duration: 890ms' },
      { name: 'seed', description: 'Seed database with fixtures', sampleOutput: '✓ Database seeded with fixtures\n  - 100 users created\n  - 500 orders created\n  - 50 products created' },
      { name: 'backup', description: 'Create database backup', sampleOutput: '✓ Backup created: db_backup_2024-01-15.sql.gz\n  Size: 23.4MB\n  Duration: 3.2s' },
      { name: 'explain', description: 'EXPLAIN query plan', sampleOutput: 'Query Plan:\n  Seq Scan on users (cost=0.00..12.50 rows=250)\n  Filter: (role = \'admin\')\n  → Index Scan using idx_users_role (cost=0.15..8.20 rows=50)' },
      { name: 'stats', description: 'Database size and stats', sampleOutput: 'Database "production":\n  Size: 2.3GB\n  Tables: 24 | Indexes: 38\n  Active connections: 12/100\n  Cache hit ratio: 98.7%' },
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
    health: 'healthy',
    lastConnected: null,
    tools: [
      { name: 'create_customer', description: 'Create a Stripe customer', sampleOutput: '✓ Customer created: cus_abc123\n  Email: alice@example.com\n  Name: Alice Chen' },
      { name: 'list_invoices', description: 'List recent invoices', sampleOutput: 'Recent invoices:\n  inv_001 - $49.99 [paid]\n  inv_002 - $99.99 [pending]\n  inv_003 - $24.99 [paid]' },
      { name: 'create_subscription', description: 'Create a subscription plan', sampleOutput: '✓ Subscription created: sub_xyz789\n  Plan: Pro ($49/mo)\n  Status: active\n  Next billing: Feb 1, 2024' },
      { name: 'handle_dispute', description: 'Respond to payment disputes', sampleOutput: 'Dispute dp_123 status: needs_response\n  Amount: $99.99\n  Evidence deadline: Jan 30, 2024' },
      { name: 'get_balance', description: 'Get account balance', sampleOutput: 'Account Balance:\n  Available: $12,345.67\n  Pending: $2,345.00\n  Currency: USD' },
      { name: 'refund', description: 'Process a refund', sampleOutput: '✓ Refund processed: re_abc456\n  Amount: $49.99\n  Reason: customer_request\n  Status: succeeded' },
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
    health: 'degraded',
    lastConnected: null,
    tools: [
      { name: 'list_issues', description: 'List error issues', sampleOutput: 'Active issues (7):\n  ERR-42: NullPointerException (234 events/hr)\n  ERR-38: TimeoutError (89 events/hr)\n  ERR-35: AuthException (12 events/hr)' },
      { name: 'get_issue', description: 'Get issue details and stacktrace', sampleOutput: 'Issue ERR-42:\n  Type: NullPointerException\n  File: src/auth/session.ts:42\n  First seen: 2h ago | Last seen: 5m ago\n  Affected users: 23' },
      { name: 'resolve_issue', description: 'Mark issue as resolved', sampleOutput: '✓ Issue ERR-42 marked as resolved\n  Release: v2.1.1\n  Commits: 2 linked' },
      { name: 'list_projects', description: 'List Sentry projects', sampleOutput: 'Projects:\n  main-app (23 open issues)\n  api-service (7 open issues)\n  admin-panel (2 open issues)' },
      { name: 'create_release', description: 'Track deployment release', sampleOutput: '✓ Release v2.1.1 created\n  Commits: 5 new\n  Issues resolved: 3' },
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
    health: 'healthy',
    lastConnected: null,
    tools: [
      { name: 'create_task', description: 'Create a Linear task', sampleOutput: '✓ Task ENG-234 created: "Fix auth timeout"\n  Priority: High | Assignee: @alice\n  Cycle: Sprint 12' },
      { name: 'list_tasks', description: 'List tasks with filters', sampleOutput: 'Tasks in Sprint 12:\n  ENG-234 Fix auth timeout [In Progress]\n  ENG-233 Add export feature [Todo]\n  ENG-232 Update docs [Done]' },
      { name: 'update_status', description: 'Update task status', sampleOutput: '✓ ENG-234 → In Progress\n  Updated by: @alice\n  Time in Todo: 2h 15m' },
      { name: 'list_cycles', description: 'List active cycles', sampleOutput: 'Active cycles:\n  Sprint 12 (Jan 15-28) - 67% complete\n  Sprint 13 (Jan 29-Feb 11) - Planned' },
      { name: 'add_comment', description: 'Add comment to task', sampleOutput: '✓ Comment added to ENG-234\n  "Root cause identified: token expiry misconfiguration"' },
      { name: 'list_teams', description: 'List team members', sampleOutput: 'Team members (8):\n  Alice Chen - Engineering Lead\n  Bob Smith - Senior Engineer\n  ...6 more' },
      { name: 'search', description: 'Search tasks and projects', sampleOutput: 'Results for "auth":\n  ENG-234 Fix auth timeout [In Progress]\n  ENG-198 Auth service refactor [Done]\n  ENG-167 Add SSO support [Done]' },
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
    health: 'healthy',
    lastConnected: null,
    tools: [
      { name: 'search', description: 'Search Notion pages', sampleOutput: 'Results for "roadmap":\n  📄 Q1 2024 Roadmap\n  📄 Product Strategy\n  📊 Feature Tracker Database' },
      { name: 'get_page', description: 'Get page content', sampleOutput: '📄 Q1 2024 Roadmap\n  Last edited: Jan 10, 2024\n  Content: [3 blocks] - heading, paragraph, list' },
      { name: 'create_page', description: 'Create a new page', sampleOutput: '✓ Page created: "Sprint 12 Retro Notes"\n  Parent: Team Wiki\n  URL: notion.so/page/abc123' },
      { name: 'update_page', description: 'Update page properties', sampleOutput: '✓ Page "Q1 Roadmap" updated\n  Status: In Progress → Complete' },
      { name: 'query_db', description: 'Query a Notion database', sampleOutput: 'Feature Tracker (12 results):\n  ✅ Dark Mode - Complete\n  🔄 API v2 - In Progress\n  ⏳ Mobile App - Planned' },
      { name: 'append_blocks', description: 'Append content blocks', sampleOutput: '✓ 3 blocks appended to "Sprint 12 Retro"\n  - Heading: "Action Items"\n  - List: 2 items added' },
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
    health: 'healthy',
    lastConnected: null,
    tools: [
      { name: 'build', description: 'Build Docker image', sampleOutput: 'Building image: myapp:latest\n  Step 1/8 : FROM node:20-alpine\n  Step 8/8 : CMD ["node", "server.js"]\n  ✓ Built in 45.2s (cache: 3 steps)' },
      { name: 'run', description: 'Run a container', sampleOutput: '✓ Container started: myapp_abc123\n  Image: myapp:latest\n  Port: 3000→3000\n  Status: running' },
      { name: 'list_containers', description: 'List running containers', sampleOutput: 'Running containers (3):\n  myapp_web    Up 2h   0.0.0.0:3000→3000\n  myapp_db     Up 2h   5432/tcp\n  myapp_redis  Up 2h   6379/tcp' },
      { name: 'logs', description: 'Get container logs', sampleOutput: 'Logs for myapp_web (last 10 lines):\n  [INFO] Server listening on :3000\n  [INFO] Connected to database\n  [WARN] Slow query: 450ms' },
      { name: 'compose_up', description: 'Run docker compose up', sampleOutput: '✓ docker compose up -d\n  Creating network "myapp_default"\n  Starting myapp_web... done\n  Starting myapp_db... done' },
      { name: 'compose_down', description: 'Run docker compose down', sampleOutput: '✓ docker compose down\n  Stopping myapp_web... done\n  Stopping myapp_db... done\n  Removing network "myapp_default"' },
      { name: 'prune', description: 'Remove unused resources', sampleOutput: '✓ Pruned:\n  Images: 3 reclaimed (1.2GB)\n  Containers: 0\n  Networks: 1' },
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
    health: 'healthy',
    lastConnected: null,
    tools: [
      { name: 'list_s3', description: 'List S3 buckets', sampleOutput: 'S3 Buckets (4):\n  myapp-prod-assets (2.3GB)\n  myapp-backups (12.1GB)\n  myapp-logs (890MB)\n  myapp-uploads (4.5GB)' },
      { name: 'upload_s3', description: 'Upload file to S3', sampleOutput: '✓ Uploaded to myapp-assets/build.js\n  Size: 234KB | Type: application/javascript\n  URL: https://myapp-assets.s3.amazonaws.com/build.js' },
      { name: 'invoke_lambda', description: 'Invoke Lambda function', sampleOutput: '✓ Lambda "process-order" invoked\n  Duration: 234ms\n  Memory: 128MB/256MB\n  Status: succeeded' },
      { name: 'list_ec2', description: 'List EC2 instances', sampleOutput: 'EC2 Instances (3):\n  i-abc123  t3.medium  running  us-east-1\n  i-def456  t3.small   stopped  us-east-1\n  i-ghi789  t3.large   running  us-west-2' },
      { name: 'deploy_cf', description: 'Deploy CloudFormation stack', sampleOutput: '✓ Stack "myapp-prod" updated\n  Status: UPDATE_COMPLETE\n  Changes: 2 modified, 0 added, 0 removed' },
      { name: 'get_logs', description: 'Get CloudWatch logs', sampleOutput: 'CloudWatch logs (last 5):\n  [INFO] Request processed in 45ms\n  [WARN] Rate limit approaching\n  [INFO] Cache hit ratio: 95.2%' },
      { name: 'list_functions', description: 'List Lambda functions', sampleOutput: 'Lambda Functions (5):\n  process-order (Python 3.11, 256MB)\n  send-email (Node 20, 128MB)\n  generate-report (Python 3.11, 512MB)' },
      { name: 'manage_iam', description: 'Manage IAM policies', sampleOutput: 'IAM Policies:\n  MyAppS3Access (attached: 2 roles)\n  MyAppLambdaInvoke (attached: 1 role)' },
      { name: 'rds_status', description: 'Check RDS instance status', sampleOutput: 'RDS "myapp-db":\n  Engine: PostgreSQL 15.4\n  Status: available\n  Connections: 23/100\n  Storage: 45GB/100GB' },
      { name: 'cost_report', description: 'Get cost and usage report', sampleOutput: 'Cost Report (last 30 days):\n  Total: $1,234.56\n  EC2: $567.89 | Lambda: $123.45\n  S3: $89.12 | RDS: $454.10' },
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
    health: 'healthy',
    lastConnected: null,
    tools: [
      { name: 'deploy', description: 'Trigger a deployment', sampleOutput: '✓ Deployment triggered: dpl_abc123\n  Branch: main | Commit: abc1234\n  Status: Building... (12s)' },
      { name: 'list_deploys', description: 'List recent deployments', sampleOutput: 'Recent deployments:\n  dpl_abc  main   ✅ Ready (2m ago)\n  dpl_def  feat/x 🔄 Building (30s ago)\n  dpl_ghi  main   ✅ Ready (1h ago)' },
      { name: 'get_deploy', description: 'Get deployment details', sampleOutput: 'Deployment dpl_abc123:\n  Status: ✅ Ready\n  Duration: 45s\n  URL: myapp-git-main.vercel.app' },
      { name: 'manage_domains', description: 'Configure custom domains', sampleOutput: 'Domains:\n  myapp.com → dpl_abc (✅ valid)\n  www.myapp.com → dpl_abc (✅ valid)' },
      { name: 'env_vars', description: 'Manage environment variables', sampleOutput: 'Environment variables (8):\n  DATABASE_URL [Production, Preview]\n  API_KEY [Production]\n  ...6 more' },
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
    health: 'error',
    lastConnected: null,
    tools: [
      { name: 'send_message', description: 'Send message to channel', sampleOutput: '✓ Message sent to #engineering\n  Timestamp: 1705312345.123456' },
      { name: 'list_channels', description: 'List workspace channels', sampleOutput: 'Channels (12):\n  #engineering (234 members)\n  #design (89 members)\n  #general (567 members)' },
      { name: 'get_thread', description: 'Read message thread', sampleOutput: 'Thread in #engineering (5 replies):\n  Alice: "PR #42 ready for review"\n  Bob: "Checking now..."\n  ...3 more' },
      { name: 'search_messages', description: 'Search messages', sampleOutput: 'Results for "deploy":\n  #engineering: "Deployed v2.1.0 to prod" (2h ago)\n  #devops: "CI pipeline fixed" (4h ago)' },
      { name: 'set_status', description: 'Set user status', sampleOutput: '✓ Status updated: 🎯 Focused | 2h' },
      { name: 'upload_file', description: 'Upload file to channel', sampleOutput: '✓ File uploaded to #design\n  Name: mockup-v2.fig\n  Size: 4.2MB' },
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
    health: 'healthy',
    lastConnected: 2,
    popular: true,
    tools: [
      { name: 'read_file', description: 'Read file contents', sampleOutput: '📄 src/app/page.tsx (2.1KB)\n---\nexport default function Page() {\n  return <div>Hello World</div>;\n}' },
      { name: 'write_file', description: 'Write content to file', sampleOutput: '✓ Written 1.2KB to src/config.ts\n  Lines: 34 | Encoding: UTF-8' },
      { name: 'list_dir', description: 'List directory contents', sampleOutput: 'src/ (6 items):\n  📁 components/  📁 lib/  📁 stores/\n  📄 app.tsx      📄 config.ts   📄 types.ts' },
      { name: 'search_files', description: 'Search files by pattern', sampleOutput: 'Results for "*.test.ts":\n  src/__tests__/auth.test.ts\n  src/__tests__/api.test.ts\n  2 files found' },
      { name: 'create_dir', description: 'Create directory', sampleOutput: '✓ Directory created: src/features/auth\n  Path: /home/user/project/src/features/auth' },
      { name: 'move_file', description: 'Move or rename file', sampleOutput: '✓ Moved: src/old.ts → src/new-location.ts\n  Updated 3 import references' },
      { name: 'delete_file', description: 'Delete a file', sampleOutput: '✓ Deleted: src/deprecated.ts\n  Size: 4.5KB | Removed 1 reference' },
      { name: 'get_info', description: 'Get file metadata', sampleOutput: 'src/app/page.tsx:\n  Size: 2.1KB | Modified: 2h ago\n  Permissions: rw-r--r-- | Type: file' },
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
    health: 'healthy',
    lastConnected: null,
    tools: [
      { name: 'navigate', description: 'Navigate to URL', sampleOutput: '✓ Navigated to https://example.com\n  Status: 200 OK | Load time: 1.2s' },
      { name: 'screenshot', description: 'Capture page screenshot', sampleOutput: '✓ Screenshot captured\n  Dimensions: 1920×1080 | Format: PNG\n  Size: 234KB' },
      { name: 'click', description: 'Click element on page', sampleOutput: '✓ Clicked element: #submit-btn\n  Navigation: /dashboard (200 OK)' },
      { name: 'extract', description: 'Extract data from page', sampleOutput: 'Extracted data (5 items):\n  Title: "Example Page"\n  Links: 3 found\n  Forms: 1 found' },
      { name: 'fill_form', description: 'Fill and submit forms', sampleOutput: '✓ Form submitted\n  Fields filled: 4/4\n  Response: 200 OK | Redirect: /success' },
    ],
  },
];

// ── Component ───────────────────────────────────────────────────────────

export function MCPHub() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category>('All');
  const [expandedServer, setExpandedServer] = useState<string | null>(null);
  const [toolExecutions, setToolExecutions] = useState<Record<string, ToolExecution>>({});
  const [serverStates, setServerStates] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    SERVERS.forEach((s) => {
      initial[s.id] = s.connected;
    });
    return initial;
  });
  const [serverLastConnected, setServerLastConnected] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    SERVERS.forEach((s) => {
      if (s.lastConnected) initial[s.id] = s.lastConnected;
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
    const popularIds = SERVERS.filter((s) => s.popular).map((s) => s.id);
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
  }, []);

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
    const server = SERVERS.find((s) => s.id === serverId);
    if (!server) return '';
    switch (server.health) {
      case 'healthy': return 'bg-emerald-400';
      case 'degraded': return 'bg-amber-400';
      case 'error': return 'bg-red-400';
      default: return 'bg-emerald-400';
    }
  };

  const getHealthTooltip = (serverId: string) => {
    const server = SERVERS.find((s) => s.id === serverId);
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
    return SERVERS.filter((s) => serverStates[s.id]);
  }, [serverStates]);

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

        {filteredServers.length === 0 && (
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
