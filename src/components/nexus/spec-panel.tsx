'use client';

import { useState } from 'react';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  Circle,
  ChevronRight,
  Play,
  Loader2,
  ListChecks,
  FileCode,
  TestTube2,
  ArrowRight,
  Plus,
  Clock,
  Zap,
  AlertCircle,
  Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ───────────────────────────────────────────────────────────────

type SpecStatus = 'draft' | 'approved' | 'implementing' | 'complete';
type Complexity = 'low' | 'medium' | 'high';

interface SpecRequirement {
  id: string;
  text: string;
  checked: boolean;
}

interface ImplementationStep {
  id: string;
  name: string;
  description: string;
  completed: boolean;
}

interface TestCriterion {
  id: string;
  text: string;
  passed: boolean;
}

interface Spec {
  id: string;
  title: string;
  description: string;
  requirements: SpecRequirement[];
  designNotes: string;
  implementationSteps: ImplementationStep[];
  testCriteria: TestCriterion[];
  complexity: Complexity;
  affectedFiles: string[];
  status: SpecStatus;
  createdAt: string;
}

// ── Data ────────────────────────────────────────────────────────────────

const COMPLEXITY_CONFIG: Record<Complexity, { color: string; bg: string; label: string }> = {
  low: { color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30', label: 'Low' },
  medium: { color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30', label: 'Medium' },
  high: { color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30', label: 'High' },
};

const STATUS_CONFIG: Record<SpecStatus, { color: string; bg: string; label: string; icon: React.ElementType }> = {
  draft: { color: 'text-zinc-400', bg: 'bg-zinc-500/15 border-zinc-500/30', label: 'Draft', icon: Circle },
  approved: { color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30', label: 'Approved', icon: CheckCircle2 },
  implementing: { color: 'text-teal-400', bg: 'bg-teal-500/15 border-teal-500/30', label: 'Implementing', icon: Loader2 },
  complete: { color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30', label: 'Complete', icon: Check },
};

const STATUS_FLOW: SpecStatus[] = ['draft', 'approved', 'implementing', 'complete'];

const SAMPLE_SPECS: Spec[] = [
  {
    id: 'spec-1',
    title: 'Real-time Chat Streaming',
    description: 'Implement WebSocket-based streaming for AI chat responses',
    requirements: [
      { id: 'r1', text: 'Connect to WebSocket service on port 3003', checked: true },
      { id: 'r2', text: 'Stream tokens incrementally in chat UI', checked: true },
      { id: 'r3', text: 'Handle reconnection on disconnect', checked: true },
      { id: 'r4', text: 'Show typing indicator during streaming', checked: true },
    ],
    designNotes: 'Use socket.io-client with XTransformPort gateway routing. Each message chunk should animate in with framer-motion.',
    implementationSteps: [
      { id: 's1', name: 'Setup socket connection', description: 'Initialize socket.io client with reconnection', completed: true },
      { id: 's2', name: 'Add streaming state', description: 'Create Zustand store for streaming state', completed: true },
      { id: 's3', name: 'Build message renderer', description: 'Animate tokens as they arrive', completed: true },
      { id: 's4', name: 'Add error handling', description: 'Handle disconnects and retries gracefully', completed: true },
    ],
    testCriteria: [
      { id: 't1', text: 'Messages stream without visible delay', passed: true },
      { id: 't2', text: 'Reconnects within 3 seconds', passed: true },
      { id: 't3', text: 'No duplicate tokens on reconnect', passed: true },
    ],
    complexity: 'medium',
    affectedFiles: ['chat-panel.tsx', 'chat-store.ts', 'ws-service/index.ts'],
    status: 'complete',
    createdAt: '2 days ago',
  },
  {
    id: 'spec-2',
    title: 'MCP Integration Hub',
    description: 'Visual hub for managing all MCP server connections and tools',
    requirements: [
      { id: 'r1', text: 'Display all available MCP servers in a grid', checked: true },
      { id: 'r2', text: 'Toggle server connections on/off', checked: true },
      { id: 'r3', text: 'Expand servers to view available tools', checked: true },
      { id: 'r4', text: 'Filter by category and search', checked: true },
      { id: 'r5', text: 'Execute tools directly from the hub', checked: false },
    ],
    designNotes: 'Use a card grid with expand/collapse for tools. Connected servers have emerald border. Category pills at top.',
    implementationSteps: [
      { id: 's1', name: 'Define server data model', description: 'Create TypeScript types and sample data', completed: true },
      { id: 's2', name: 'Build server grid', description: 'Card layout with filters and search', completed: true },
      { id: 's3', name: 'Add connection toggle', description: 'Switch component with state management', completed: true },
      { id: 's4', name: 'Implement tool expansion', description: 'Animated expand/collapse for tool list', completed: true },
      { id: 's5', name: 'Add tool execution', description: 'Execute button with feedback', completed: false },
    ],
    testCriteria: [
      { id: 't1', text: 'All 12 servers display correctly', passed: true },
      { id: 't2', text: 'Category filters work correctly', passed: true },
      { id: 't3', text: 'Connection toggle persists state', passed: true },
      { id: 't4', text: 'Tool execution returns results', passed: false },
    ],
    complexity: 'high',
    affectedFiles: ['mcp-hub.tsx', 'api/mcp/route.ts', 'stores/mcp-store.ts'],
    status: 'implementing',
    createdAt: '1 day ago',
  },
];

// ── Component ───────────────────────────────────────────────────────────

export function SpecPanel() {
  const [specs, setSpecs] = useState<Spec[]>(SAMPLE_SPECS);
  const [selectedSpec, setSelectedSpec] = useState<string | null>('spec-2');
  const [newSpecDesc, setNewSpecDesc] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showNewSpec, setShowNewSpec] = useState(false);

  const activeSpec = specs.find((s) => s.id === selectedSpec);

  const handleGenerateSpec = () => {
    if (!newSpecDesc.trim()) return;
    setIsGenerating(true);
    setTimeout(() => {
      const newSpec: Spec = {
        id: `spec-${Date.now()}`,
        title: newSpecDesc.length > 40 ? newSpecDesc.substring(0, 40) + '...' : newSpecDesc,
        description: newSpecDesc,
        requirements: [
          { id: `r-${Date.now()}-1`, text: 'Define core functionality and user flows', checked: false },
          { id: `r-${Date.now()}-2`, text: 'Implement data models and API endpoints', checked: false },
          { id: `r-${Date.now()}-3`, text: 'Build UI components with proper state management', checked: false },
          { id: `r-${Date.now()}-4`, text: 'Add error handling and edge cases', checked: false },
          { id: `r-${Date.now()}-5`, text: 'Write integration tests', checked: false },
        ],
        designNotes: 'AI-generated design notes based on the specification description. Follow platform conventions for component structure and state management.',
        implementationSteps: [
          { id: `s-${Date.now()}-1`, name: 'Analyze requirements', description: 'Break down the specification into actionable tasks', completed: false },
          { id: `s-${Date.now()}-2`, name: 'Design data model', description: 'Define TypeScript types and store schema', completed: false },
          { id: `s-${Date.now()}-3`, name: 'Build API layer', description: 'Create API routes with proper validation', completed: false },
          { id: `s-${Date.now()}-4`, name: 'Implement UI', description: 'Build components with dark theme and animations', completed: false },
          { id: `s-${Date.now()}-5`, name: 'Add tests', description: 'Write unit and integration tests', completed: false },
        ],
        testCriteria: [
          { id: `t-${Date.now()}-1`, text: 'Feature works as specified', passed: false },
          { id: `t-${Date.now()}-2`, text: 'No console errors or warnings', passed: false },
          { id: `t-${Date.now()}-3`, text: 'Responsive on all screen sizes', passed: false },
        ],
        complexity: 'medium' as Complexity,
        affectedFiles: ['new-component.tsx', 'api/new-route.ts', 'stores/new-store.ts'],
        status: 'draft',
        createdAt: 'Just now',
      };
      setSpecs((prev) => [newSpec, ...prev]);
      setSelectedSpec(newSpec.id);
      setIsGenerating(false);
      setNewSpecDesc('');
      setShowNewSpec(false);
    }, 2000);
  };

  const handleStatusChange = (specId: string, newStatus: SpecStatus) => {
    setSpecs((prev) =>
      prev.map((s) => {
        if (s.id !== specId) return s;
        if (newStatus === 'implementing') {
          return {
            ...s,
            status: newStatus,
            implementationSteps: s.implementationSteps.map((step, i) => ({
              ...step,
              completed: i < 2,
            })),
          };
        }
        if (newStatus === 'complete') {
          return {
            ...s,
            status: newStatus,
            requirements: s.requirements.map((r) => ({ ...r, checked: true })),
            implementationSteps: s.implementationSteps.map((st) => ({ ...st, completed: true })),
            testCriteria: s.testCriteria.map((t) => ({ ...t, passed: true })),
          };
        }
        return { ...s, status: newStatus };
      })
    );
  };

  const getStatusIndex = (status: SpecStatus) => STATUS_FLOW.indexOf(status);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Spec-to-Code Pipeline</h2>
              <p className="text-[10px] text-muted-foreground">AI-generated specs → implementation</p>
            </div>
          </div>
          <Button
            size="sm"
            className="h-6 text-[9px] gap-1"
            onClick={() => setShowNewSpec(!showNewSpec)}
          >
            <Plus className="h-3 w-3" />
            New Spec
          </Button>
        </div>

        {/* New spec form */}
        <AnimatePresence>
          {showNewSpec && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-3 rounded-lg border border-border bg-card/50 mb-3">
                <Textarea
                  value={newSpecDesc}
                  onChange={(e) => setNewSpecDesc(e.target.value)}
                  placeholder="Describe what you want to build... (e.g., 'Add user authentication with OAuth2 support')"
                  className="h-20 text-[10px] resize-none mb-2"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[9px]"
                    onClick={() => setShowNewSpec(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="h-6 text-[9px] gap-1"
                    disabled={!newSpecDesc.trim() || isGenerating}
                    onClick={handleGenerateSpec}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3" />
                        Generate Spec
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Separator className="shrink-0" />

      {/* Main content */}
      <div className="flex-1 min-h-0 flex">
        {/* Left: Spec list */}
        <div className="w-[35%] flex flex-col border-r border-border/30 min-h-0">
          <div className="shrink-0 px-3 py-2">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Specifications
            </span>
          </div>
          <ScrollArea className="flex-1 min-h-0">
            <div className="px-2 space-y-1">
              {specs.map((spec) => {
                const statusCfg = STATUS_CONFIG[spec.status];
                const StatusIcon = statusCfg.icon;
                const complexityCfg = COMPLEXITY_CONFIG[spec.complexity];
                const isSelected = selectedSpec === spec.id;

                return (
                  <button
                    key={spec.id}
                    onClick={() => setSelectedSpec(spec.id)}
                    className={`w-full text-left p-2.5 rounded-md transition-colors ${
                      isSelected
                        ? 'bg-emerald-500/10 border border-emerald-500/20'
                        : 'hover:bg-muted/30 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-semibold block truncate">
                          {spec.title}
                        </span>
                        <span className="text-[8px] text-muted-foreground block mt-0.5">
                          {spec.createdAt}
                        </span>
                      </div>
                      <Badge
                        className={`text-[7px] h-4 px-1.5 border ${statusCfg.bg} ${statusCfg.color} shrink-0`}
                        variant="outline"
                      >
                        <StatusIcon className={`h-2 w-2 mr-0.5 ${spec.status === 'implementing' ? 'animate-spin' : ''}`} />
                        {statusCfg.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Badge
                        className={`text-[7px] h-3.5 px-1 border ${complexityCfg.bg} ${complexityCfg.color}`}
                        variant="outline"
                      >
                        {complexityCfg.label}
                      </Badge>
                      <span className="text-[8px] text-muted-foreground">
                        {spec.requirements.filter((r) => r.checked).length}/{spec.requirements.length} reqs
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Right: Spec detail */}
        <div className="flex-1 min-h-0">
          {activeSpec ? (
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                {/* Title + Status flow */}
                <div>
                  <h3 className="text-sm font-bold">{activeSpec.title}</h3>
                  <p className="text-[10px] text-muted-foreground mt-1">{activeSpec.description}</p>

                  {/* Status flow */}
                  <div className="flex items-center gap-1 mt-3">
                    {STATUS_FLOW.map((status, i) => {
                      const cfg = STATUS_CONFIG[status];
                      const currentIndex = getStatusIndex(activeSpec.status);
                      const isCompleted = i <= currentIndex;
                      const isCurrent = status === activeSpec.status;

                      return (
                        <div key={status} className="flex items-center gap-1">
                          {i > 0 && (
                            <ArrowRight className={`h-3 w-3 ${i <= currentIndex ? 'text-emerald-400' : 'text-muted-foreground/30'}`} />
                          )}
                          <div
                            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[8px] font-medium ${
                              isCurrent
                                ? `${cfg.bg} ${cfg.color} border`
                                : isCompleted
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : 'text-muted-foreground/40'
                            }`}
                          >
                            {isCompleted && !isCurrent && <Check className="h-2 w-2" />}
                            {cfg.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* Requirements */}
                <div>
                  <h4 className="text-[10px] font-semibold flex items-center gap-1.5 mb-2">
                    <ListChecks className="h-3 w-3 text-amber-400" />
                    Requirements
                    <span className="text-muted-foreground font-normal">
                      ({activeSpec.requirements.filter((r) => r.checked).length}/{activeSpec.requirements.length})
                    </span>
                  </h4>
                  <div className="space-y-1.5">
                    {activeSpec.requirements.map((req) => (
                      <div key={req.id} className="flex items-start gap-2 text-[10px]">
                        {req.checked ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 mt-0.5" />
                        )}
                        <span className={req.checked ? 'text-muted-foreground line-through' : ''}>
                          {req.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Design Notes */}
                <div>
                  <h4 className="text-[10px] font-semibold flex items-center gap-1.5 mb-2">
                    <FileText className="h-3 w-3 text-teal-400" />
                    Design Notes
                  </h4>
                  <p className="text-[10px] text-muted-foreground bg-muted/20 p-2 rounded-md">
                    {activeSpec.designNotes}
                  </p>
                </div>

                {/* Implementation Steps */}
                <div>
                  <h4 className="text-[10px] font-semibold flex items-center gap-1.5 mb-2">
                    <FileCode className="h-3 w-3 text-amber-400" />
                    Implementation Steps
                    <span className="text-muted-foreground font-normal">
                      ({activeSpec.implementationSteps.filter((s) => s.completed).length}/{activeSpec.implementationSteps.length})
                    </span>
                  </h4>
                  <div className="space-y-2">
                    {activeSpec.implementationSteps.map((step, i) => (
                      <div
                        key={step.id}
                        className={`flex items-start gap-2 p-2 rounded-md ${
                          step.completed ? 'bg-emerald-500/5' : 'bg-muted/20'
                        }`}
                      >
                        <div className="flex items-center justify-center h-5 w-5 rounded-full bg-muted/50 text-[8px] font-bold shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-medium ${step.completed ? 'text-emerald-400' : ''}`}>
                              {step.name}
                            </span>
                            {step.completed && <Check className="h-3 w-3 text-emerald-400" />}
                          </div>
                          <p className="text-[9px] text-muted-foreground">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Test Criteria */}
                <div>
                  <h4 className="text-[10px] font-semibold flex items-center gap-1.5 mb-2">
                    <TestTube2 className="h-3 w-3 text-orange-400" />
                    Test Criteria
                  </h4>
                  <div className="space-y-1.5">
                    {activeSpec.testCriteria.map((test) => (
                      <div key={test.id} className="flex items-start gap-2 text-[10px]">
                        {test.passed ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 mt-0.5" />
                        )}
                        <span className={test.passed ? 'text-emerald-300' : ''}>{test.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Complexity + Affected Files */}
                <div className="flex gap-4">
                  <div>
                    <h4 className="text-[10px] font-semibold mb-1">Complexity</h4>
                    <Badge
                      className={`text-[8px] border ${COMPLEXITY_CONFIG[activeSpec.complexity].bg} ${COMPLEXITY_CONFIG[activeSpec.complexity].color}`}
                      variant="outline"
                    >
                      <Zap className="h-2.5 w-2.5 mr-0.5" />
                      {COMPLEXITY_CONFIG[activeSpec.complexity].label}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-semibold mb-1">Affected Files</h4>
                    <div className="flex flex-wrap gap-1">
                      {activeSpec.affectedFiles.map((file) => (
                        <Badge key={file} variant="secondary" className="text-[8px] h-4 px-1.5 font-mono">
                          {file}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Action buttons */}
                <div className="flex gap-2">
                  {activeSpec.status === 'draft' && (
                    <Button
                      size="sm"
                      className="h-7 text-[10px] gap-1"
                      onClick={() => handleStatusChange(activeSpec.id, 'approved')}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Approve Spec
                    </Button>
                  )}
                  {activeSpec.status === 'approved' && (
                    <Button
                      size="sm"
                      className="h-7 text-[10px] gap-1"
                      onClick={() => handleStatusChange(activeSpec.id, 'implementing')}
                    >
                      <Play className="h-3 w-3" />
                      Start Implementation
                    </Button>
                  )}
                  {activeSpec.status === 'implementing' && (
                    <Button
                      size="sm"
                      className="h-7 text-[10px] gap-1"
                      onClick={() => handleStatusChange(activeSpec.id, 'complete')}
                    >
                      <Check className="h-3 w-3" />
                      Mark Complete
                    </Button>
                  )}
                  {activeSpec.status === 'complete' && (
                    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                      <Check className="h-3 w-3 mr-1" />
                      Implementation Complete
                    </Badge>
                  )}
                </div>
              </div>
            </ScrollArea>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <FileText className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-[10px]">Select a spec to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
