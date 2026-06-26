'use client';

import { useState, useRef, useEffect, useCallback, type ComponentPropsWithoutRef } from 'react';
import {
  Send,
  Bot,
  User,
  Globe,
  Zap,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Paperclip,
  Mic,
  Code,
  MessageSquare,
  ExternalLink,
  Loader2,
  MoreVertical,
  Download,
  FileJson,
  FileText,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useChatStore, type Message } from '@/stores/chat-store';
import { useModelStore } from '@/stores/model-store';
import { useUIStore } from '@/stores/ui-store';
import { ModelSelector } from '@/components/nexus/model-selector';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion, AnimatePresence } from 'framer-motion';

/* ───────── System Prompt Personas ───────── */

interface Persona {
  id: string;
  name: string;
  icon: React.ReactNode;
  prefix: string;
  description: string;
}

const DEFAULT_PERSONA: Persona = {
  id: 'default',
  name: 'Default',
  icon: <Bot className="h-3 w-3" />,
  prefix: '',
  description: 'General-purpose AI assistant',
};

/* ───────── Code block with copy ───────── */

function CodeBlock({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<'code'> & { children?: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const codeStr = String(children).replace(/\n$/, '');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(codeStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (match) {
    return (
      <div className="group relative my-3 rounded-lg overflow-hidden border border-border/50">
        <div className="flex items-center justify-between bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground">
          <span className="font-mono">{language}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-muted transition-colors"
            aria-label="Copy code"
          >
            {copied ? (
              <Check className="h-3 w-3 text-emerald-400" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
        <SyntaxHighlighter
          style={oneDark}
          language={language}
          PreTag="div"
          customStyle={{
            margin: 0,
            padding: '0.75rem',
            background: 'rgb(30, 30, 30)',
            fontSize: '0.8125rem',
            lineHeight: '1.5',
          }}
        >
          {codeStr}
        </SyntaxHighlighter>
      </div>
    );
  }

  return (
    <code
      className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono"
      {...props}
    >
      {children}
    </code>
  );
}

/* ───────── Blinking cursor ───────── */

function BlinkingCursor() {
  return (
    <span className="inline-block w-2 h-4 ml-0.5 bg-foreground/70 animate-pulse rounded-sm align-text-bottom" />
  );
}

/* ───────── Token Counter ───────── */

function estimateTokens(text: string): number {
  // Rough estimation: ~4 chars per token for English text
  return Math.ceil(text.length / 4);
}

/* ───────── Message component ───────── */

function ChatMessage({
  message,
  isStreaming,
  isLastAssistant,
  onRegenerate,
}: {
  message: Message;
  isStreaming?: boolean;
  isLastAssistant?: boolean;
  onRegenerate?: () => void;
}) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-3 px-4 py-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <Avatar className="h-8 w-8 shrink-0 mt-0.5">
        <AvatarFallback
          className={
            isUser
              ? 'bg-emerald-600 text-white text-xs'
              : 'bg-gradient-to-br from-amber-500 to-orange-600 text-white text-xs'
          }
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div
        className={`flex flex-col gap-1 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}
      >
        {/* Name */}
        <span className="text-xs font-medium text-muted-foreground">
          {isUser ? 'You' : 'MASSIVE NUMBER'}
        </span>

        {/* Message bubble */}
        <div
          className={`rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'bg-emerald-600/15 text-foreground rounded-tr-sm'
              : 'bg-card border border-border/50 text-foreground rounded-tl-sm'
          }`}
        >
          {isAssistant ? (
            <div className="prose prose-sm prose-invert max-w-none break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              <ReactMarkdown
                components={{
                  code: CodeBlock as never,
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => (
                    <ul className="mb-2 list-disc pl-4 space-y-1">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-2 list-decimal pl-4 space-y-1">{children}</ol>
                  ),
                  h1: ({ children }) => (
                    <h1 className="text-lg font-bold mt-4 mb-2">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-base font-bold mt-3 mb-1.5">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-sm font-bold mt-2 mb-1">{children}</h3>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:underline inline-flex items-center gap-0.5"
                    >
                      {children}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-emerald-500/50 pl-3 italic text-muted-foreground">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
              {isStreaming && <BlinkingCursor />}
            </div>
          ) : (
            <span className="whitespace-pre-wrap">{message.content}</span>
          )}
        </div>

        {/* Sources */}
        {isAssistant && message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {message.sources.map((source, i) => (
              <a
                key={i}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Globe className="h-3 w-3" />
                <span className="max-w-[150px] truncate">{source.name}</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            ))}
          </div>
        )}

        {/* Metadata footer */}
        {isAssistant && message.model && !isStreaming && (
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-mono">
              {message.model}
            </Badge>
            {message.tokens !== undefined && message.tokens > 0 && (
              <span className="text-[10px] text-muted-foreground">
                {message.tokens} tokens
              </span>
            )}
            {message.cost !== undefined && message.cost > 0 && (
              <span className="text-[10px] text-muted-foreground">
                ${(message.cost / 1000).toFixed(4)}
              </span>
            )}
            {message.duration !== undefined && message.duration > 0 && (
              <span className="text-[10px] text-muted-foreground">
                {(message.duration / 1000).toFixed(1)}s
              </span>
            )}
            {/* Regenerate button for last assistant message */}
            {isLastAssistant && onRegenerate && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 px-1.5 text-[9px] text-muted-foreground hover:text-foreground"
                onClick={onRegenerate}
              >
                <RefreshCw className="h-3 w-3 mr-0.5" />
                Regenerate
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ───────── Empty state ───────── */

const SUGGESTIONS = [
  { icon: <Code className="h-4 w-4" />, label: 'Build a REST API', desc: 'Create endpoints with validation' },
  { icon: <Sparkles className="h-4 w-4" />, label: 'Create a React component', desc: 'Build reusable UI components' },
  { icon: <Zap className="h-4 w-4" />, label: 'Debug this error', desc: 'Analyze and fix code issues' },
  { icon: <Globe className="h-4 w-4" />, label: 'Search the web for...', desc: 'Get real-time information' },
];

function EmptyState({ onSuggestionClick }: { onSuggestionClick: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-6 max-w-md"
      >
        {/* Branding */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Bot className="h-8 w-8 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center ring-2 ring-background">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-2">
            MASSIVE NUMBER
          </h1>
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            Your AI coding superpower. Chat with any model, search the web,
            and let agents build for you.
          </p>
        </div>

        {/* Suggestions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion.label}
              onClick={() => onSuggestionClick(suggestion.label)}
              className="flex items-start gap-3 rounded-lg border border-border/50 bg-card p-3 text-left hover:bg-accent/50 hover:border-border transition-all group"
            >
              <span className="mt-0.5 text-muted-foreground group-hover:text-foreground transition-colors">
                {suggestion.icon}
              </span>
              <div>
                <div className="text-sm font-medium group-hover:text-foreground transition-colors">
                  {suggestion.label}
                </div>
                <div className="text-xs text-muted-foreground">{suggestion.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ───────── Main Chat Panel ───────── */

export function ChatPanel() {
  const [input, setInput] = useState('');
  const [webGrounding, setWebGrounding] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activePersona, setActivePersona] = useState<string>('default');
  const [personas, setPersonas] = useState<Persona[]>([DEFAULT_PERSONA]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/personas')
      .then(res => res.json())
      .then(data => {
        const fetched = (data.personas || []).map((p: { id: string; name: string; description: string; systemPrompt: string }) => ({
          id: p.id,
          name: p.name,
          icon: <Bot className="h-3 w-3" />,
          prefix: p.systemPrompt || '',
          description: p.description || '',
        }));
        setPersonas([DEFAULT_PERSONA, ...fetched]);
      })
      .catch(() => {});
  }, []);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const streamingMsgIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { chats, activeChatId, isStreaming, createChat, addMessage, updateMessage, setStreaming, clearChats } =
    useChatStore();
  const { selectedModel } = useModelStore();
  const { addToast } = useUIStore();

  const activeChat = chats.find((c) => c.id === activeChatId);
  const tokenCount = estimateTokens(input);
  const currentPersona = personas.find((p) => p.id === activePersona) || DEFAULT_PERSONA;

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeChat?.messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  // Simulated streaming: reveal text character by character
  const simulateStreaming = useCallback(async (chatId: string, msgId: string, fullContent: string, model: string, tokens: number, cost: number, duration: number) => {
    const chunkSize = 3;
    let revealed = '';
    for (let i = 0; i < fullContent.length; i += chunkSize) {
      if (abortControllerRef.current?.signal.aborted) break;
      revealed += fullContent.slice(i, i + chunkSize);
      updateMessage(chatId, msgId, { content: revealed });
      await new Promise(r => setTimeout(r, 12));
    }
    // Final update with metadata
    updateMessage(chatId, msgId, {
      content: fullContent,
      model,
      tokens,
      cost,
      duration,
      isStreaming: false,
    });
    setStreaming(false);
    streamingMsgIdRef.current = null;
  }, [updateMessage, setStreaming]);

  const sendMessage = useCallback(async (text: string, personaPrefix?: string) => {
    if (!text.trim() || isStreaming) return;

    let chatId = activeChatId;
    if (!chatId) {
      chatId = createChat(selectedModel, 'chat');
    }

    // Add user message
    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    addMessage(chatId, userMsg);

    // Create placeholder assistant message
    const assistantMsgId = `msg-${Date.now()}-assistant`;
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      model: selectedModel,
      isStreaming: true,
      timestamp: new Date(),
    };
    addMessage(chatId, assistantMsg);
    streamingMsgIdRef.current = assistantMsgId;
    setStreaming(true);

    // Create abort controller for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Call the REST API
      const allMessages = [...(activeChat?.messages || []), userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Add persona prefix as system message if present
      const systemPrefix = personaPrefix || currentPersona.prefix;
      if (systemPrefix) {
        allMessages.unshift({ role: 'system', content: systemPrefix });
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages,
          model: selectedModel,
          mode: 'chat',
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();

      // Simulate streaming with the full response
      const content = data.content || data.message?.content || 'No response received.';
      const model = data.model || selectedModel;
      const tokens = data.tokens || data.usage?.total_tokens || Math.ceil(content.length / 4);
      const cost = data.cost || (tokens * 0.003);
      const duration = data.duration || 0;

      await simulateStreaming(chatId, assistantMsgId, content, model, tokens, cost, duration);
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // Fallback: show error message but also try socket.io
      updateMessage(chatId, assistantMsgId, {
        content: `I encountered an issue connecting to the AI service (${errorMessage}). Let me try an alternative approach...\n\n**Note:** Make sure your API keys are configured in Settings → Providers. MASSIVE NUMBER supports OpenAI, Anthropic, Google, DeepSeek, Meta, and more.`,
        model: selectedModel,
        tokens: 0,
        cost: 0,
        duration: 0,
        isStreaming: false,
      });
      setStreaming(false);
      streamingMsgIdRef.current = null;
      addToast('Chat: Using fallback mode. Configure API keys in Settings.', 'info');
    }
  }, [
    isStreaming,
    activeChatId,
    selectedModel,
    activeChat,
    currentPersona,
    createChat,
    addMessage,
    updateMessage,
    setStreaming,
    simulateStreaming,
    addToast,
  ]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await sendMessage(text);
  }, [input, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (text: string) => {
    setInput(text);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleRegenerate = useCallback(async () => {
    if (!activeChat || isStreaming) return;
    const messages = activeChat.messages;
    // Find the last user message
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg) return;
    await sendMessage(lastUserMsg.content, currentPersona.prefix);
  }, [activeChat, isStreaming, sendMessage, currentPersona]);

  /* ───────── Export Functions ───────── */

  const exportAsMarkdown = useCallback(() => {
    if (!activeChat) return;
    const lines: string[] = [`# ${activeChat.title}\n`];
    activeChat.messages.forEach((msg) => {
      if (msg.role === 'user') {
        lines.push(`## You\n\n${msg.content}\n`);
      } else if (msg.role === 'assistant') {
        lines.push(`## MASSIVE NUMBER${msg.model ? ` (${msg.model})` : ''}\n\n${msg.content}\n`);
        if (msg.tokens) lines.push(`*${msg.tokens} tokens | ${(msg.duration || 0) / 1000}s*\n`);
      }
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeChat.title.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Chat exported as Markdown', 'success');
  }, [activeChat, addToast]);

  const exportAsJSON = useCallback(() => {
    if (!activeChat) return;
    const data = {
      title: activeChat.title,
      model: activeChat.model,
      mode: activeChat.mode,
      exportedAt: new Date().toISOString(),
      messages: activeChat.messages.map((m) => ({
        role: m.role,
        content: m.content,
        model: m.model,
        tokens: m.tokens,
        duration: m.duration,
        timestamp: m.timestamp,
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeChat.title.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Chat exported as JSON', 'success');
  }, [activeChat, addToast]);

  const handleClearChat = useCallback(() => {
    clearChats();
    addToast('Chat cleared', 'info');
  }, [clearChats, addToast]);

  // Find last assistant message for regenerate button
  const lastAssistantMsgId = activeChat
    ? [...activeChat.messages].reverse().find((m) => m.role === 'assistant' && !m.isStreaming)?.id
    : null;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Chat header with export menu */}
      {activeChat && activeChat.messages.length > 0 && (
        <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-border/30 bg-card/30">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
              {activeChat.title}
            </span>
            <Badge variant="secondary" className="text-[8px] h-4 px-1.5 font-mono">
              {activeChat.messages.length} msgs
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={exportAsMarkdown} className="text-xs">
                <FileText className="h-3.5 w-3.5 mr-2" />
                Export as Markdown
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportAsJSON} className="text-xs">
                <FileJson className="h-3.5 w-3.5 mr-2" />
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleClearChat} className="text-xs text-red-400 focus:text-red-400">
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Clear Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Messages area */}
      {activeChat && activeChat.messages.length > 0 ? (
        <ScrollArea className="flex-1">
          <div ref={scrollRef} className="max-w-3xl mx-auto py-4">
            <AnimatePresence initial={false}>
              {activeChat.messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  isStreaming={msg.isStreaming}
                  isLastAssistant={msg.id === lastAssistantMsgId}
                  onRegenerate={msg.id === lastAssistantMsgId ? handleRegenerate : undefined}
                />
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      ) : (
        <div className="flex-1 overflow-auto">
          <EmptyState onSuggestionClick={handleSuggestionClick} />
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-3">
          {/* Top row: model selector + persona + toggles */}
          <div className="flex items-center gap-1 mb-2">
            <ModelSelector />

            {/* Persona Selector */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 text-[10px] px-2 gap-1 ${
                    activePersona !== 'default'
                      ? 'text-amber-400 bg-amber-400/10'
                      : 'text-muted-foreground'
                  }`}
                >
                  {currentPersona.icon}
                  <span className="hidden sm:inline">{currentPersona.name}</span>
                  <ChevronDown className="h-2.5 w-2.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="start">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-medium text-muted-foreground px-2 py-1 uppercase tracking-wider">
                    AI Persona
                  </p>
                  {personas.map((persona) => (
                    <button
                      key={persona.id}
                      onClick={() => setActivePersona(persona.id)}
                      className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-left transition-colors ${
                        activePersona === persona.id
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'hover:bg-muted/50 text-foreground'
                      }`}
                    >
                      <span className={`shrink-0 ${activePersona === persona.id ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                        {persona.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium">{persona.name}</div>
                        <div className="text-[9px] text-muted-foreground truncate">{persona.description}</div>
                      </div>
                      {activePersona === persona.id && (
                        <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <div className="flex-1" />
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 ${
                      webGrounding ? 'text-emerald-400 bg-emerald-400/10' : 'text-muted-foreground'
                    }`}
                    onClick={() => setWebGrounding(!webGrounding)}
                  >
                    <Globe className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Web Grounding {webGrounding ? 'ON' : 'OFF'}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Attach file</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 ${
                      isListening ? 'text-red-400 bg-red-400/10' : 'text-muted-foreground'
                    }`}
                    onClick={() => setIsListening(!isListening)}
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Voice input {isListening ? '(listening...)' : ''}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Input row */}
          <div className="flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything... (Shift+Enter for new line)"
              className="min-h-[40px] max-h-[200px] resize-none bg-card border-border/50 focus-visible:ring-emerald-500/30 placeholder:text-muted-foreground/60"
              rows={1}
              disabled={isStreaming}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              size="icon"
              className="h-10 w-10 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 transition-all"
            >
              {isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Bottom hint with token counter */}
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-muted-foreground/50">
              <MessageSquare className="h-3 w-3 inline mr-1" />
              Powered by MASSIVE NUMBER · Multi-model orchestration
            </span>
            {input.length > 0 && (
              <span className="text-[10px] text-muted-foreground/50 tabular-nums">
                ≈{tokenCount} tokens
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
