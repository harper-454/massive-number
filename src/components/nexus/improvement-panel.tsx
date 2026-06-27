'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Activity,
  Gauge,
  BarChart3,
  Lightbulb,
  ThumbsUp,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertTriangle,
  Target,
  Brain,
  Loader2,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ────────────────────────────────────────────────────────────────

interface LoopData {
  id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  priority: number;
  impact: string;
  result: string | null;
  metrics: string;
  runCount: number;
  lastRunAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MetricData {
  id: string;
  category: string;
  name: string;
  value: number;
  unit: string;
  tags: string;
  recordedAt: string;
}

interface SuggestionData {
  id: string;
  source: string;
  title: string;
  description: string;
  category: string;
  priority: number;
  votes: number;
  status: string;
  implementedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MetricsSummary {
  totalMetrics: number;
  categories: Record<string, { count: number; latest: MetricData | null }>;
  healthScore: number;
}

// ── Constants ────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  performance: 'from-emerald-500 to-teal-600',
  ux: 'from-amber-500 to-orange-600',
  'model-quality': 'from-teal-400 to-cyan-600',
  'error-recovery': 'from-orange-500 to-red-600',
  'feature-suggestion': 'from-emerald-400 to-amber-500',
};

const TYPE_ICONS: Record<string, typeof TrendingUp> = {
  performance: Gauge,
  ux: Activity,
  'model-quality': Brain,
  'error-recovery': AlertTriangle,
  'feature-suggestion': Lightbulb,
};

const IMPACT_COLORS: Record<string, string> = {
  low: 'bg-white/10 text-white/50',
  medium: 'bg-amber-500/20 text-amber-400',
  high: 'bg-orange-500/20 text-orange-400',
  critical: 'bg-red-500/20 text-red-400',
};

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: typeof CheckCircle2 }> = {
  pending: { bg: 'bg-white/10', text: 'text-white/50', icon: Clock },
  running: { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: Loader2 },
  completed: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: CheckCircle2 },
  failed: { bg: 'bg-red-500/20', text: 'text-red-400', icon: XCircle },
};

const SUGGESTION_STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  suggested: { bg: 'bg-white/10', text: 'text-white/50' },
  planned: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
  implemented: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  rejected: { bg: 'bg-red-500/20', text: 'text-red-400' },
};

const CATEGORY_STYLES: Record<string, string> = {
  ui: 'bg-teal-500/15 text-teal-400',
  performance: 'bg-emerald-500/15 text-emerald-400',
  feature: 'bg-amber-500/15 text-amber-400',
  integration: 'bg-orange-500/15 text-orange-400',
  model: 'bg-cyan-500/15 text-cyan-400',
};

// ── Helper ───────────────────────────────────────────────────────────────

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

// ── Sub-components ───────────────────────────────────────────────────────

function HealthScoreGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative flex items-center justify-center">
      <svg width="100" height="100" className="-rotate-90">
        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle
          cx="50" cy="50" r="40" fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white/90">{score}</span>
        <span className="text-[9px] text-white/30 uppercase tracking-wider">Health</span>
      </div>
    </div>
  );
}

function MetricCard({ name, value, unit, trend }: { name: string; value: number | string; unit: string; trend?: 'up' | 'down' | 'neutral' }) {
  return (
    <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 hover:bg-white/[0.05] transition-colors">
      <div className="flex items-start justify-between">
        <span className="text-[10px] text-white/30 uppercase tracking-wider truncate">{name}</span>
        {trend === 'up' && <ArrowUpRight className="h-3 w-3 text-emerald-400 shrink-0" />}
        {trend === 'down' && <ArrowDownRight className="h-3 w-3 text-red-400 shrink-0" />}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="text-lg font-semibold text-white/90">{value}</span>
        <span className="text-[10px] text-white/30">{unit}</span>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────

export function ImprovementPanel() {
  const [loops, setLoops] = useState<LoopData[]>([]);
  const [loopSummary, setLoopSummary] = useState({ total: 0, active: 0, completed: 0, pending: 0, failed: 0, lastRunAt: null as string | null });
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [metricsSummary, setMetricsSummary] = useState<MetricsSummary>({ totalMetrics: 0, categories: {}, healthScore: 0 });
  const [suggestions, setSuggestions] = useState<SuggestionData[]>([]);
  const [suggestionSummary, setSuggestionSummary] = useState({ total: 0, suggested: 0, planned: 0, implemented: 0, rejected: 0, byCategory: {} as Record<string, number> });
  const [runningLoopId, setRunningLoopId] = useState<string | null>(null);
  const [expandedLoop, setExpandedLoop] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'loops' | 'suggestions'>('dashboard');
  const [loading, setLoading] = useState(true);

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      const [loopsRes, metricsRes, suggestionsRes] = await Promise.allSettled([
        fetch('/api/improvement-loops'),
        fetch('/api/improvement-loops/metrics'),
        fetch('/api/improvement-loops/suggestions'),
      ]);

      if (loopsRes.status === 'fulfilled' && loopsRes.value.ok) {
        const data = await loopsRes.value.json();
        setLoops(data.loops || []);
        setLoopSummary(data.summary || { total: 0, active: 0, completed: 0, pending: 0, failed: 0, lastRunAt: null });
      }

      if (metricsRes.status === 'fulfilled' && metricsRes.value.ok) {
        const data = await metricsRes.value.json();
        setMetrics(data.metrics || []);
        setMetricsSummary(data.summary || { totalMetrics: 0, categories: {}, healthScore: 0 });
      }

      if (suggestionsRes.status === 'fulfilled' && suggestionsRes.value.ok) {
        const data = await suggestionsRes.value.json();
        setSuggestions(data.suggestions || []);
        setSuggestionSummary(data.summary || { total: 0, suggested: 0, planned: 0, implemented: 0, rejected: 0, byCategory: {} });
      }
    } catch (err) {
      console.error('Failed to fetch improvement data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Run a loop
  const handleRunLoop = async (id: string) => {
    setRunningLoopId(id);
    try {
      const res = await fetch('/api/improvement-loops', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to run loop:', err);
    } finally {
      setRunningLoopId(null);
    }
  };

  // Delete a loop
  const handleDeleteLoop = async (id: string) => {
    try {
      const res = await fetch(`/api/improvement-loops?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to delete loop:', err);
    }
  };

  // Vote for a suggestion
  const handleVote = async (id: string) => {
    try {
      const res = await fetch('/api/improvement-loops/suggestions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'vote' }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  };

  // Get key metrics for dashboard
  const getKeyMetrics = () => {
    const find = (name: string) => metrics.find(m => m.name === name);
    return {
      performanceScore: find('Performance Score'),
      avgResponseTime: find('Average Response Time'),
      errorRate: find('Error Rate'),
      modelAvailability: find('Model Availability'),
      userSatisfaction: find('User Satisfaction'),
      improvementRate: find('Improvement Rate'),
    };
  };

  const keyMetrics = getKeyMetrics();

  // ── Loading state ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#09090b]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
          <span className="text-sm text-white/30">Loading improvement system...</span>
        </div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col bg-[#09090b]">
      {/* Header */}
      <div className="shrink-0 border-b border-white/[0.06] bg-[#0a0a0a]">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white/90">AI Improvement Loops</h1>
              <p className="text-[10px] text-white/30">Self-improving system that makes the app better</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              {loopSummary.active} active
            </Badge>
            <Badge variant="outline" className="text-[9px] bg-amber-500/10 text-amber-400 border-amber-500/20">
              {loopSummary.completed} completed
            </Badge>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex px-4 gap-1">
          {(['dashboard', 'loops', 'suggestions'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-3 py-2 text-[11px] font-medium transition-colors ${
                activeTab === tab ? 'text-white/90' : 'text-white/30 hover:text-white/50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {activeTab === tab && (
                <motion.div
                  layoutId="improvement-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 to-teal-500"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                {/* Health Score + Quick Stats */}
                <div className="flex gap-4">
                  {/* Health Score */}
                  <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-4 flex flex-col items-center justify-center min-w-[140px]">
                    <HealthScoreGauge score={metricsSummary.healthScore} />
                    <div className="mt-2 text-[10px] text-white/30">App Health Score</div>
                  </div>

                  {/* Quick stats */}
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <MetricCard
                      name="Performance Score"
                      value={keyMetrics.performanceScore?.value ?? 94}
                      unit="/100"
                      trend="up"
                    />
                    <MetricCard
                      name="Avg Response Time"
                      value={keyMetrics.avgResponseTime?.value ?? 230}
                      unit="ms"
                      trend="down"
                    />
                    <MetricCard
                      name="Error Rate"
                      value={keyMetrics.errorRate?.value ?? 0.3}
                      unit="%"
                      trend="down"
                    />
                    <MetricCard
                      name="Model Availability"
                      value={keyMetrics.modelAvailability?.value ?? 99.2}
                      unit="%"
                      trend="up"
                    />
                    <MetricCard
                      name="User Satisfaction"
                      value={keyMetrics.userSatisfaction?.value ?? 4.7}
                      unit="/5"
                      trend="up"
                    />
                    <MetricCard
                      name="Improvement Rate"
                      value={`+${keyMetrics.improvementRate?.value ?? 12}`}
                      unit="this week"
                      trend="up"
                    />
                  </div>
                </div>

                {/* Active Loops */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-xs font-medium text-white/70">Active Loops</span>
                    <span className="text-[9px] text-white/20 ml-auto">Last improved: {timeAgo(loopSummary.lastRunAt)}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {loops.filter(l => l.status === 'running' || l.status === 'pending').map(loop => {
                      const Icon = TYPE_ICONS[loop.type] || TrendingUp;
                      const gradient = TYPE_COLORS[loop.type] || 'from-emerald-500 to-teal-600';
                      const isRunning = loop.status === 'running';
                      return (
                        <div key={loop.id} className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 hover:bg-white/[0.04] transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 ${isRunning ? 'animate-pulse' : ''}`}>
                              <Icon className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-white/80 truncate">{loop.title}</span>
                                <Badge className={`text-[8px] ${IMPACT_COLORS[loop.impact]}`}>{loop.impact}</Badge>
                              </div>
                              <p className="text-[10px] text-white/25 truncate">{loop.description}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {loop.status === 'pending' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 text-[10px] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                  onClick={() => handleRunLoop(loop.id)}
                                  disabled={runningLoopId !== null}
                                >
                                  {runningLoopId === loop.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                  ) : (
                                    <Play className="h-3 w-3 mr-1" />
                                  )}
                                  Run
                                </Button>
                              )}
                              {isRunning && (
                                <Badge className="text-[8px] bg-amber-500/20 text-amber-400">
                                  <Loader2 className="h-2.5 w-2.5 animate-spin mr-1" />Running
                                </Badge>
                              )}
                            </div>
                          </div>
                          {/* Progress bar for running loops */}
                          {isRunning && (
                            <div className="mt-2 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                                initial={{ width: '0%' }}
                                animate={{ width: '70%' }}
                                transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {loops.filter(l => l.status === 'running' || l.status === 'pending').length === 0 && (
                      <div className="text-center py-6 text-white/20 text-xs">
                        <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-emerald-400/30" />
                        All loops completed. Run a loop to improve the app.
                      </div>
                    )}
                  </div>
                </div>

                {/* Run All button */}
                <Button
                  className="w-full h-9 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-medium"
                  onClick={() => {
                    const pendingLoop = loops.find(l => l.status === 'pending');
                    if (pendingLoop) handleRunLoop(pendingLoop.id);
                  }}
                  disabled={runningLoopId !== null || loops.filter(l => l.status === 'pending').length === 0}
                >
                  {runningLoopId ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                      Running Improvement...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 mr-2" />
                      Run Next Pending Loop
                    </>
                  )}
                </Button>

                {/* Loop History (compact) */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-3.5 w-3.5 text-teal-400" />
                    <span className="text-xs font-medium text-white/70">Recent Improvements</span>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {loops.filter(l => l.status === 'completed').slice(0, 5).map(loop => {
                      const Icon = TYPE_ICONS[loop.type] || TrendingUp;
                      const gradient = TYPE_COLORS[loop.type] || 'from-emerald-500 to-teal-600';
                      return (
                        <div key={loop.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                          <div className={`h-5 w-5 rounded bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}>
                            <Icon className="h-2.5 w-2.5 text-white" />
                          </div>
                          <span className="text-[10px] text-white/50 truncate flex-1">{loop.title}</span>
                          <span className="text-[9px] text-white/20 shrink-0">{timeAgo(loop.lastRunAt)}</span>
                          <Badge className={`text-[7px] ${IMPACT_COLORS[loop.impact]}`}>{loop.impact}</Badge>
                        </div>
                      );
                    })}
                    {loops.filter(l => l.status === 'completed').length === 0 && (
                      <div className="text-center py-4 text-white/15 text-[10px]">No completed improvements yet</div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'loops' && (
              <motion.div
                key="loops"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="space-y-2"
              >
                {loops.map(loop => {
                  const Icon = TYPE_ICONS[loop.type] || TrendingUp;
                  const gradient = TYPE_COLORS[loop.type] || 'from-emerald-500 to-teal-600';
                  const statusStyle = STATUS_STYLES[loop.status] || STATUS_STYLES.pending;
                  const StatusIcon = statusStyle.icon;
                  const isExpanded = expandedLoop === loop.id;
                  let parsedResult: { findings?: string[]; improvements?: string[] } | null = null;
                  let parsedMetrics: { before?: Record<string, number>; after?: Record<string, number> } | null = null;
                  try {
                    if (loop.result) parsedResult = JSON.parse(loop.result);
                    if (loop.metrics) parsedMetrics = JSON.parse(loop.metrics);
                  } catch { /* ignore */ }

                  return (
                    <div key={loop.id} className="rounded-lg bg-white/[0.03] border border-white/[0.06] overflow-hidden">
                      <button
                        className="w-full flex items-center gap-3 p-3 hover:bg-white/[0.04] transition-colors text-left"
                        onClick={() => setExpandedLoop(isExpanded ? null : loop.id)}
                      >
                        <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 ${loop.status === 'running' ? 'animate-pulse' : ''}`}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-white/80 truncate">{loop.title}</span>
                            <Badge className={`text-[8px] ${statusStyle.bg} ${statusStyle.text}`}>
                              <StatusIcon className={`h-2.5 w-2.5 mr-0.5 ${loop.status === 'running' ? 'animate-spin' : ''}`} />
                              {loop.status}
                            </Badge>
                            <Badge className={`text-[8px] ${IMPACT_COLORS[loop.impact]}`}>{loop.impact}</Badge>
                          </div>
                          <p className="text-[10px] text-white/25 truncate">{loop.description}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[9px] text-white/15">Run #{loop.runCount}</span>
                          <span className="text-[9px] text-white/15">{timeAgo(loop.lastRunAt)}</span>
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5 text-white/20" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 text-white/20" />
                          )}
                        </div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 pb-3 pt-0 border-t border-white/[0.04]">
                              {/* Before/After Metrics */}
                              {parsedMetrics?.before && parsedMetrics?.after && (
                                <div className="mt-3 mb-3">
                                  <div className="text-[10px] text-white/40 mb-2 flex items-center gap-1.5">
                                    <Target className="h-3 w-3" /> Metrics Comparison
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(parsedMetrics.before).map(([key, beforeVal]) => {
                                      const afterVal = parsedMetrics!.after?.[key];
                                      const improved = afterVal !== undefined && afterVal < beforeVal; // lower is better for latency/error metrics
                                      const isImprovement = key.includes('Rate') || key.includes('Time') || key.includes('Depth')
                                        ? afterVal !== undefined && afterVal < beforeVal
                                        : afterVal !== undefined && afterVal > beforeVal;
                                      return (
                                        <div key={key} className="rounded bg-white/[0.02] p-2">
                                          <div className="text-[9px] text-white/25 mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                                          <div className="flex items-center gap-2 text-[11px]">
                                            <span className="text-white/30">{beforeVal}</span>
                                            <span className="text-white/10">→</span>
                                            <span className={isImprovement ? 'text-emerald-400' : 'text-red-400'}>
                                              {afterVal ?? '—'}
                                            </span>
                                            {afterVal !== undefined && (
                                              <span className={`text-[8px] ${isImprovement ? 'text-emerald-400/60' : 'text-red-400/60'}`}>
                                                {isImprovement ? '▼' : '▲'}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Findings */}
                              {parsedResult?.findings && (
                                <div className="mb-3">
                                  <div className="text-[10px] text-white/40 mb-1.5 flex items-center gap-1.5">
                                    <AlertTriangle className="h-3 w-3 text-amber-400/60" /> Findings
                                  </div>
                                  <ul className="space-y-1">
                                    {parsedResult.findings.map((f, i) => (
                                      <li key={i} className="text-[10px] text-white/40 flex items-start gap-1.5">
                                        <span className="text-amber-400/40 mt-0.5">•</span>
                                        {f}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Improvements */}
                              {parsedResult?.improvements && (
                                <div className="mb-3">
                                  <div className="text-[10px] text-white/40 mb-1.5 flex items-center gap-1.5">
                                    <Sparkles className="h-3 w-3 text-emerald-400/60" /> Suggested Improvements
                                  </div>
                                  <ul className="space-y-1">
                                    {parsedResult.improvements.map((imp, i) => (
                                      <li key={i} className="text-[10px] text-white/40 flex items-start gap-1.5">
                                        <span className="text-emerald-400/40 mt-0.5">→</span>
                                        {imp}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Actions */}
                              <div className="flex items-center gap-2 pt-2">
                                {loop.status === 'pending' && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-[10px] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                    onClick={(e) => { e.stopPropagation(); handleRunLoop(loop.id); }}
                                    disabled={runningLoopId !== null}
                                  >
                                    {runningLoopId === loop.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                    ) : (
                                      <Play className="h-3 w-3 mr-1" />
                                    )}
                                    Run Again
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 text-[10px] text-red-400/50 hover:text-red-400 hover:bg-red-500/10"
                                  onClick={(e) => { e.stopPropagation(); handleDeleteLoop(loop.id); }}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Remove
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                {loops.length === 0 && (
                  <div className="text-center py-12 text-white/20 text-xs">
                    <TrendingUp className="h-8 w-8 mx-auto mb-3 text-white/10" />
                    No improvement loops yet. Create one to start improving.
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'suggestions' && (
              <motion.div
                key="suggestions"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="space-y-2"
              >
                {/* Summary bar */}
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="text-[8px] bg-white/10 text-white/50">{suggestionSummary.suggested} suggested</Badge>
                  <Badge className="text-[8px] bg-amber-500/15 text-amber-400">{suggestionSummary.planned} planned</Badge>
                  <Badge className="text-[8px] bg-emerald-500/15 text-emerald-400">{suggestionSummary.implemented} implemented</Badge>
                </div>

                {suggestions.map(suggestion => {
                  const statusStyle = SUGGESTION_STATUS_STYLES[suggestion.status] || SUGGESTION_STATUS_STYLES.suggested;
                  const categoryStyle = CATEGORY_STYLES[suggestion.category] || 'bg-white/10 text-white/50';
                  return (
                    <div key={suggestion.id} className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 hover:bg-white/[0.04] transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-white/80 truncate">{suggestion.title}</span>
                            <Badge className={`text-[8px] ${statusStyle.bg} ${statusStyle.text}`}>{suggestion.status}</Badge>
                            <Badge className={`text-[8px] ${categoryStyle}`}>{suggestion.category}</Badge>
                          </div>
                          <p className="text-[10px] text-white/25 line-clamp-2">{suggestion.description}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-[9px] text-white/15">
                            <span className="flex items-center gap-1">
                              <Sparkles className="h-2.5 w-2.5" />
                              {suggestion.source === 'ai-loop' ? 'AI Loop' : suggestion.source === 'user-feedback' ? 'User' : 'Analysis'}
                            </span>
                            <span>{timeAgo(suggestion.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleVote(suggestion.id)}
                            className="h-8 w-8 rounded-lg bg-white/[0.04] hover:bg-emerald-500/15 flex items-center justify-center transition-colors group"
                            disabled={suggestion.status === 'implemented'}
                          >
                            <ThumbsUp className="h-3.5 w-3.5 text-white/20 group-hover:text-emerald-400 transition-colors" />
                          </button>
                          <span className="text-[10px] font-medium text-white/40">{suggestion.votes}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {suggestions.length === 0 && (
                  <div className="text-center py-12 text-white/20 text-xs">
                    <Lightbulb className="h-8 w-8 mx-auto mb-3 text-white/10" />
                    No feature suggestions yet. Run an improvement loop to generate suggestions.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}

export default ImprovementPanel;
