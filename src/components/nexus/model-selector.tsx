'use client';

import { useMemo } from 'react';
import {
  ChevronDown,
  Zap,
  Brain,
  Code,
  Search,
  Eye,
  Sparkles,
  MessageSquare,
  Cpu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useModelStore } from '@/stores/model-store';

const PROVIDER_COLORS: Record<string, string> = {
  multi: 'bg-gradient-to-r from-emerald-500 to-teal-500',
  openai: 'bg-emerald-600',
  anthropic: 'bg-orange-500',
  google: 'bg-red-500',
  deepseek: 'bg-cyan-600',
  meta: 'bg-violet-600',
  alibaba: 'bg-amber-600',
};

const PROVIDER_LABELS: Record<string, string> = {
  multi: 'Multi',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
  deepseek: 'DeepSeek',
  meta: 'Meta',
  alibaba: 'Alibaba',
};

const CAPABILITY_ICONS: Record<string, React.ReactNode> = {
  chat: <MessageSquare className="h-3 w-3" />,
  code: <Code className="h-3 w-3" />,
  agent: <Brain className="h-3 w-3" />,
  search: <Search className="h-3 w-3" />,
  vision: <Eye className="h-3 w-3" />,
  reasoning: <Sparkles className="h-3 w-3" />,
};

const SPEED_LABELS: Record<string, { label: string; color: string }> = {
  optimal: { label: 'Optimal', color: 'text-emerald-400' },
  fast: { label: 'Fast', color: 'text-green-400' },
  medium: { label: 'Medium', color: 'text-yellow-400' },
  slow: { label: 'Slow', color: 'text-red-400' },
};

function CostIndicator({ cost }: { cost: number }) {
  const level = cost <= 0.001 ? 1 : cost <= 0.003 ? 2 : cost <= 0.005 ? 3 : 4;
  return (
    <div className="flex items-center gap-0.5" title={`$${cost.toFixed(4)}/1K tokens`}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`h-2 w-0.5 rounded-full transition-colors ${
            i <= level ? 'bg-emerald-400' : 'bg-muted-foreground/20'
          }`}
        />
      ))}
    </div>
  );
}

export function ModelSelector() {
  const { models, selectedModel, setSelectedModel } = useModelStore();

  const currentModel = useMemo(
    () => models.find((m) => m.id === selectedModel) || models[0],
    [models, selectedModel]
  );

  return (
    <DropdownMenu>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <DropdownMenuTrigger asChild>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-2 px-2 text-xs hover:bg-accent"
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    PROVIDER_COLORS[currentModel.provider] || 'bg-muted'
                  }`}
                />
                <span className="max-w-[120px] truncate font-medium">
                  {currentModel.name}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
          </DropdownMenuTrigger>
          <TooltipContent side="bottom">
            <p>
              {currentModel.name} · {PROVIDER_LABELS[currentModel.provider]}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent
        align="start"
        className="w-80 bg-popover border-border p-1"
      >
        {models
          .filter((m) => m.enabled)
          .map((model) => {
            const isSelected = model.id === selectedModel;
            const speedInfo = SPEED_LABELS[model.speed] || SPEED_LABELS.medium;

            return (
              <DropdownMenuItem
                key={model.id}
                onClick={() => setSelectedModel(model.id)}
                className={`flex flex-col items-start gap-1.5 rounded-md px-3 py-2.5 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                        PROVIDER_COLORS[model.provider] || 'bg-muted'
                      }`}
                    />
                    <span className="font-medium text-sm">{model.name}</span>
                    {isSelected && (
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-[10px] h-5 px-1.5 font-normal"
                  >
                    {PROVIDER_LABELS[model.provider]}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground pl-[18px] leading-tight">
                  {model.description}
                </p>

                <div className="flex items-center gap-3 pl-[18px]">
                  <div className="flex items-center gap-1">
                    <CostIndicator cost={model.costPer1kTokens} />
                    <span className="text-[10px] text-muted-foreground">
                      ${model.costPer1kTokens.toFixed(4)}/1K
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className={`h-3 w-3 ${speedInfo.color}`} />
                    <span className={`text-[10px] ${speedInfo.color}`}>
                      {speedInfo.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {model.contextWindow >= 1000000
                      ? `${(model.contextWindow / 1000000).toFixed(0)}M ctx`
                      : `${(model.contextWindow / 1000).toFixed(0)}K ctx`}
                  </span>
                </div>

                <div className="flex items-center gap-1 pl-[18px]">
                  {model.capabilities.map((cap) => (
                    <TooltipProvider key={cap} delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center justify-center h-5 w-5 rounded bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                            {CAPABILITY_ICONS[cap] || <Cpu className="h-3 w-3" />}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                          {cap.charAt(0).toUpperCase() + cap.slice(1)}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </DropdownMenuItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
