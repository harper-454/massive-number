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

type FeatureValue = '⚡' | '✅' | '❌';

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

// All 34 features with exact values as specified
// ⚡ = Unique/Advanced (3pts), ✅ = Supported (1pt), ❌ = Not available (0pts)
const FEATURES: Feature[] = [
  // AI & Models
  { name: 'Multi-model orchestration', values: { MN: '⚡', Cursor: '❌', WS: '❌', Kiro: '❌', CC: '❌', VSC: '❌' }, category: 'AI & Models' },
  { name: '7+ AI providers', values: { MN: '⚡', Cursor: '❌', WS: '❌', Kiro: '❌', CC: '❌', VSC: '❌' }, category: 'AI & Models' },
  { name: 'Auto model routing', values: { MN: '⚡', Cursor: '✅', WS: '❌', Kiro: '❌', CC: '❌', VSC: '✅' }, category: 'AI & Models' },
  { name: 'Cost optimization', values: { MN: '⚡', Cursor: '❌', WS: '❌', Kiro: '❌', CC: '❌', VSC: '❌' }, category: 'AI & Models' },
  { name: 'Custom AI personas', values: { MN: '⚡', Cursor: '❌', WS: '❌', Kiro: '❌', CC: '❌', VSC: '❌' }, category: 'AI & Models' },
  { name: 'AI rules system', values: { MN: '⚡', Cursor: '✅', WS: '❌', Kiro: '❌', CC: '❌', VSC: '❌' }, category: 'AI & Models' },

  // Integrations
  { name: 'Visual MCP hub', values: { MN: '⚡', Cursor: '✅', WS: '❌', Kiro: '❌', CC: '❌', VSC: '✅' }, category: 'Integrations' },
  { name: '12+ MCP servers', values: { MN: '⚡', Cursor: '✅', WS: '❌', Kiro: '❌', CC: '❌', VSC: '✅' }, category: 'Integrations' },
  { name: 'Git integration', values: { MN: '✅', Cursor: '✅', WS: '✅', Kiro: '✅', CC: '❌', VSC: '✅' }, category: 'Integrations' },
  { name: 'Code diff viewer', values: { MN: '✅', Cursor: '✅', WS: '❌', Kiro: '❌', CC: '❌', VSC: '✅' }, category: 'Integrations' },
  { name: 'CI/CD integration', values: { MN: '✅', Cursor: '✅', WS: '❌', Kiro: '❌', CC: '❌', VSC: '✅' }, category: 'Integrations' },
  { name: 'Marketplace', values: { MN: '⚡', Cursor: '❌', WS: '❌', Kiro: '❌', CC: '❌', VSC: '❌' }, category: 'Integrations' },
  { name: 'Collaboration', values: { MN: '✅', Cursor: '❌', WS: '❌', Kiro: '❌', CC: '❌', VSC: '✅' }, category: 'Integrations' },
  { name: 'Project templates', values: { MN: '⚡', Cursor: '❌', WS: '❌', Kiro: '❌', CC: '❌', VSC: '❌' }, category: 'Integrations' },

  // Code Intelligence
  { name: 'Code completion', values: { MN: '✅', Cursor: '✅', WS: '✅', Kiro: '✅', CC: '❌', VSC: '✅' }, category: 'Code Intelligence' },
  { name: 'Inline AI assist', values: { MN: '✅', Cursor: '✅', WS: '✅', Kiro: '❌', CC: '❌', VSC: '✅' }, category: 'Code Intelligence' },
  { name: 'Multi-file editing', values: { MN: '✅', Cursor: '✅', WS: '✅', Kiro: '✅', CC: '✅', VSC: '✅' }, category: 'Code Intelligence' },
  { name: 'Codebase context', values: { MN: '✅', Cursor: '✅', WS: '✅', Kiro: '✅', CC: '✅', VSC: '✅' }, category: 'Code Intelligence' },
  { name: 'Error detection', values: { MN: '✅', Cursor: '✅', WS: '✅', Kiro: '✅', CC: '✅', VSC: '✅' }, category: 'Code Intelligence' },
  { name: 'Context memory', values: { MN: '⚡', Cursor: '❌', WS: '❌', Kiro: '❌', CC: '❌', VSC: '❌' }, category: 'Code Intelligence' },

  // Agent & Automation
  { name: 'Agent mode', values: { MN: '✅', Cursor: '✅', WS: '✅', Kiro: '✅', CC: '✅', VSC: '✅' }, category: 'Agent & Automation' },
  { name: 'Multi-step pipelines', values: { MN: '⚡', Cursor: '✅', WS: '✅', Kiro: '✅', CC: '✅', VSC: '✅' }, category: 'Agent & Automation' },
  { name: 'Background agents', values: { MN: '✅', Cursor: '✅', WS: '✅', Kiro: '✅', CC: '✅', VSC: '✅' }, category: 'Agent & Automation' },
  { name: 'Spec-to-code', values: { MN: '⚡', Cursor: '❌', WS: '❌', Kiro: '✅', CC: '❌', VSC: '❌' }, category: 'Agent & Automation' },
  { name: 'Voice-to-code', values: { MN: '⚡', Cursor: '❌', WS: '❌', Kiro: '❌', CC: '❌', VSC: '❌' }, category: 'Agent & Automation' },

  // Web & Search
  { name: 'Web grounding', values: { MN: '⚡', Cursor: '❌', WS: '❌', Kiro: '❌', CC: '❌', VSC: '❌' }, category: 'Web & Search' },
  { name: 'AI-summarized search', values: { MN: '⚡', Cursor: '❌', WS: '❌', Kiro: '❌', CC: '❌', VSC: '❌' }, category: 'Web & Search' },
  { name: 'Source citations', values: { MN: '✅', Cursor: '❌', WS: '❌', Kiro: '❌', CC: '❌', VSC: '❌' }, category: 'Web & Search' },
  { name: 'Real-time data', values: { MN: '⚡', Cursor: '❌', WS: '❌', Kiro: '❌', CC: '❌', VSC: '❌' }, category: 'Web & Search' },

  // Developer Experience
  { name: 'Terminal', values: { MN: '✅', Cursor: '✅', WS: '✅', Kiro: '✅', CC: '✅', VSC: '✅' }, category: 'Developer Experience' },
  { name: 'File explorer', values: { MN: '✅', Cursor: '✅', WS: '✅', Kiro: '✅', CC: '❌', VSC: '✅' }, category: 'Developer Experience' },
  { name: 'Command palette', values: { MN: '✅', Cursor: '✅', WS: '❌', Kiro: '❌', CC: '❌', VSC: '✅' }, category: 'Developer Experience' },
  { name: 'Custom keybindings', values: { MN: '⚡', Cursor: '✅', WS: '✅', Kiro: '❌', CC: '❌', VSC: '✅' }, category: 'Developer Experience' },
  { name: 'Theme customization', values: { MN: '⚡', Cursor: '✅', WS: '✅', Kiro: '❌', CC: '❌', VSC: '✅' }, category: 'Developer Experience' },
];

// ── Helpers ─────────────────────────────────────────────────────────────

// Scoring: ⚡ = 3 points, ✅ = 1 point, ❌ = 0 points
function calculateScore(values: Record<string, FeatureValue>): number {
  let score = 0;
  Object.values(values).forEach((v) => {
    if (v === '⚡') score += 3;
    else if (v === '✅') score += 1;
    else score += 0;
  });
  return score;
}

const MAX_SCORE = FEATURES.length * 3; // 34 * 3 = 102

// Pre-calculate scores
const SCORES: Record<string, number> = {};
PLATFORMS.forEach((p) => {
  let score = 0;
  FEATURES.forEach((f) => {
    const v = f.values[p.shortName];
    if (v === '⚡') score += 3;
    else if (v === '✅') score += 1;
  });
  SCORES[p.shortName] = score;
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
  return null;
}

// ── Component ───────────────────────────────────────────────────────────

export function CompetitivePanel() {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['AI & Models', 'Integrations']));

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
  const mnPct = ((mnScore / MAX_SCORE) * 100).toFixed(1);

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

        {/* Animated Score Bars */}
        <div className="space-y-1.5 mb-3">
          {PLATFORMS.map((platform) => {
            const score = SCORES[platform.shortName];
            const pct = ((score / MAX_SCORE) * 100).toFixed(1);
            const isTop = platform.shortName === 'MN';

            return (
              <div key={platform.shortName} className="flex items-center gap-2">
                <span
                  className={`text-[9px] font-medium w-28 text-right shrink-0 ${
                    isTop ? platform.color : 'text-muted-foreground'
                  }`}
                >
                  {platform.name}
                </span>
                <div className="flex-1 h-3 bg-muted/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
                    className={`h-full rounded-full ${
                      isTop
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : 'bg-muted-foreground/30'
                    }`}
                  />
                </div>
                <span className={`text-[9px] font-mono w-10 shrink-0 text-right ${isTop ? platform.color : 'text-muted-foreground'}`}>
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

            // Calculate category-specific score for MN
            const catMnScore = catFeatures.reduce((sum, f) => {
              return sum + (f.values.MN === '⚡' ? 3 : f.values.MN === '✅' ? 1 : 0);
            }, 0);
            const catMaxScore = catFeatures.length * 3;

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
                  <Badge className="text-[7px] h-3.5 px-1 bg-emerald-500/15 text-emerald-400 border-emerald-500/20 ml-1">
                    {catMnScore}/{catMaxScore}
                  </Badge>
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
          Unique (3pts)
        </span>
        <span className="flex items-center gap-1">
          <Check className="h-3 w-3 text-emerald-500" />
          Supported (1pt)
        </span>
        <span className="flex items-center gap-1">
          <X className="h-3 w-3 text-red-400/70" />
          Not available (0pts)
        </span>
        <span className="ml-auto text-[8px]">
          {FEATURES.length} features · Max {MAX_SCORE}pts · MN {mnScore}pts ({mnPct}%)
        </span>
      </div>
    </div>
  );
}
