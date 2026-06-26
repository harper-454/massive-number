'use client';

import { useState, useEffect } from 'react';
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

// ── Component ───────────────────────────────────────────────────────────

export function SpecPanel() {
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [selectedSpec, setSelectedSpec] = useState<string | null>(null);
  const [newSpecDesc, setNewSpecDesc] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showNewSpec, setShowNewSpec] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/specs')
      .then(res => res.json())
      .then(data => {
        const mapped = (data.specs || []).map((s: { id: string; title: string; description: string; requirements: string[]; designNotes: string; implementationSteps: Array<{ name: string; description: string }>; testCriteria: string[]; estimatedComplexity: string; affectedFiles: string[]; status: string; createdAt: string }) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          requirements: s.requirements.map((r: string, i: number) => ({ id: `r-${i}`, text: r, checked: s.status === 'completed' })),
          designNotes: s.designNotes,
          implementationSteps: s.implementationSteps.map((step: { name: string; description: string }, i: number) => ({ id: `s-${i}`, name: step.name, description: step.description, completed: s.status === 'completed' })),
          testCriteria: s.testCriteria.map((t: string, i: number) => ({ id: `t-${i}`, text: t, passed: s.status === 'completed' })),
          complexity: s.estimatedComplexity as Complexity,
          affectedFiles: s.affectedFiles,
          status: s.status === 'completed' ? 'complete' as SpecStatus : s.status as SpecStatus,
          createdAt: new Date(s.createdAt).toLocaleDateString(),
        }));
        setSpecs(mapped);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const activeSpec = specs.find((s) => s.id === selectedSpec);

  const handleGenerateSpec = () => {
    if (!newSpecDesc.trim()) return;
    setIsGenerating(true);
    fetch('/api/specs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: newSpecDesc }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.spec) {
          const s = data.spec;
          const newSpec: Spec = {
            id: s.id,
            title: s.title,
            description: s.description,
            requirements: (s.requirements || []).map((r: string, i: number) => ({ id: `r-${i}`, text: r, checked: false })),
            designNotes: s.designNotes || '',
            implementationSteps: (s.implementationSteps || []).map((step: { name: string; description: string }, i: number) => ({ id: `s-${i}`, name: step.name, description: step.description, completed: false })),
            testCriteria: (s.testCriteria || []).map((t: string, i: number) => ({ id: `t-${i}`, text: t, passed: false })),
            complexity: (s.estimatedComplexity || 'medium') as Complexity,
            affectedFiles: s.affectedFiles || [],
            status: 'draft',
            createdAt: 'Just now',
          };
          setSpecs((prev) => [newSpec, ...prev]);
          setSelectedSpec(newSpec.id);
        }
        setIsGenerating(false);
        setNewSpecDesc('');
        setShowNewSpec(false);
      })
      .catch(() => setIsGenerating(false));
  };

  const handleStatusChange = (specId: string, newStatus: SpecStatus) => {
    fetch('/api/specs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: specId, status: newStatus === 'complete' ? 'completed' : newStatus }),
    }).catch(() => {});

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
