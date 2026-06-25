'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import {
  File,
  Save,
  Copy,
  X,
  Plus,
  ChevronRight,
  FolderOpen,
  FileCode,
  Sparkles,
  Undo,
  Redo,
  Search as SearchIcon,
  Terminal as TerminalIcon,
  PanelLeftClose,
  PanelLeftOpen,
  Map,
  Check,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// ── Sample files ────────────────────────────────────────────────────────────

interface SampleFile {
  name: string;
  language: string;
  content: string;
}

const SAMPLE_FILES: SampleFile[] = [
  {
    name: 'index.tsx',
    language: 'tsx',
    content: `import React from 'react';

export default function EditorPanel() {
  const [count, setCount] = React.useState(0);
  
  return (
    <div className="app">
      <h1>MASSIVE NUMBER</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>+</button>
    </div>
  );
}`,
  },
  {
    name: 'api.ts',
    language: 'typescript',
    content: `import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  // Process the request
  const result = await processData(body);
  
  return NextResponse.json({ success: true, result });
}

async function processData(data: any) {
  // AI-powered processing
  return { processed: true, timestamp: Date.now() };
}`,
  },
  {
    name: 'styles.css',
    language: 'css',
    content: `:root {
  --primary: #10b981;
  --bg: #0a0a0a;
  --surface: #141414;
  --border: #262626;
}

.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--bg);
  color: white;
}`,
  },
];

// ── Map file extension to syntax highlighter language ───────────────────────

function getLanguageFromName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    tsx: 'tsx',
    jsx: 'jsx',
    ts: 'typescript',
    js: 'javascript',
    css: 'css',
    scss: 'scss',
    json: 'json',
    md: 'markdown',
    py: 'python',
    rs: 'rust',
    go: 'go',
    html: 'markup',
    xml: 'markup',
  };
  return map[ext] ?? 'text';
}

// ── Mini-map component ──────────────────────────────────────────────────────

function MiniMap({ content }: { content: string }) {
  const lines = content.split('\n');
  // Determine a color for each line based on indentation / content
  const lineColors = lines.map((line) => {
    const trimmed = line.trim();
    if (trimmed === '') return 'transparent';
    if (trimmed.startsWith('//') || trimmed.startsWith('/*'))
      return 'rgb(92,99,112)';
    if (
      trimmed.startsWith('import ') ||
      trimmed.startsWith('export ') ||
      trimmed.startsWith('function ') ||
      trimmed.startsWith('const ') ||
      trimmed.startsWith('async ')
    )
      return 'rgb(198,120,221)';
    if (trimmed.startsWith('return')) return 'rgb(152,195,121)';
    if (trimmed.includes('className')) return 'rgb(86,182,194)';
    return 'rgb(171,178,191)';
  });

  return (
    <div className="flex flex-col gap-px py-2 px-1 opacity-50 hover:opacity-80 transition-opacity">
      {lineColors.map((color, i) => (
        <div
          key={i}
          className="h-px rounded-sm"
          style={{
            backgroundColor: color,
            width: `${Math.min(100, 30 + (lines[i]?.trimStart().length ?? 0) * 1.2)}%`,
            minWidth: color === 'transparent' ? 0 : 6,
          }}
        />
      ))}
    </div>
  );
}

// ── Editor Panel ────────────────────────────────────────────────────────────

export default function EditorPanel() {
  const [openFiles, setOpenFiles] = useState<SampleFile[]>([SAMPLE_FILES[0]]);
  const [activeFile, setActiveFile] = useState<string>(SAMPLE_FILES[0].name);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiAssistOpen, setAiAssistOpen] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiProcessing, setAiProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingContent, setEditingContent] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(SAMPLE_FILES.map((f) => [f.name, f.content]))
  );
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorCol, setCursorCol] = useState(1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentFile = openFiles.find((f) => f.name === activeFile);
  const currentContent = currentFile
    ? editingContent[currentFile.name] ?? currentFile.content
    : '';

  // Open a file
  const openFile = useCallback(
    (file: SampleFile) => {
      if (!openFiles.find((f) => f.name === file.name)) {
        setOpenFiles((prev) => [...prev, file]);
      }
      setActiveFile(file.name);
      if (!(file.name in editingContent)) {
        setEditingContent((prev) => ({ ...prev, [file.name]: file.content }));
      }
    },
    [openFiles, editingContent]
  );

  // Close a file tab
  const closeFile = useCallback(
    (name: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const next = openFiles.filter((f) => f.name !== name);
      setOpenFiles(next);
      if (activeFile === name && next.length > 0) {
        setActiveFile(next[next.length - 1].name);
      }
    },
    [openFiles, activeFile]
  );

  // Copy content
  const handleCopy = useCallback(() => {
    if (!currentContent) return;
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [currentContent]);

  // AI Assist
  const handleAiSubmit = useCallback(() => {
    if (!aiInput.trim()) return;
    setAiProcessing(true);
    // Simulate AI response
    setTimeout(() => {
      setAiProcessing(false);
      setAiAssistOpen(false);
      setAiInput('');
    }, 2000);
  }, [aiInput]);

  // Handle textarea changes and cursor position
  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (!currentFile) return;
      setEditingContent((prev) => ({
        ...prev,
        [currentFile.name]: e.target.value,
      }));
    },
    [currentFile]
  );

  const handleCursorChange = useCallback(() => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const textBeforeCursor = textarea.value.substring(0, textarea.selectionStart);
    const lines = textBeforeCursor.split('\n');
    setCursorLine(lines.length);
    setCursorCol(lines[lines.length - 1].length + 1);
  }, []);

  const language = currentFile
    ? getLanguageFromName(currentFile.name)
    : 'text';

  const lineCount = currentContent.split('\n').length;

  // Syntax highlighter language map
  const languageMap = useMemo(() => {
    return currentContent.split('\n');
  }, [currentContent]);

  return (
    <div className="flex h-full w-full bg-[#0a0a0a] rounded-lg border border-[#262626] overflow-hidden">
      {/* ── File Tree Sidebar ──────────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="w-56 min-w-0 border-r border-[#262626] bg-[#0f0f0f] flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#262626]">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Explorer
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-zinc-500 hover:text-zinc-300"
              onClick={() => setSidebarOpen(false)}
            >
              <PanelLeftClose className="h-3.5 w-3.5" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2">
              <div className="flex items-center gap-1 px-2 py-1 text-xs text-emerald-400 font-semibold">
                <FolderOpen className="h-3.5 w-3.5" />
                my-project
              </div>
              {SAMPLE_FILES.map((file) => (
                <button
                  key={file.name}
                  onClick={() => openFile(file)}
                  className={`flex items-center gap-2 w-full px-3 py-1 text-xs rounded transition-colors ${
                    activeFile === file.name
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'
                  }`}
                >
                  <FileCode className="h-3.5 w-3.5 shrink-0" />
                  {file.name}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* ── Main Editor Area ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-2 py-1 border-b border-[#262626] bg-[#111111]">
          <div className="flex items-center gap-1">
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-zinc-500 hover:text-zinc-300"
                onClick={() => setSidebarOpen(true)}
              >
                <PanelLeftOpen className="h-4 w-4" />
              </Button>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-zinc-500 hover:text-zinc-300"
                  >
                    <Save className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Save</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-zinc-500 hover:text-zinc-300"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{copied ? 'Copied!' : 'Copy'}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-zinc-500 hover:text-zinc-300"
                  >
                    <Undo className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Undo</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-zinc-500 hover:text-zinc-300"
                  >
                    <Redo className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Redo</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-7 w-7 ${
                      aiAssistOpen
                        ? 'text-emerald-400 bg-emerald-500/10'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                    onClick={() => setAiAssistOpen(!aiAssistOpen)}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>AI Assist</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-zinc-500 hover:text-zinc-300"
                  >
                    <SearchIcon className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Search</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center border-b border-[#262626] bg-[#111111] overflow-x-auto">
          {openFiles.map((file) => (
            <button
              key={file.name}
              onClick={() => setActiveFile(file.name)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs border-r border-[#262626] whitespace-nowrap transition-colors ${
                activeFile === file.name
                  ? 'bg-[#0a0a0a] text-zinc-200 border-t-2 border-t-emerald-500'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-[#0f0f0f]'
              }`}
            >
              <FileCode className="h-3 w-3 text-zinc-500" />
              {file.name}
              <span
                onClick={(e) => closeFile(file.name, e)}
                className="ml-1 p-0.5 rounded hover:bg-zinc-700 transition-colors"
              >
                <X className="h-2.5 w-2.5" />
              </span>
            </button>
          ))}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-zinc-600 hover:text-zinc-300 ml-1"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Editor Content */}
        <div className="flex-1 relative overflow-hidden flex">
          {/* Code Area */}
          <div className="flex-1 overflow-auto relative">
            {/* Line numbers + code */}
            <div className="flex min-h-full">
              {/* Line numbers */}
              <div className="select-none text-right pr-4 pl-4 pt-4 text-xs leading-6 text-zinc-600 bg-[#0a0a0a] sticky left-0 z-10">
                {Array.from({ length: lineCount }, (_, i) => (
                  <div
                    key={i}
                    className={`${
                      cursorLine === i + 1
                        ? 'text-emerald-500/70'
                        : ''
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Code display with overlay editing */}
              <div className="flex-1 relative">
                {/* Syntax highlighted code (background) */}
                <div className="absolute inset-0 pt-4 pointer-events-none overflow-hidden">
                  <SyntaxHighlighter
                    language={language}
                    style={oneDark}
                    customStyle={{
                      background: 'transparent',
                      margin: 0,
                      padding: 0,
                      fontSize: '13px',
                      lineHeight: '1.5rem',
                      fontFamily:
                        '"JetBrains Mono", "Fira Code", "Cascadia Code", Menlo, Monaco, monospace',
                    }}
                    showLineNumbers={false}
                    wrapLines={true}
                  >
                    {currentContent}
                  </SyntaxHighlighter>
                </div>

                {/* Invisible textarea for editing (foreground) */}
                <textarea
                  ref={textareaRef}
                  value={currentContent}
                  onChange={handleTextChange}
                  onKeyUp={handleCursorChange}
                  onClick={handleCursorChange}
                  className="absolute inset-0 pt-4 w-full h-full resize-none bg-transparent text-transparent caret-emerald-400 outline-none text-[13px] leading-6 font-mono z-20"
                  style={{
                    fontFamily:
                      '"JetBrains Mono", "Fira Code", "Cascadia Code", Menlo, Monaco, monospace',
                    tabSize: 2,
                  }}
                  spellCheck={false}
                />

                {/* Current line highlight */}
                <div
                  className="absolute left-0 right-0 h-6 bg-emerald-500/5 pointer-events-none z-10 transition-transform"
                  style={{
                    transform: `translateY(${(cursorLine - 1) * 24 + 16}px)`,
                  }}
                />
              </div>
            </div>

            {/* AI Assist Inline Panel */}
            {aiAssistOpen && (
              <div className="absolute bottom-4 left-4 right-20 z-30 animate-in slide-in-from-bottom-2 duration-200">
                <div className="bg-[#1a1a1a] border border-emerald-500/30 rounded-lg shadow-xl shadow-emerald-500/5 overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-[#262626]">
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs text-emerald-400 font-medium">
                      AI Assist
                    </span>
                    {aiProcessing && (
                      <Loader2 className="h-3 w-3 text-emerald-400 animate-spin" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2">
                    <input
                      type="text"
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAiSubmit();
                        if (e.key === 'Escape') {
                          setAiAssistOpen(false);
                          setAiInput('');
                        }
                      }}
                      placeholder="Ask AI to edit, refactor, or explain..."
                      className="flex-1 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 outline-none"
                      autoFocus
                      disabled={aiProcessing}
                    />
                    <Button
                      size="sm"
                      className="h-6 bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-2"
                      onClick={handleAiSubmit}
                      disabled={aiProcessing || !aiInput.trim()}
                    >
                      {aiProcessing ? 'Running...' : 'Send'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mini-map */}
          <div className="w-16 border-l border-[#262626] bg-[#0f0f0f] overflow-hidden cursor-pointer hover:bg-[#111] transition-colors">
            <MiniMap content={currentContent} />
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between px-3 py-1 border-t border-[#262626] bg-[#111111] text-[10px] text-zinc-500">
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="h-4 px-1.5 text-[10px] border-zinc-700 text-zinc-400 bg-zinc-800/50"
            >
              {language.toUpperCase()}
            </Badge>
            <span>
              Ln {cursorLine}, Col {cursorCol}
            </span>
            <span>UTF-8</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500">AI Ready</span>
            </span>
            <span>Spaces: 2</span>
          </div>
        </div>
      </div>
    </div>
  );
}
