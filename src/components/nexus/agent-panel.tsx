'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  Zap,
  Brain,
  Code,
  Search,
  Wrench,
  Shield,
  Sparkles,
  Clock,
  Coins,
  Activity,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { ModelSelector } from '@/components/nexus/model-selector';
import { useAgentStore, type AgentStep } from '@/stores/agent-store';
import { useModelStore } from '@/stores/model-store';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';

const STEP_ICONS: React.ReactNode[] = [
  <Brain key="brain" className="h-4 w-4" />,
  <Search key="search" className="h-4 w-4" />,
  <Sparkles key="sparkles" className="h-4 w-4" />,
  <Code key="code" className="h-4 w-4" />,
  <Shield key="shield" className="h-4 w-4" />,
  <Wrench key="wrench" className="h-4 w-4" />,
];

const STEP_COLORS: string[] = [
  'text-violet-400',
  'text-cyan-400',
  'text-amber-400',
  'text-emerald-400',
  'text-rose-400',
  'text-teal-400',
];

function StepIcon({ step, index }: { step: AgentStep; index: number }) {
  const color = STEP_COLORS[index] || 'text-muted-foreground';

  if (step.status === 'running') {
    return <Loader2 className={`h-4 w-4 animate-spin ${color}`} />;
  }
  if (step.status === 'completed') {
    return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
  }
  if (step.status === 'error') {
    return <XCircle className="h-4 w-4 text-red-400" />;
  }
  return <span className={color}>{STEP_ICONS[index]}</span>;
}

function StepPipeline({ steps }: { steps: AgentStep[] }) {
  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const progress = (completedCount / steps.length) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Pipeline Progress
        </span>
        <span className="text-xs text-muted-foreground">
          {completedCount}/{steps.length} steps
        </span>
      </div>
      <Progress value={progress} className="h-1.5 bg-muted" />

      {/* Step cards */}
      <div className="space-y-1.5">
        {steps.map((step, i) => (
          <motion.div
            key={step.id}
            initial={false}
            animate={{
              opacity: step.status === 'pending' ? 0.5 : 1,
              scale: step.status === 'running' ? 1.01 : 1,
            }}
            transition={{ duration: 0.2 }}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
              step.status === 'running'
                ? 'bg-accent border border-border'
                : step.status === 'completed'
                ? 'bg-emerald-500/5'
                : 'bg-transparent'
            }`}
          >
            <StepIcon step={step} index={i} />
            <span
              className={`text-sm flex-1 ${
                step.status === 'pending'
                  ? 'text-muted-foreground'
                  : 'text-foreground'
              }`}
            >
              {step.name}
            </span>
            {step.status === 'completed' && (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            )}
            {step.status === 'running' && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
            )}
            {step.status === 'error' && (
              <XCircle className="h-3.5 w-3.5 text-red-400" />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function AgentResultCard({
  agent,
}: {
  agent: {
    result?: string;
    tokens: number;
    cost: number;
    duration: number;
    model: string;
  };
}) {
  return (
    <Card className="border-emerald-500/20 bg-emerald-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          Agent Result
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
          {agent.result || 'No result'}
        </p>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Coins className="h-3 w-3" />
            <span>${(agent.cost / 1000).toFixed(4)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Zap className="h-3 w-3" />
            <span>{agent.tokens} tokens</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{(agent.duration / 1000).toFixed(1)}s</span>
          </div>
          <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-mono">
            {agent.model}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function AgentHistoryItem({
  agent,
  onSelect,
  isActive,
}: {
  agent: {
    id: string;
    name: string;
    status: string;
    createdAt: Date;
    model: string;
  };
  onSelect: () => void;
  isActive: boolean;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
        isActive ? 'bg-accent border border-border' : 'hover:bg-accent/50'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{agent.name}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge
            variant={
              agent.status === 'completed'
                ? 'default'
                : agent.status === 'error'
                ? 'destructive'
                : 'secondary'
            }
            className="text-[10px] h-4 px-1"
          >
            {agent.status}
          </Badge>
          <span className="text-[10px] text-muted-foreground font-mono">
            {agent.model}
          </span>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </button>
  );
}

export function AgentPanel() {
  const [taskInput, setTaskInput] = useState('');
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    agents,
    activeAgentId,
    isRunning,
    createAgent,
    setActiveAgent,
    updateAgentStep,
    completeAgent,
    errorAgent,
    setIsRunning,
  } = useAgentStore();
  const { selectedModel } = useModelStore();

  const activeAgent = agents.find((a) => a.id === activeAgentId);

  // Socket.io connection
  useEffect(() => {
    const s = io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
    });
    s.on('connect', () => {
      console.log('Agent socket connected:', s.id);
    });
    s.on('agent:step', (data: { agentId: string; step: number; total: number; name: string; status: string }) => {
      const stepIndex = data.step - 1;
      if (data.status === 'running') {
        updateAgentStep(data.agentId, stepIndex, {
          name: data.name,
          status: 'running',
        });
      } else if (data.status === 'completed') {
        updateAgentStep(data.agentId, stepIndex, {
          name: data.name,
          status: 'completed',
        });
      }
    });
    s.on('agent:complete', (data: { agentId: string; result: string; tokens: number; duration: number }) => {
      completeAgent(
        data.agentId,
        data.result,
        data.tokens,
        data.tokens * 0.003,
        data.duration
      );
    });
    socketRef.current = s;
    return () => {
      s.disconnect();
    };
  }, [updateAgentStep, completeAgent]);

  const handleLaunchAgent = () => {
    const task = taskInput.trim();
    if (!task || isRunning) return;

    const agentId = createAgent(task, task, selectedModel);
    setIsRunning(true);
    setTaskInput('');

    if (socketRef.current) {
      socketRef.current.emit('agent:execute', {
        agentId,
        name: task,
        model: selectedModel,
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Agent creation form */}
      <div className="border-b border-border/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Agent Mode</h2>
            <p className="text-xs text-muted-foreground">
              Launch autonomous coding agents
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Textarea
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            placeholder="Describe the task for the agent..."
            className="min-h-[60px] max-h-[120px] resize-none bg-card border-border/50 placeholder:text-muted-foreground/60"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleLaunchAgent();
              }
            }}
          />
          <div className="flex items-center gap-2">
            <ModelSelector />
            <div className="flex-1" />
            <Button
              onClick={handleLaunchAgent}
              disabled={!taskInput.trim() || isRunning}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-9"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  Launch Agent
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Active agent view */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-4 space-y-4">
          {activeAgent ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeAgent.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Agent header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">{activeAgent.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge
                        variant={
                          activeAgent.status === 'completed'
                            ? 'default'
                            : activeAgent.status === 'error'
                            ? 'destructive'
                            : activeAgent.status === 'running'
                            ? 'secondary'
                            : 'outline'
                        }
                        className="text-[10px] h-5 px-1.5"
                      >
                        {activeAgent.status === 'running' ? (
                          <span className="flex items-center gap-1">
                            <Activity className="h-3 w-3 animate-pulse" />
                            Running
                          </span>
                        ) : (
                          activeAgent.status
                        )}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {activeAgent.model}
                      </span>
                    </div>
                  </div>
                  {activeAgent.status === 'completed' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => {
                        setTaskInput(activeAgent.name);
                      }}
                    >
                      <RotateCcw className="h-3 w-3" />
                      Retry
                    </Button>
                  )}
                </div>

                {/* Step pipeline */}
                <StepPipeline steps={activeAgent.steps} />

                {/* Result */}
                {activeAgent.status === 'completed' && (
                  <AgentResultCard agent={activeAgent} />
                )}

                {/* Error state */}
                {activeAgent.status === 'error' && (
                  <Card className="border-red-500/20 bg-red-500/5">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-red-400">
                        <XCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Agent failed</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {activeAgent.result || 'Unknown error'}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
                <Bot className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                No active agent. Describe a task above to launch one.
              </p>
            </div>
          )}

          {/* Agent history */}
          {agents.length > 1 && (
            <div className="pt-4 border-t border-border/30">
              <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                Agent History
              </h4>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {agents
                  .filter((a) => a.id !== activeAgentId)
                  .map((agent) => (
                    <AgentHistoryItem
                      key={agent.id}
                      agent={agent}
                      isActive={agent.id === activeAgentId}
                      onSelect={() => setActiveAgent(agent.id)}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
