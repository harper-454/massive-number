'use client';

import { useState } from 'react';
import {
  Trophy,
  Zap,
  Check,
  X,
  Crown,
  TrendingUp,
  BarChart3,
  Filter,
  ArrowUpRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ───────────────────────────────────────────────────────────────

type FeatureValue = '⚡' | '✅' | '❌' | '✅(basic)' | '✅(Live Share)';

interface Platform {
  name: string;
  shortName: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

interface Feature {
  name: string;
  values: Record<string, FeatureValue>;
  category?: string;
}

// ── Data ────────────────────────────────────────────────────────────────

const PLATFORMS: Platform[] = [
  { name: 'MASSIVE NUMBER', shortName: 'MN', color: 'text-emerald-400', bgColor: 'bg-emerald-500/15', borderColor: 'border-emerald-500/30' },
  { name: 'Cursor', shortName: 'Cursor', color: 'text-amber-400', bgColor: 'bg-amber-500/15', borderColor: 'border-amber-500/30' },
  { name: 'Windsurf', shortName: 'WS', color: 'text-teal-400', bgColor: 'bg-teal-500/15', borderColor: 'border-teal-500/30' },
  { name: 'Kiro', shortName: 'Kiro', color: 'text-orange-400', bgColor: 'bg-orange-500/15', borderColor: 'border-orange-500/30' },
  { name: 'Claude Code', shortName: 'CC', color: 'text-rose-400', bgColor: 'bg-rose-500/15', borderColor: 'border-rose-500/30' },
  { name: 'VS Code+Copilot', shortName: 'VSC', color: 'text-zinc-400', bgColor: 'bg-zinc-500/15', borderColor: 'border-zinc-500/30' },
];

const FEATURES: Feature[] = [
  // AI & Orchestration
  { name: 'Multi-model orchestration', values: { MN: '⚡', Cursor: '❌', WS: '❌', Kiro: '❌', CC: '❌', VSC: '❌' }, category: 'AI & Orchestration' },
  { name: 'Visual MCP hub', values: { MN: '⚡', Cursor: '✅(basic)', WS: '❌', Kiro: '❌', CC: '❌', VSC: '✅(basic)' }, category: 'AI & Orchestration' },
  { name: 'Web grounding', values: { MN: '⚡', Cursor: '❌', WS: '❌', Kiro: '❌', CC: '❌', VSC: '❌' }, category: 'AI & Orchestration' },
  { name: 'Agent mode', values: { MN: '✅', Cursor: '✅', WS: '✅', Kiro: '✅', CC: '✅', VSC: '✅' }, category: 'AI & Orchestration' },
  { name: 'Multi-provider support', values: { MN: '⚡', Cursor: '✅(basic)', WS: '❌', Kiro: '❌', CC: '❌', VSC: '✅(basic)' }, category: 'AI & Orchestration' },
  { name: 'Voice-to-code', values: { MN: '⚡', Cursor: '❌', WS: '❌', Kiro: '❌', CC: '❌', VSC: '❌' }, category: 'AI & Orchestration' },
  { name: 'Cost optimization', values: { MN: '⚡', Cursor: '❌', WS: '❌', Kiro: '❌', CC: '❌', VSC: '❌' }, category: 'AI & Orchestration' },
  { name: 'Model auto-routing', values: { MN: '⚡', Cursor: '❌', WS: '❌', Kiro: '❌', CC: '❌', VSC: '❌' }, category: 'AI & Orchestration' },
  // Development
  { name: 'Spec-to-Code pipeline', values: { MN: '⚡', Cursor: '❌', WS: '❌', Kiro: '✅', CC: '❌', VSC: '❌' }, category: 'Development' },
  { name: 'Integration marketplace', values: { MN: '⚡', Cursor: '❌', WS: '❌', Kiro: '❌', CC: '❌', VSC: '❌' }, category: 'Development' },
  { name: 'Git integration', values: { MN: '✅', Cursor: '✅', WS: '✅', Kiro: '✅', CC: '❌', VSC: '✅' }, category: 'Development' },
  { name: 'Code review', values: { MN: '✅', Cursor: '✅', WS: '❌', Kiro: '❌', CC: '❌', VSC: '✅' }, category: 'Development' },
  { name: 'Inline editing', values: { MN: '✅', Cursor: '✅', WS: '✅', Kiro: '✅', CC: '❌', VSC: '✅' }, category: 'Development' },
  { name: 'Code generation', values: { MN: '✅', Cursor: '✅', WS: '✅', Kiro: '✅', CC: '✅', VSC: '✅' }, category: 'Development' },
  // Infrastructure
  { name: 'CI/CD integration', values: { MN: '✅', Cursor: '✅', WS: '❌', Kiro: '❌', CC: '❌', VSC: '✅' }, category: 'Infrastructure' },
  { name: 'Terminal', values: { MN: '✅', Cursor: '✅', WS: '✅', Kiro: '✅', CC: '✅', VSC: '✅' }, category: 'Infrastructure' },
  { name: 'File explorer', values: { MN: '✅', Cursor: '✅', WS: '✅', Kiro: '✅', CC: '❌', VSC: '✅' }, category: 'Infrastructure' },
  { name: 'Docker support', values: { MN: '✅', Cursor: '✅', WS: '❌', Kiro: '❌', CC: '❌', VSC: '✅' }, category: 'Infrastructure' },
  { name: 'Cloud deployment', values: { MN: '✅', Cursor: '✅', WS: '✅', Kiro: '❌', CC: '❌', VSC: '✅' }, category: 'Infrastructure' },
  // Collaboration
  { name: 'Real-time collaboration', values: { MN: '✅', Cursor: '❌', WS: '❌', Kiro: '❌', CC: '❌', VSC: '✅(Live Share)' }, category: 'Collaboration' },
  { name: 'Live cursors', values: { MN: '✅', Cursor: '❌', WS: '❌', Kiro: '❌', CC: '❌', VSC: '✅' }, category: 'Collaboration' },
  { name: 'Activity feed', values: { MN: '✅', Cursor: '❌', WS: '❌', Kiro: '❌', CC: '❌', VSC: '❌' }, category: 'Collaboration' },
  { name: 'Team chat', values: { MN: '✅', Cursor: '❌', WS: '❌', Kiro: '❌', CC: '❌', VSC: '❌' }, category: 'Collaboration' },
  // Search & Knowledge
  { name: 'Web search', values: { MN: '⚡', Cursor: '❌', WS: '✅', Kiro: '❌', CC: '❌', VSC: '❌' }, category: 'Search & Knowledge' },
  { name: 'Codebase search', values: { MN: '✅', Cursor: '✅', WS: '✅', Kiro: '✅', CC: '✅', VSC: '✅' }, category: 'Search & Knowledge' },
  { name: 'Context awareness', values: { MN: '⚡', Cursor: '✅', WS: '✅', Kiro: '✅', CC: '✅', VSC: '✅' }, category: 'Search & Knowledge' },
  // Quality & Safety
  { name: 'Security scanning', values: { MN: '✅', Cursor: '✅', WS: '❌', Kiro: '❌', CC: '❌', VSC: '✅' }, category: 'Quality & Safety' },
  { name: 'Error monitoring', values: { MN: '✅', Cursor: '❌', WS: '❌', Kiro: '❌', CC: '❌', VSC: '✅' }, category: 'Quality & Safety' },
  { name: 'Auto-testing', values: { MN: '✅', Cursor: '✅', WS: '❌', Kiro: '❌', CC: '❌', VSC: '✅' }, category: 'Quality & Safety' },
  { name: 'Lint integration', values: { MN: '✅', Cursor: '✅', WS: '✅', Kiro: '✅', CC: '❌', VSC: '✅' }, category: 'Quality & Safety' },
  // UX
  { name: 'Command palette', values: { MN: '✅', Cursor: '✅', WS: '✅', Kiro: '✅', CC: '❌', VSC: '✅' }, category: 'UX' },
  { name: 'Keyboard shortcuts', values: { MN: '✅', Cursor: '✅', WS: '✅', Kiro: '✅', CC: '✅', VSC: '✅' }, category: 'UX' },
  { name: 'Customizable themes', values: { MN: '✅', Cursor: '✅', WS: '✅', Kiro: '❌', CC: '❌', VSC: '✅' }, category: 'UX' },
  { name: 'Streaming responses', values: { MN: '✅', Cursor: '✅', WS: '✅', Kiro: '✅', CC: '✅', VSC: '✅' }, category: 'UX' },
];

// ── Helpers ─────────────────────────────────────────────────────────────

function calculateScore(values: Record<string, FeatureValue>): number {
  let score = 0;
  const vals = Object.values(values);
  vals.forEach((v) => {
    if (v === '⚡') score += 3;
    else if (v === '✅') score += 2;
    else if (v.startsWith('✅')) score += 1;
    else score += 0;
  });
  return score;
}

const MAX_SCORE = FEATURES.length * 3;

const SCORES: Record<string, number> = {};
PLATFORMS.forEach((p) => {
  SCORES[p.shortName] = calculateScore(
    FEATURES.reduce((acc, f) => ({ ...acc, [p.shortName]: f.values[p.shortName] }), {})
  );
});

function renderCellValue(value: FeatureValue) {
  if (value === '⚡') {
    return (
      <span className="flex items-center justify-center">
        <Zap className="h-4 w-4 text-emerald-400 fill-emerald-400" />
      </span>
    );
  }
  if (value === '✅') {
    return (
      <span className="flex items-center justify-center">
        <Check className="h-3.5 w-3.5 text-emerald-500" />
      </span>
    );
  }
  if (value === '❌') {
    return (
      <span className="flex items-center justify-center">
        <X className="h-3.5 w-3.5 text-red-400/70" />
      </span>
    );
  }
  if (value.startsWith('✅')) {
    return (
      <span className="flex items-center justify-center gap-0.5">
        <Check className="h-3 w-3 text-amber-400" />
        <span className="text-[7px] text-amber-400/70">
          {value.replace('✅', '')}
        </span>
      </span>
    );
  }
  return null;
}

// ── Component ───────────────────────────────────────────────────────────

export function CompetitivePanel() {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['AI & Orchestration', 'Development']));

  const categories = [...new Set(FEATURES.map((f) => f.category).filter(Boolean))];

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const mnScore = SCORES['MN'];
  const secondBest = Math.max(...Object.entries(SCORES).filter(([k]) => k !== 'MN').map(([, v]) => v));
  const mnAdvantage = Math.round(((mnScore - secondBest) / MAX_SCORE) * 100);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <Crown className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Competitive Comparison</h2>
              <p className="text-[10px] text-muted-foreground">How we dominate the market</p>
            </div>
          </div>
          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 gap-1">
            <Trophy className="h-2.5 w-2.5" />
            #{1} Platform
          </Badge>
        </div>

        {/* Score bars */}
        <div className="space-y-1.5 mb-3">
          {PLATFORMS.map((platform) => {
            const score = SCORES[platform.shortName];
            const pct = Math.round((score / MAX_SCORE) * 100);
            const isTop = platform.shortName === 'MN';

            return (
              <div key={platform.shortName} className="flex items-center gap-2">
                <span
                  className={`text-[9px] font-medium w-24 text-right shrink-0 ${
                    isTop ? platform.color : 'text-muted-foreground'
                  }`}
                >
                  {platform.name}
                </span>
                <div className="flex-1 h-3 bg-muted/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                    className={`h-full rounded-full ${
                      isTop
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : 'bg-muted-foreground/30'
                    }`}
                  />
                </div>
                <span className={`text-[9px] font-mono w-8 shrink-0 ${isTop ? platform.color : 'text-muted-foreground'}`}>
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Key stats */}
        <div className="flex gap-2">
          <Card className="flex-1 p-2 bg-card/50 border-emerald-500/20">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              <div>
                <p className="text-[8px] text-muted-foreground">Advantage</p>
                <p className="text-xs font-bold text-emerald-400">+{mnAdvantage}%</p>
              </div>
            </div>
          </Card>
          <Card className="flex-1 p-2 bg-card/50 border-emerald-500/20">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <div>
                <p className="text-[8px] text-muted-foreground">Unique Features</p>
                <p className="text-xs font-bold text-emerald-400">
                  {FEATURES.filter((f) => f.values.MN === '⚡').length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="flex-1 p-2 bg-card/50 border-emerald-500/20">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-emerald-400" />
              <div>
                <p className="text-[8px] text-muted-foreground">Total Score</p>
                <p className="text-xs font-bold text-emerald-400">{mnScore}/{MAX_SCORE}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Separator className="shrink-0" />

      {/* Feature comparison table */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_repeat(6,48px)] gap-1 mb-2 sticky top-0 bg-background z-10 pb-1">
            <div className="text-[9px] font-medium text-muted-foreground">Feature</div>
            {PLATFORMS.map((p) => (
              <div
                key={p.shortName}
                className={`text-[8px] font-bold text-center ${p.shortName === 'MN' ? p.color : 'text-muted-foreground'}`}
              >
                {p.shortName}
              </div>
            ))}
          </div>

          {/* Category groups */}
          {categories.map((cat) => {
            const isExpanded = expandedCategories.has(cat!);
            const catFeatures = FEATURES.filter((f) => f.category === cat);

            return (
              <div key={cat} className="mb-2">
                <button
                  onClick={() => toggleCategory(cat!)}
                  className="w-full flex items-center gap-1.5 py-1.5 px-2 rounded-md hover:bg-muted/30 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <ChevronUp className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {cat}
                  </span>
                  <Badge variant="secondary" className="text-[7px] h-3.5 px-1 ml-auto">
                    {catFeatures.length}
                  </Badge>
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
                      {catFeatures.map((feature) => (
                        <div
                          key={feature.name}
                          className="grid grid-cols-[1fr_repeat(6,48px)] gap-1 py-1.5 px-2 rounded-md hover:bg-muted/20 transition-colors items-center"
                        >
                          <span className="text-[9px] truncate">{feature.name}</span>
                          {PLATFORMS.map((p) => (
                            <div key={p.shortName} className="flex justify-center">
                              {renderCellValue(feature.values[p.shortName])}
                            </div>
                          ))}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <Separator className="shrink-0" />

      {/* Legend */}
      <div className="shrink-0 px-4 py-2 flex items-center gap-4 text-[9px] text-muted-foreground bg-card/30">
        <span className="flex items-center gap-1">
          <Zap className="h-3 w-3 text-emerald-400 fill-emerald-400" />
          Unique
        </span>
        <span className="flex items-center gap-1">
          <Check className="h-3 w-3 text-emerald-500" />
          Supported
        </span>
        <span className="flex items-center gap-1">
          <X className="h-3 w-3 text-red-400/70" />
          Not available
        </span>
        <span className="ml-auto text-[8px]">
          Based on {FEATURES.length} features across {categories.length} categories
        </span>
      </div>
    </div>
  );
}
