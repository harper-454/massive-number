'use client';

import { useState } from 'react';
import {
  GitBranch,
  GitCommit,
  Plus,
  Minus,
  ChevronDown,
  Upload,
  FileText,
  RefreshCw,
  Clock,
  ArrowUpRight,
  Check,
  File,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ───────────────────────────────────────────────────────────────

type FileStatus = 'modified' | 'added' | 'deleted';

interface ChangedFile {
  name: string;
  path: string;
  status: FileStatus;
  additions: number;
  deletions: number;
  diff: DiffLine[];
}

interface DiffLine {
  type: 'add' | 'remove' | 'context';
  content: string;
  lineOld?: number;
  lineNew?: number;
}

interface Commit {
  hash: string;
  message: string;
  date: string;
  additions: number;
  deletions: number;
}

// ── Data ────────────────────────────────────────────────────────────────

const BRANCHES = ['main', 'develop', 'feature/mcp-hub', 'fix/streaming', 'feature/spec-panel', 'release/v2.0'];

const CHANGED_FILES: ChangedFile[] = [
  {
    name: 'page.tsx',
    path: 'src/app/page.tsx',
    status: 'modified',
    additions: 12,
    deletions: 3,
    diff: [
      { type: 'context', content: 'import { ChatPanel } from "@/components/nexus/chat-panel";', lineOld: 1, lineNew: 1 },
      { type: 'remove', content: 'const oldLayout = true;', lineOld: 2 },
      { type: 'add', content: 'const newLayout = false;', lineNew: 2 },
      { type: 'add', content: 'import { MCPHub } from "@/components/nexus/mcp-hub";', lineNew: 3 },
      { type: 'context', content: '', lineOld: 3, lineNew: 4 },
      { type: 'context', content: 'export default function Home() {', lineOld: 4, lineNew: 5 },
      { type: 'remove', content: '  return <OldComponent />;', lineOld: 5 },
      { type: 'add', content: '  return (', lineNew: 6 },
      { type: 'add', content: '    <div className="flex h-screen">', lineNew: 7 },
      { type: 'add', content: '      <MCPHub />', lineNew: 8 },
      { type: 'add', content: '    </div>', lineNew: 9 },
      { type: 'add', content: '  );', lineNew: 10 },
      { type: 'context', content: '}', lineOld: 6, lineNew: 11 },
    ],
  },
  {
    name: 'mcp-hub.tsx',
    path: 'src/components/nexus/mcp-hub.tsx',
    status: 'added',
    additions: 245,
    deletions: 0,
    diff: [
      { type: 'add', content: "'use client';", lineNew: 1 },
      { type: 'add', content: '', lineNew: 2 },
      { type: 'add', content: 'import { useState, useMemo } from "react";', lineNew: 3 },
      { type: 'add', content: 'import { Plug, Search, Zap } from "lucide-react";', lineNew: 4 },
      { type: 'add', content: '// MCP Hub component implementation...', lineNew: 5 },
    ],
  },
  {
    name: 'api.ts',
    path: 'src/lib/api.ts',
    status: 'modified',
    additions: 8,
    deletions: 2,
    diff: [
      { type: 'context', content: 'const API_BASE = "/api";', lineOld: 1, lineNew: 1 },
      { type: 'remove', content: 'export const timeout = 5000;', lineOld: 2 },
      { type: 'add', content: 'export const timeout = 10000;', lineNew: 2 },
      { type: 'add', content: 'export const retryCount = 3;', lineNew: 3 },
    ],
  },
  {
    name: 'utils.ts',
    path: 'src/lib/utils.ts',
    status: 'deleted',
    additions: 0,
    deletions: 15,
    diff: [
      { type: 'remove', content: 'export function deprecatedUtil() {', lineOld: 1 },
      { type: 'remove', content: '  // This function is no longer needed', lineOld: 2 },
      { type: 'remove', content: '  return null;', lineOld: 3 },
      { type: 'remove', content: '}', lineOld: 4 },
    ],
  },
];

const RECENT_COMMITS: Commit[] = [
  { hash: 'a3f7c2d', message: 'feat: add MCP integration hub with 12 server types', date: '2 hours ago', additions: 245, deletions: 3 },
  { hash: 'b8e1f4a', message: 'fix: resolve chat streaming connection issue', date: '5 hours ago', additions: 12, deletions: 8 },
  { hash: 'c9d2e5b', message: 'feat: implement agent pipeline with visual steps', date: '1 day ago', additions: 189, deletions: 45 },
  { hash: 'd1a3f6c', message: 'refactor: optimize model selector component', date: '2 days ago', additions: 34, deletions: 52 },
  { hash: 'e4b5g7d', message: 'chore: update dependencies and config', date: '3 days ago', additions: 8, deletions: 8 },
];

// ── Helpers ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<FileStatus, { label: string; color: string; bg: string }> = {
  modified: { label: 'M', color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30' },
  added: { label: 'A', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
  deleted: { label: 'D', color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30' },
};

// ── Component ───────────────────────────────────────────────────────────

export function GitPanel() {
  const [currentBranch, setCurrentBranch] = useState('main');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [commitMessage, setCommitMessage] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);
  const [committed, setCommitted] = useState(false);

  const totalAdditions = CHANGED_FILES.reduce((s, f) => s + f.additions, 0);
  const totalDeletions = CHANGED_FILES.reduce((s, f) => s + f.deletions, 0);

  const handleCommit = () => {
    if (!commitMessage.trim()) return;
    setIsCommitting(true);
    setTimeout(() => {
      setIsCommitting(false);
      setCommitted(true);
      setCommitMessage('');
      setTimeout(() => setCommitted(false), 3000);
    }, 1500);
  };

  const activeDiff = CHANGED_FILES.find((f) => f.path === selectedFile);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <GitBranch className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Git Integration</h2>
              <p className="text-[10px] text-muted-foreground">Version control & collaboration</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]">
            <RefreshCw className="h-3 w-3 mr-1" />
            Pull
          </Button>
        </div>

        {/* Branch selector */}
        <div className="flex items-center gap-2 mb-3">
          <Select value={currentBranch} onValueChange={setCurrentBranch}>
            <SelectTrigger className="h-7 text-[10px] flex-1 bg-card/50">
              <GitBranch className="h-3 w-3 mr-1 text-amber-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BRANCHES.map((b) => (
                <SelectItem key={b} value={b} className="text-[10px]">
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-400 gap-1 shrink-0">
            <ArrowUpRight className="h-2.5 w-2.5" />
            origin/{currentBranch}
          </Badge>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <File className="h-2.5 w-2.5" />
            {CHANGED_FILES.length} files
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <Plus className="h-2.5 w-2.5" />
            +{totalAdditions}
          </span>
          <span className="flex items-center gap-1 text-red-400">
            <Minus className="h-2.5 w-2.5" />
            -{totalDeletions}
          </span>
        </div>
      </div>

      <Separator className="shrink-0" />

      {/* Main content - split: files + diff */}
      <div className="flex-1 min-h-0 flex">
        {/* Left: Files list + commit */}
        <div className="w-[45%] flex flex-col border-r border-border/30 min-h-0">
          {/* Changed files */}
          <div className="shrink-0 px-3 py-2">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Changed Files
            </span>
          </div>
          <ScrollArea className="flex-1 min-h-0">
            <div className="px-2 space-y-0.5">
              {CHANGED_FILES.map((file) => {
                const statusCfg = STATUS_CONFIG[file.status];
                const isSelected = selectedFile === file.path;

                return (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(isSelected ? null : file.path)}
                    className={`w-full text-left p-2 rounded-md transition-colors flex items-center gap-2 group ${
                      isSelected
                        ? 'bg-emerald-500/10 border border-emerald-500/20'
                        : 'hover:bg-muted/50 border border-transparent'
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono truncate">{file.name}</span>
                        <Badge
                          className={`text-[7px] h-3.5 px-1 border ${statusCfg.bg} ${statusCfg.color}`}
                          variant="outline"
                        >
                          {statusCfg.label}
                        </Badge>
                      </div>
                      <span className="text-[8px] text-muted-foreground truncate block">
                        {file.path}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[8px] shrink-0">
                      <span className="text-emerald-400">+{file.additions}</span>
                      <span className="text-red-400">-{file.deletions}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>

          <Separator />

          {/* Commit area */}
          <div className="shrink-0 p-3">
            <Textarea
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Commit message..."
              className="h-16 text-[10px] resize-none bg-card/50 mb-2"
            />
            <Button
              size="sm"
              className="w-full h-7 text-[10px]"
              disabled={!commitMessage.trim() || isCommitting}
              onClick={handleCommit}
            >
              {isCommitting ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Committing...
                </>
              ) : committed ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Committed!
                </>
              ) : (
                <>
                  <Upload className="h-3 w-3 mr-1" />
                  Commit &amp; Push
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Right: Diff preview */}
        <div className="flex-1 min-h-0 flex flex-col">
          {activeDiff ? (
            <>
              <div className="shrink-0 px-3 py-2 flex items-center gap-2 border-b border-border/30">
                <FileText className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] font-mono">{activeDiff.path}</span>
                <Badge
                  className={`text-[7px] h-3.5 px-1 border ${STATUS_CONFIG[activeDiff.status].bg} ${STATUS_CONFIG[activeDiff.status].color}`}
                  variant="outline"
                >
                  {STATUS_CONFIG[activeDiff.status].label}
                </Badge>
              </div>
              <ScrollArea className="flex-1 min-h-0">
                <div className="p-2 font-mono text-[10px]">
                  {activeDiff.diff.map((line, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`flex ${
                        line.type === 'add'
                          ? 'bg-emerald-500/10 text-emerald-300'
                          : line.type === 'remove'
                            ? 'bg-red-500/10 text-red-300'
                            : 'text-muted-foreground'
                      }`}
                    >
                      <span className="w-8 text-right pr-2 text-muted-foreground/50 select-none shrink-0">
                        {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
                      </span>
                      <span className="w-8 text-right pr-2 text-muted-foreground/30 select-none shrink-0">
                        {line.lineNew ?? line.lineOld ?? ''}
                      </span>
                      <span className="whitespace-pre-wrap break-all">{line.content}</span>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <FileText className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-[10px]">Select a file to view diff</p>
            </div>
          )}
        </div>
      </div>

      <Separator className="shrink-0" />

      {/* Recent commits */}
      <div className="shrink-0 max-h-36 overflow-y-auto">
        <div className="px-4 py-2">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Recent Commits
          </span>
        </div>
        <div className="px-3 pb-2 space-y-1">
          {RECENT_COMMITS.map((commit) => (
            <div
              key={commit.hash}
              className="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/30 transition-colors"
            >
              <GitCommit className="h-3 w-3 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono text-amber-400">{commit.hash}</span>
                  <span className="text-[10px] truncate">{commit.message}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[8px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-2 w-2" />
                    {commit.date}
                  </span>
                  <span className="text-[8px] text-emerald-400">+{commit.additions}</span>
                  <span className="text-[8px] text-red-400">-{commit.deletions}</span>
                  {/* Additions/deletions bar */}
                  <div className="h-1 w-12 rounded-full bg-muted/50 overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-400/60"
                      style={{
                        width: `${(commit.additions / (commit.additions + commit.deletions + 1)) * 100}%`,
                      }}
                    />
                    <div
                      className="h-full bg-red-400/60"
                      style={{
                        width: `${(commit.deletions / (commit.additions + commit.deletions + 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
