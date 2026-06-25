'use client';

import { useState, useCallback } from 'react';
import {
  Brain,
  Database,
  BookOpen,
  Clock,
  Plus,
  Trash2,
  Search,
  RefreshCw,
  Download,
  AlertTriangle,
  FileCode2,
  FileText,
  Hash,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Tag,
  MessageSquare,
  Coins,
  Timer,
  Activity,
  FolderOpen,
  ArrowUpRight,
  Shield,
  Zap,
  Code,
  Palette,
  Cpu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';

/* ───────── Types ───────── */

type MemoryCategory = 'codebase' | 'preference' | 'decision' | 'error' | 'style';

interface MemoryEntry {
  id: string;
  category: MemoryCategory;
  content: string;
  source: string;
  date: string;
}

interface IndexedFile {
  path: string;
  language: string;
  lastIndexed: string;
  relevance: number;
}

interface KnowledgeEntry {
  id: string;
  topic: string;
  content: string;
}

interface SessionEntry {
  id: string;
  date: string;
  duration: string;
  messages: number;
  models: string[];
  tokens: number;
  cost: number;
  summary?: string;
}

/* ───────── Category Config ───────── */

const CATEGORY_CONFIG: Record<MemoryCategory, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  codebase: {
    label: 'Codebase',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10 border-cyan-500/20',
    icon: <Code className="h-3 w-3" />,
  },
  preference: {
    label: 'Preference',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 border-amber-500/20',
    icon: <Zap className="h-3 w-3" />,
  },
  decision: {
    label: 'Decision',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 border-emerald-500/20',
    icon: <Check className="h-3 w-3" />,
  },
  error: {
    label: 'Error',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10 border-red-500/20',
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  style: {
    label: 'Style',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10 border-orange-500/20',
    icon: <Palette className="h-3 w-3" />,
  },
};

/* ───────── Sample Data ───────── */

const SAMPLE_MEMORIES: MemoryEntry[] = [
  {
    id: 'mem-1',
    category: 'codebase',
    content: 'Project uses Next.js 16 with App Router and TypeScript strict mode',
    source: 'Chat #12 — Project Setup',
    date: '2026-06-24',
  },
  {
    id: 'mem-2',
    category: 'preference',
    content: 'User prefers functional components over class components',
    source: 'Chat #8 — Component Architecture',
    date: '2026-06-23',
  },
  {
    id: 'mem-3',
    category: 'decision',
    content: 'Using Prisma ORM with SQLite for data layer',
    source: 'Chat #5 — Database Design',
    date: '2026-06-22',
  },
  {
    id: 'mem-4',
    category: 'error',
    content: 'Next.js 16 requires dynamic route params to be awaited',
    source: 'Chat #15 — Bug Fix',
    date: '2026-06-24',
  },
  {
    id: 'mem-5',
    category: 'style',
    content: 'Use Tailwind CSS utility classes, avoid inline styles',
    source: 'Chat #3 — Styling Guide',
    date: '2026-06-21',
  },
];

const SAMPLE_INDEXED_FILES: IndexedFile[] = [
  { path: 'src/app/page.tsx', language: 'TypeScript', lastIndexed: '2026-06-24T14:30', relevance: 95 },
  { path: 'prisma/schema.prisma', language: 'Prisma', lastIndexed: '2026-06-24T13:15', relevance: 88 },
  { path: 'src/stores/chat-store.ts', language: 'TypeScript', lastIndexed: '2026-06-24T12:00', relevance: 82 },
  { path: 'src/components/nexus/chat-panel.tsx', language: 'TSX', lastIndexed: '2026-06-24T11:45', relevance: 79 },
  { path: 'src/lib/db.ts', language: 'TypeScript', lastIndexed: '2026-06-23T16:20', relevance: 71 },
  { path: 'src/stores/model-store.ts', language: 'TypeScript', lastIndexed: '2026-06-23T15:00', relevance: 68 },
];

const SAMPLE_KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: 'know-1',
    topic: 'architecture',
    content: 'Full-stack Next.js 16 app with Prisma ORM, Zustand state management, and socket.io for real-time features',
  },
  {
    id: 'know-2',
    topic: 'api-pattern',
    content: 'All API routes follow REST conventions with proper error handling and TypeScript types',
  },
  {
    id: 'know-3',
    topic: 'styling',
    content: 'Tailwind CSS 4 with shadcn/ui components. Emerald/teal accent system. Dark theme by default.',
  },
  {
    id: 'know-4',
    topic: 'deployment',
    content: 'Bun runtime for both Next.js and mini-services. SQLite for persistence. Caddy gateway for port routing.',
  },
];

const SAMPLE_SESSIONS: SessionEntry[] = [
  {
    id: 'session-1',
    date: '2026-06-24 14:30',
    duration: '1h 23m',
    messages: 47,
    models: ['gpt-4o', 'claude-sonnet'],
    tokens: 24500,
    cost: 1.23,
    summary: 'Built the customization hub and context memory panels. Integrated with existing store architecture.',
  },
  {
    id: 'session-2',
    date: '2026-06-24 10:15',
    duration: '45m',
    messages: 22,
    models: ['gpt-4o'],
    tokens: 12800,
    cost: 0.64,
    summary: 'Debugged WebSocket connection issues. Added polling fallback for gateway routing.',
  },
  {
    id: 'session-3',
    date: '2026-06-23 16:00',
    duration: '2h 10m',
    messages: 68,
    models: ['claude-sonnet', 'deepseek-r1'],
    tokens: 41200,
    cost: 2.08,
    summary: 'Implemented the agent execution pipeline with 6-step workflow and real-time streaming.',
  },
  {
    id: 'session-4',
    date: '2026-06-23 11:30',
    duration: '30m',
    messages: 15,
    models: ['gpt-4o'],
    tokens: 7200,
    cost: 0.36,
    summary: 'Set up Prisma schema and initial database migration. Created 8 API routes.',
  },
];

/* ───────── Section Config ───────── */

type SectionId = 'memory' | 'codebase' | 'knowledge' | 'sessions';

const SECTIONS: { id: SectionId; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'memory', label: 'Conversation Memory', icon: <Brain className="h-4 w-4" />, description: 'Persistent memories learned from conversations' },
  { id: 'codebase', label: 'Codebase Context', icon: <Database className="h-4 w-4" />, description: 'Indexed files for AI context' },
  { id: 'knowledge', label: 'Project Knowledge', icon: <BookOpen className="h-4 w-4" />, description: 'Cross-session knowledge base' },
  { id: 'sessions', label: 'Session History', icon: <Clock className="h-4 w-4" />, description: 'Recent sessions with stats' },
];

/* ───────── Main Component ───────── */

export function ContextMemory() {
  const [activeSection, setActiveSection] = useState<SectionId>('memory');
  const [memories, setMemories] = useState<MemoryEntry[]>(SAMPLE_MEMORIES);
  const [indexedFiles, setIndexedFiles] = useState<IndexedFile[]>(SAMPLE_INDEXED_FILES);
  const [knowledge, setKnowledge] = useState<KnowledgeEntry[]>(SAMPLE_KNOWLEDGE);
  const [sessions] = useState<SessionEntry[]>(SAMPLE_SESSIONS);

  // Add memory dialog
  const [showAddMemory, setShowAddMemory] = useState(false);
  const [newMemoryCategory, setNewMemoryCategory] = useState<MemoryCategory>('codebase');
  const [newMemoryContent, setNewMemoryContent] = useState('');

  // Add knowledge dialog
  const [showAddKnowledge, setShowAddKnowledge] = useState(false);
  const [newKnowledgeTopic, setNewKnowledgeTopic] = useState('');
  const [newKnowledgeContent, setNewKnowledgeContent] = useState('');

  // Add file dialog
  const [showAddFile, setShowAddFile] = useState(false);
  const [newFilePath, setNewFilePath] = useState('');

  // Knowledge search
  const [knowledgeSearch, setKnowledgeSearch] = useState('');

  // Expanded session
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  /* ── Memory handlers ── */

  const handleAddMemory = useCallback(() => {
    if (!newMemoryContent.trim()) return;
    const entry: MemoryEntry = {
      id: `mem-${Date.now()}`,
      category: newMemoryCategory,
      content: newMemoryContent.trim(),
      source: 'Manual entry',
      date: new Date().toISOString().split('T')[0],
    };
    setMemories((prev) => [entry, ...prev]);
    setNewMemoryContent('');
    setShowAddMemory(false);
  }, [newMemoryContent, newMemoryCategory]);

  const deleteMemory = useCallback((id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
  }, []);

  /* ── Knowledge handlers ── */

  const handleAddKnowledge = useCallback(() => {
    if (!newKnowledgeTopic.trim() || !newKnowledgeContent.trim()) return;
    const entry: KnowledgeEntry = {
      id: `know-${Date.now()}`,
      topic: newKnowledgeTopic.trim(),
      content: newKnowledgeContent.trim(),
    };
    setKnowledge((prev) => [entry, ...prev]);
    setNewKnowledgeTopic('');
    setNewKnowledgeContent('');
    setShowAddKnowledge(false);
  }, [newKnowledgeTopic, newKnowledgeContent]);

  const deleteKnowledge = useCallback((id: string) => {
    setKnowledge((prev) => prev.filter((k) => k.id !== id));
  }, []);

  /* ── File handlers ── */

  const handleAddFile = useCallback(() => {
    if (!newFilePath.trim()) return;
    const ext = newFilePath.split('.').pop() || 'txt';
    const langMap: Record<string, string> = {
      ts: 'TypeScript', tsx: 'TSX', js: 'JavaScript', jsx: 'JSX',
      py: 'Python', prisma: 'Prisma', css: 'CSS', json: 'JSON', md: 'Markdown',
    };
    const entry: IndexedFile = {
      path: newFilePath.trim(),
      language: langMap[ext] || ext.toUpperCase(),
      lastIndexed: new Date().toISOString().slice(0, 16),
      relevance: Math.floor(Math.random() * 30 + 50),
    };
    setIndexedFiles((prev) => [entry, ...prev]);
    setNewFilePath('');
    setShowAddFile(false);
  }, [newFilePath]);

  const handleReindex = useCallback((path: string) => {
    setIndexedFiles((prev) =>
      prev.map((f) =>
        f.path === path
          ? { ...f, lastIndexed: new Date().toISOString().slice(0, 16), relevance: Math.min(99, f.relevance + Math.floor(Math.random() * 5)) }
          : f
      )
    );
  }, []);

  /* ── Filter knowledge ── */

  const filteredKnowledge = knowledgeSearch.trim()
    ? knowledge.filter(
        (k) =>
          k.topic.toLowerCase().includes(knowledgeSearch.toLowerCase()) ||
          k.content.toLowerCase().includes(knowledgeSearch.toLowerCase())
      )
    : knowledge;

  /* ───────── Section Renderers ───────── */

  function renderMemory() {
    const categoryCounts = memories.reduce<Record<MemoryCategory, number>>((acc, m) => {
      acc[m.category] = (acc[m.category] || 0) + 1;
      return acc;
    }, {} as Record<MemoryCategory, number>);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Conversation Memory</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              AI remembers important context across conversations. No competitor has this.
            </p>
          </div>
          <Button
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={() => setShowAddMemory(true)}
          >
            <Plus className="h-3 w-3" />
            Add Memory
          </Button>
        </div>

        {/* Category summary */}
        <div className="flex items-center gap-2 flex-wrap">
          {(Object.keys(CATEGORY_CONFIG) as MemoryCategory[]).map((cat) => {
            const config = CATEGORY_CONFIG[cat];
            const count = categoryCounts[cat] || 0;
            return (
              <Badge
                key={cat}
                variant="outline"
                className={`text-[9px] h-5 px-2 gap-1 ${config.bgColor} ${config.color}`}
              >
                {config.icon}
                {config.label} ({count})
              </Badge>
            );
          })}
        </div>

        {/* Memory list */}
        <div className="space-y-2">
          <AnimatePresence>
            {memories.map((memory, idx) => {
              const config = CATEGORY_CONFIG[memory.category];
              return (
                <motion.div
                  key={memory.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, delay: idx * 0.03 }}
                >
                  <Card className="border-border/50 hover:border-border/80 transition-colors">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 border ${config.bgColor} ${config.color}`}
                        >
                          {config.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <Badge
                              variant="outline"
                              className={`text-[9px] h-4 px-1.5 ${config.bgColor} ${config.color} border-0`}
                            >
                              {config.label}
                            </Badge>
                            <span className="text-[9px] text-muted-foreground">{memory.date}</span>
                          </div>
                          <p className="text-sm text-foreground leading-snug">{memory.content}</p>
                          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                            <MessageSquare className="h-2.5 w-2.5" />
                            {memory.source}
                          </p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 shrink-0 text-muted-foreground hover:text-red-400"
                          onClick={() => deleteMemory(memory.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  function renderCodebase() {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Codebase Context</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Files the AI has indexed for deep contextual understanding.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1.5 text-xs"
            onClick={() => setShowAddFile(true)}
          >
            <Plus className="h-3 w-3" />
            Add to Context
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Indexed Files', value: indexedFiles.length, icon: <FileCode2 className="h-3.5 w-3.5 text-cyan-400" /> },
            { label: 'Avg Relevance', value: `${Math.round(indexedFiles.reduce((s, f) => s + f.relevance, 0) / indexedFiles.length)}%`, icon: <Activity className="h-3.5 w-3.5 text-emerald-400" /> },
            { label: 'Languages', value: new Set(indexedFiles.map((f) => f.language)).size, icon: <Hash className="h-3.5 w-3.5 text-amber-400" /> },
          ].map((stat) => (
            <Card key={stat.label} className="border-border/50">
              <CardContent className="p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  {stat.icon}
                </div>
                <div className="text-lg font-bold">{stat.value}</div>
                <div className="text-[9px] text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* File list */}
        <div className="space-y-2">
          {indexedFiles.map((file, idx) => {
            const langColors: Record<string, string> = {
              TypeScript: 'text-cyan-400',
              TSX: 'text-cyan-400',
              JavaScript: 'text-amber-400',
              Prisma: 'text-orange-400',
              CSS: 'text-rose-400',
              JSON: 'text-amber-400',
              Markdown: 'text-muted-foreground',
            };
            const langColor = langColors[file.language] || 'text-muted-foreground';
            const relevanceColor =
              file.relevance >= 90
                ? 'text-emerald-400'
                : file.relevance >= 75
                  ? 'text-amber-400'
                  : 'text-muted-foreground';

            return (
              <motion.div
                key={file.path}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: idx * 0.04 }}
              >
                <Card className="border-border/40 hover:border-border/70 transition-colors">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-md bg-muted/40 flex items-center justify-center shrink-0">
                        <FileCode2 className={`h-4 w-4 ${langColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium font-mono truncate">
                            {file.path}
                          </span>
                          <Badge variant="outline" className="text-[8px] h-4 px-1 shrink-0">
                            {file.language}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {file.lastIndexed}
                          </span>
                          <span className={`text-[9px] font-mono flex items-center gap-1 ${relevanceColor}`}>
                            <ArrowUpRight className="h-2.5 w-2.5" />
                            {file.relevance}% relevance
                          </span>
                        </div>
                        <Progress
                          value={file.relevance}
                          className="h-1 mt-1.5"
                        />
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-emerald-400"
                        onClick={() => handleReindex(file.path)}
                        title="Re-index file"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderKnowledge() {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Project Knowledge</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              A persistent knowledge base that survives across sessions.
            </p>
          </div>
          <Button
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={() => setShowAddKnowledge(true)}
          >
            <Plus className="h-3 w-3" />
            Add Knowledge
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search knowledge base..."
            value={knowledgeSearch}
            onChange={(e) => setKnowledgeSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
          {knowledgeSearch && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setKnowledgeSearch('')}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Knowledge entries */}
        <div className="space-y-2">
          <AnimatePresence>
            {filteredKnowledge.map((entry, idx) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
              >
                <Card className="border-border/50 hover:border-border/80 transition-colors">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Tag className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-[9px] h-4 px-1.5 bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          >
                            {entry.topic}
                          </Badge>
                        </div>
                        <p className="text-sm text-foreground mt-1 leading-snug">
                          {entry.content}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 shrink-0 text-muted-foreground hover:text-red-400"
                        onClick={() => deleteKnowledge(entry.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredKnowledge.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No knowledge entries found</p>
              <p className="text-xs mt-1">Try a different search or add a new entry</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderSessions() {
    const totalTokens = sessions.reduce((s, sess) => s + sess.tokens, 0);
    const totalCost = sessions.reduce((s, sess) => s + sess.cost, 0);
    const totalMessages = sessions.reduce((s, sess) => s + sess.messages, 0);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Session History</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review past sessions with detailed statistics.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1.5 text-xs text-red-400 border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
              >
                <Trash2 className="h-3 w-3" />
                Clear History
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                  Clear Session History?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all session history. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction className="bg-red-500 hover:bg-red-600 text-white">
                  Clear All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'Sessions', value: sessions.length, icon: <Clock className="h-3.5 w-3.5 text-emerald-400" /> },
            { label: 'Messages', value: totalMessages, icon: <MessageSquare className="h-3.5 w-3.5 text-amber-400" /> },
            { label: 'Tokens', value: totalTokens.toLocaleString(), icon: <Cpu className="h-3.5 w-3.5 text-cyan-400" /> },
            { label: 'Cost', value: `$${totalCost.toFixed(2)}`, icon: <Coins className="h-3.5 w-3.5 text-orange-400" /> },
          ].map((stat) => (
            <Card key={stat.label} className="border-border/50">
              <CardContent className="p-3 text-center">
                <div className="flex items-center justify-center mb-1">{stat.icon}</div>
                <div className="text-base font-bold">{stat.value}</div>
                <div className="text-[9px] text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Session list */}
        <div className="space-y-2">
          {sessions.map((session, idx) => {
            const isExpanded = expandedSession === session.id;
            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: idx * 0.04 }}
              >
                <Card className="border-border/50 hover:border-border/80 transition-colors">
                  <CardContent className="p-3">
                    <button
                      className="w-full text-left"
                      onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-md bg-muted/40 flex items-center justify-center shrink-0">
                          <Activity className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{session.date}</span>
                            <div className="flex items-center gap-1.5">
                              {isExpanded ? (
                                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                              <Timer className="h-2.5 w-2.5" />
                              {session.duration}
                            </span>
                            <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                              <MessageSquare className="h-2.5 w-2.5" />
                              {session.messages} msgs
                            </span>
                            <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                              <Coins className="h-2.5 w-2.5" />
                              ${session.cost.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Separator className="my-3" />
                          <div className="space-y-2 pl-11">
                            {/* Models used */}
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground">Models:</span>
                              {session.models.map((model) => (
                                <Badge
                                  key={model}
                                  variant="outline"
                                  className="text-[8px] h-4 px-1.5 bg-emerald-500/5 text-emerald-400 border-emerald-500/20"
                                >
                                  {model}
                                </Badge>
                              ))}
                            </div>

                            {/* Token usage */}
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground">Tokens:</span>
                              <span className="text-[10px] font-mono">{session.tokens.toLocaleString()}</span>
                            </div>

                            {/* Summary */}
                            {session.summary && (
                              <div className="mt-2 p-2 rounded-md bg-muted/20 border border-border/30">
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  {session.summary}
                                </p>
                              </div>
                            )}

                            {/* Export */}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 text-[10px] gap-1.5 text-muted-foreground"
                              onClick={() => {
                                const blob = new Blob(
                                  [JSON.stringify(session, null, 2)],
                                  { type: 'application/json' }
                                );
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `session-${session.id}.json`;
                                a.click();
                                URL.revokeObjectURL(url);
                              }}
                            >
                              <Download className="h-3 w-3" />
                              Export Session
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ───────── Render ───────── */

  const sectionContent: Record<SectionId, () => React.ReactNode> = {
    memory: renderMemory,
    codebase: renderCodebase,
    knowledge: renderKnowledge,
    sessions: renderSessions,
  };

  return (
    <div className="flex h-full">
      {/* Section sidebar */}
      <div className="w-48 border-r border-border/40 bg-card/20 shrink-0 flex flex-col py-2">
        <div className="px-3 pb-2">
          <h2 className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
            Context & Memory
          </h2>
        </div>
        <nav className="flex flex-col gap-0.5 px-2">
          {SECTIONS.map((section) => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex flex-col items-start gap-0.5 px-2.5 py-2 rounded-md transition-all text-left ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2">
                  {section.icon}
                  <span className="text-sm font-medium">{section.label}</span>
                </div>
                <span className={`text-[9px] pl-6 ${isActive ? 'text-emerald-400/70' : 'text-muted-foreground/60'}`}>
                  {section.description}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Section content */}
      <ScrollArea className="flex-1">
        <div className="p-5 max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
            >
              {sectionContent[activeSection]()}
            </motion.div>
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Add Memory Dialog */}
      <Dialog open={showAddMemory} onOpenChange={setShowAddMemory}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-emerald-400" />
              Add Memory
            </DialogTitle>
            <DialogDescription>
              Add a persistent memory that the AI will recall in future conversations.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Category</label>
              <div className="flex items-center gap-2 flex-wrap">
                {(Object.keys(CATEGORY_CONFIG) as MemoryCategory[]).map((cat) => {
                  const config = CATEGORY_CONFIG[cat];
                  const isSelected = newMemoryCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setNewMemoryCategory(cat)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border transition-all ${
                        isSelected
                          ? `${config.bgColor} ${config.color} border-current`
                          : 'border-border/50 text-muted-foreground hover:border-border'
                      }`}
                    >
                      {config.icon}
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Content</label>
              <Textarea
                placeholder="What should the AI remember?"
                value={newMemoryContent}
                onChange={(e) => setNewMemoryContent(e.target.value)}
                className="min-h-[80px] resize-none"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddMemory(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddMemory}
              disabled={!newMemoryContent.trim()}
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Memory
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Knowledge Dialog */}
      <Dialog open={showAddKnowledge} onOpenChange={setShowAddKnowledge}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-emerald-400" />
              Add Knowledge
            </DialogTitle>
            <DialogDescription>
              Add a knowledge entry that persists across all sessions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Topic</label>
              <Input
                placeholder="e.g. architecture, api-pattern, deployment"
                value={newKnowledgeTopic}
                onChange={(e) => setNewKnowledgeTopic(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Content</label>
              <Textarea
                placeholder="What should the AI know about this topic?"
                value={newKnowledgeContent}
                onChange={(e) => setNewKnowledgeContent(e.target.value)}
                className="min-h-[80px] resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddKnowledge(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddKnowledge}
              disabled={!newKnowledgeTopic.trim() || !newKnowledgeContent.trim()}
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Knowledge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add File Dialog */}
      <Dialog open={showAddFile} onOpenChange={setShowAddFile}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-emerald-400" />
              Add to Context
            </DialogTitle>
            <DialogDescription>
              Add a file path to the AI&apos;s indexed context for deeper understanding.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">File Path</label>
              <Input
                placeholder="e.g. src/components/nexus/chat-panel.tsx"
                value={newFilePath}
                onChange={(e) => setNewFilePath(e.target.value)}
                autoFocus
                className="font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddFile(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddFile}
              disabled={!newFilePath.trim()}
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add File
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
