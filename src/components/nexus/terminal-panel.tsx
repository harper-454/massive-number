'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Terminal as TerminalIcon,
  Plus,
  X,
  ChevronRight,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ── Types ───────────────────────────────────────────────────────────────────

interface TerminalLine {
  id: number;
  type: 'command' | 'output' | 'error' | 'success' | 'banner';
  content: string;
}

interface TerminalSession {
  id: string;
  name: string;
  lines: TerminalLine[];
  history: string[];
  historyIndex: number;
}

// ── Welcome banner ──────────────────────────────────────────────────────────

const WELCOME_LINES: Omit<TerminalLine, 'id'>[] = [
  {
    type: 'banner',
    content:
      '╔══════════════════════════════════════════════╗',
  },
  {
    type: 'banner',
    content:
      '║     MASSIVE NUMBER Terminal v1.0.0           ║',
  },
  {
    type: 'banner',
    content:
      `║     ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).padEnd(37)}║`,
  },
  {
    type: 'banner',
    content:
      '╚══════════════════════════════════════════════╝',
  },
  { type: 'output', content: '' },
  { type: 'command', content: 'neofetch' },
  { type: 'output', content: '  OS: MASSIVE NUMBER OS 2026.6' },
  { type: 'output', content: '  Shell: mn-sh 1.0' },
  { type: 'output', content: '  AI: Connected (7 models)' },
  { type: 'output', content: '  Agent: Ready' },
  { type: 'output', content: '' },
  { type: 'success', content: '$ Status: All systems operational ✓' },
  { type: 'output', content: '' },
];

// ── Command simulation ──────────────────────────────────────────────────────

function simulateCommand(cmd: string): Omit<TerminalLine, 'id'>[] {
  const trimmed = cmd.trim();
  const parts = trimmed.split(/\s+/);
  const command = parts[0]?.toLowerCase() ?? '';

  switch (command) {
    case '':
      return [{ type: 'output', content: '' }];
    case 'help':
      return [
        { type: 'output', content: 'Available commands:' },
        { type: 'output', content: '  ls        - List files in current directory' },
        { type: 'output', content: '  pwd       - Print working directory' },
        { type: 'output', content: '  echo      - Echo text to terminal' },
        { type: 'output', content: '  clear     - Clear terminal output' },
        { type: 'output', content: '  status    - Show AI model status' },
        { type: 'output', content: '  neofetch  - System information' },
        { type: 'output', content: '  whoami    - Current user' },
        { type: 'output', content: '  date      - Current date/time' },
        { type: 'output', content: '  help      - Show this help message' },
        { type: 'output', content: '' },
      ];
    case 'ls':
      return [
        { type: 'output', content: '\x1b[34msrc/\x1b[0m  \x1b[34mprisma/\x1b[0m  package.json  tsconfig.json  README.md  .env.local' },
      ];
    case 'pwd':
      return [{ type: 'output', content: '/home/user/my-project' }];
    case 'echo':
      return [{ type: 'output', content: parts.slice(1).join(' ') }];
    case 'whoami':
      return [{ type: 'output', content: 'massive-user' }];
    case 'date':
      return [
        { type: 'output', content: new Date().toString() },
      ];
    case 'neofetch':
      return [
        { type: 'output', content: '  OS: MASSIVE NUMBER OS 2026.6' },
        { type: 'output', content: '  Shell: mn-sh 1.0' },
        { type: 'output', content: '  AI: Connected (7 models)' },
        { type: 'output', content: '  Agent: Ready' },
        { type: 'output', content: '  Uptime: 42d 7h 13m' },
        { type: 'output', content: '' },
      ];
    case 'status':
      return [
        { type: 'success', content: '╭─ AI Model Status (All Free) ──────────────╮' },
        { type: 'success', content: '│ ✓ Gemini 2.5 Flash   Online  2.4k rpm     │' },
        { type: 'success', content: '│ ✓ Gemini 3 Flash     Online  2.1k rpm     │' },
        { type: 'success', content: '│ ✓ DeepSeek V4 Flash  Online  1.8k rpm     │' },
        { type: 'success', content: '│ ✓ DeepSeek R1        Online  1.5k rpm     │' },
        { type: 'success', content: '│ ✓ Llama 4 Scout      Online  3.2k rpm     │' },
        { type: 'success', content: '│ ✓ Llama 4 Maverick   Online  2.8k rpm     │' },
        { type: 'success', content: '│ ✓ Qwen3 Coder 480B   Online  1.6k rpm     │' },
        { type: 'success', content: '│ ✓ Qwen3.7 Max        Online  1.4k rpm     │' },
        { type: 'success', content: '│ ✓ Mistral Large      Online  1.2k rpm     │' },
        { type: 'success', content: '│ ✓ Codestral          Online  1.8k rpm     │' },
        { type: 'success', content: '│ ✓ GPT-OSS 120B       Online  4.0k rpm     │' },
        { type: 'success', content: '│ ✓ GLM 4.7 (Cerebras) Online  3.5k rpm     │' },
        { type: 'success', content: '│ ✓ Command R+         Online  1.0k rpm     │' },
        { type: 'success', content: '│ ✓ OpenRouter Free    Online  varies       │' },
        { type: 'success', content: '│ ⚙ Auto Router        Active  10+ providers │' },
        { type: 'success', content: '╰────────────────────────────────────────────╯' },
        { type: 'output', content: '' },
      ];
    case 'clear':
      return []; // Special case - caller handles it
    default:
      return [
        {
          type: 'error',
          content: `mn-sh: command not found: ${command}`,
        },
        {
          type: 'output',
          content: `Type 'help' for available commands.`,
        },
        { type: 'output', content: '' },
      ];
  }
}

// ── Terminal line renderer ──────────────────────────────────────────────────

function TerminalLineRenderer({ line }: { line: TerminalLine }) {
  switch (line.type) {
    case 'banner':
      return (
        <div className="text-emerald-400/70 font-mono text-xs leading-5 whitespace-pre">
          {line.content}
        </div>
      );
    case 'command':
      return (
        <div className="flex items-start gap-1 font-mono text-xs leading-5">
          <span className="text-emerald-400 select-none shrink-0">$</span>
          <span className="text-emerald-300">{line.content}</span>
        </div>
      );
    case 'output':
      return (
        <div className="font-mono text-xs leading-5 text-zinc-400 whitespace-pre">
          {line.content || '\u00A0'}
        </div>
      );
    case 'error':
      return (
        <div className="font-mono text-xs leading-5 text-red-400 whitespace-pre">
          {line.content}
        </div>
      );
    case 'success':
      return (
        <div className="font-mono text-xs leading-5 text-emerald-400 whitespace-pre">
          {line.content}
        </div>
      );
    default:
      return null;
  }
}

// ── Terminal Panel ──────────────────────────────────────────────────────────

let lineIdCounter = 0;
function nextId() {
  return ++lineIdCounter;
}

export default function TerminalPanel() {
  const [sessions, setSessions] = useState<TerminalSession[]>([
    {
      id: 'term-1',
      name: 'mn-sh',
      lines: WELCOME_LINES.map((l) => ({ ...l, id: nextId() })),
      history: [],
      historyIndex: -1,
    },
  ]);
  const [activeSessionId, setActiveSessionId] = useState('term-1');
  const [input, setInput] = useState('');
  const [maximized, setMaximized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeSession?.lines.length]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle command execution
  const executeCommand = useCallback(
    (cmd: string) => {
      setSessions((prev) =>
        prev.map((session) => {
          if (session.id !== activeSessionId) return session;

          const commandLine: TerminalLine = {
            id: nextId(),
            type: 'command',
            content: cmd,
          };

          if (cmd.trim().toLowerCase() === 'clear') {
            return {
              ...session,
              lines: [],
              history: [...session.history, cmd],
              historyIndex: -1,
            };
          }

          const outputLines = simulateCommand(cmd).map((l) => ({
            ...l,
            id: nextId(),
          }));

          return {
            ...session,
            lines: [...session.lines, commandLine, ...outputLines],
            history: [...session.history, cmd],
            historyIndex: -1,
          };
        })
      );
      setInput('');
    },
    [activeSessionId]
  );

  // Handle key events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        executeCommand(input);
        return;
      }

      if (!activeSession) return;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const hist = activeSession.history;
        const newIndex =
          activeSession.historyIndex === -1
            ? hist.length - 1
            : Math.max(0, activeSession.historyIndex - 1);
        if (hist[newIndex]) {
          setInput(hist[newIndex]);
          setSessions((prev) =>
            prev.map((s) =>
              s.id === activeSessionId
                ? { ...s, historyIndex: newIndex }
                : s
            )
          );
        }
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const hist = activeSession.history;
        const newIndex =
          activeSession.historyIndex === -1
            ? -1
            : Math.min(hist.length - 1, activeSession.historyIndex + 1);
        if (newIndex === -1) {
          setInput('');
        } else if (hist[newIndex]) {
          setInput(hist[newIndex]);
        }
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? { ...s, historyIndex: newIndex }
              : s
          )
        );
      }
    },
    [input, executeCommand, activeSession, activeSessionId]
  );

  // Add new terminal session
  const addSession = useCallback(() => {
    const id = `term-${Date.now()}`;
    const newSession: TerminalSession = {
      id,
      name: `mn-sh-${sessions.length + 1}`,
      lines: WELCOME_LINES.map((l) => ({ ...l, id: nextId() })),
      history: [],
      historyIndex: -1,
    };
    setSessions((prev) => [...prev, newSession]);
    setActiveSessionId(id);
    setInput('');
  }, [sessions.length]);

  // Close a session
  const closeSession = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (sessions.length <= 1) return; // Don't close the last one
      const remaining = sessions.filter((s) => s.id !== id);
      setSessions(remaining);
      if (activeSessionId === id) {
        setActiveSessionId(remaining[0].id);
      }
    },
    [sessions, activeSessionId]
  );

  return (
    <div
      className={`flex flex-col bg-[#0a0a0a] rounded-lg border border-[#262626] overflow-hidden ${
        maximized ? 'h-full' : 'h-full'
      }`}
    >
      {/* ── Tab Bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-[#262626] bg-[#111111] px-1">
        <div className="flex items-center overflow-x-auto">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => setActiveSessionId(session.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs border-r border-[#262626] whitespace-nowrap transition-colors ${
                activeSessionId === session.id
                  ? 'bg-[#0a0a0a] text-zinc-200 border-t-2 border-t-emerald-500'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-[#0f0f0f]'
              }`}
            >
              <TerminalIcon className="h-3 w-3 text-zinc-500" />
              {session.name}
              {sessions.length > 1 && (
                <span
                  onClick={(e) => closeSession(session.id, e)}
                  className="ml-1 p-0.5 rounded hover:bg-zinc-700 transition-colors"
                >
                  <X className="h-2.5 w-2.5" />
                </span>
              )}
            </button>
          ))}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-zinc-600 hover:text-zinc-300 ml-1"
            onClick={addSession}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-zinc-500 hover:text-zinc-300 mr-1"
          onClick={() => setMaximized(!maximized)}
        >
          {maximized ? (
            <Minimize2 className="h-3.5 w-3.5" />
          ) : (
            <Maximize2 className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      {/* ── Terminal Output ─────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-0 custom-scrollbar"
        onClick={() => inputRef.current?.focus()}
      >
        {activeSession?.lines.map((line) => (
          <TerminalLineRenderer key={line.id} line={line} />
        ))}
      </div>

      {/* ── Command Input ───────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2 border-t border-[#262626] bg-[#0d0d0d]">
        <ChevronRight className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a command..."
          className="flex-1 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 outline-none font-mono"
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  );
}
