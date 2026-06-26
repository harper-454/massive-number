'use client';

import { useState, useEffect } from 'react';
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
  const [branches, setBranches] = useState<string[]>([]);
  const [changedFiles, setChangedFiles] = useState<ChangedFile[]>([]);
  const [recentCommits, setRecentCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/git')
      .then(res => res.json())
      .then(data => {
        setBranches(data.branches || []);
        setCurrentBranch(data.branch || 'main');
        setChangedFiles((data.status || []).map((f: { file: string; status: string; additions: number; deletions: number }) => ({
          name: f.file.split('/').pop() || f.file,
          path: f.file,
          status: f.status as FileStatus,
          additions: f.additions,
          deletions: f.deletions,
          diff: [],
        })));
        setRecentCommits((data.recentCommits || []).map((c: { hash: string; message: string; date: string; additions: number; deletions: number }) => ({
          hash: c.hash,
          message: c.message,
          date: c.date,
          additions: c.additions,
          deletions: c.deletions,
        })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const totalAdditions = changedFiles.reduce((s, f) => s + f.additions, 0);
  const totalDeletions = changedFiles.reduce((s, f) => s + f.deletions, 0);

  const handleCommit = () => {
    if (!commitMessage.trim()) return;
    setIsCommitting(true);
    fetch('/api/git', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: 'commit', args: { message: commitMessage } }),
    })
      .then(res => res.json())
      .then(() => {
        setIsCommitting(false);
        setCommitted(true);
        setCommitMessage('');
        setChangedFiles([]);
        setTimeout(() => setCommitted(false), 3000);
      })
      .catch(() => setIsCommitting(false));
  };

  const activeDiff = changedFiles.find((f) => f.path === selectedFile);

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
              {branches.map((b) => (
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
            {changedFiles.length} files
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
              {changedFiles.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <GitBranch className="h-6 w-6 mx-auto mb-2 opacity-30" />
                  <p className="text-[10px]">No changes to commit</p>
                </div>
              ) : null}
              {changedFiles.map((file) => {
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
          {recentCommits.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">
              <p className="text-[10px]">No git activity yet</p>
            </div>
          ) : null}
          {recentCommits.map((commit) => (
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
