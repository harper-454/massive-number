'use client';

import { useState, useCallback } from 'react';
import {
  Brain,
  Hammer,
  SearchCheck,
  RefreshCw,
  Plus,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  Keyboard,
  Palette,
  FileText,
  UserCog,
  Shield,
  Code,
  TestTube,
  BookOpen,
  Check,
  ChevronRight,
  Sparkles,
  Monitor,
  Sun,
  Moon,
  TreePine,
  Type,
  Save,
  WrapText,
  Hash,
  Map,
  Copy,
  AlertTriangle,
  Settings2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { motion, AnimatePresence } from 'framer-motion';

/* ───────── Types ───────── */

interface Persona {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  systemPrompt: string;
  focus: string[];
  color: string;
  preset?: boolean;
}

interface Rule {
  id: string;
  name: string;
  content: string;
  enabled: boolean;
}

interface Keybinding {
  action: string;
  keys: string;
  description: string;
  category: 'Navigation' | 'Chat' | 'Editor' | 'Terminal' | 'Panels';
}

interface AppearanceSettings {
  theme: 'dark' | 'light' | 'midnight' | 'forest';
  fontFamily: 'Geist' | 'JetBrains Mono' | 'Fira Code' | 'Cascadia Code';
  fontSize: number;
  tabSize: 2 | 4 | 8;
  wordWrap: boolean;
  lineNumbers: boolean;
  minimap: boolean;
  accentColor: 'emerald' | 'amber' | 'rose' | 'cyan' | 'violet';
}

/* ───────── Preset Data ───────── */

const PRESET_PERSONAS: Persona[] = [
  {
    id: 'planner',
    name: 'Planner',
    icon: <Brain className="h-5 w-5" />,
    description: 'Strategic architect who breaks down requirements into clear specs before coding.',
    systemPrompt: 'You are a strategic architect. Break down requirements into clear specs before coding.',
    focus: ['specs', 'design', 'architecture'],
    color: 'text-amber-400',
    preset: true,
  },
  {
    id: 'builder',
    name: 'Builder',
    icon: <Hammer className="h-5 w-5" />,
    description: 'Rapid implementer who writes clean, efficient code following the plan.',
    systemPrompt: 'You are a rapid implementer. Write clean, efficient code following the plan.',
    focus: ['code', 'implementation', 'speed'],
    color: 'text-emerald-400',
    preset: true,
  },
  {
    id: 'reviewer',
    name: 'Reviewer',
    icon: <SearchCheck className="h-5 w-5" />,
    description: 'Strict code reviewer checking for bugs, security issues, performance, and style.',
    systemPrompt: 'You are a strict code reviewer. Check for bugs, security issues, performance problems, and style violations.',
    focus: ['review', 'security', 'quality'],
    color: 'text-rose-400',
    preset: true,
  },
  {
    id: 'iterator',
    name: 'Iterator',
    icon: <RefreshCw className="h-5 w-5" />,
    description: 'Optimization specialist who improves code for performance, readability, and maintainability.',
    systemPrompt: 'You are an optimization specialist. Improve existing code for performance, readability, and maintainability.',
    focus: ['refactor', 'optimize', 'polish'],
    color: 'text-cyan-400',
    preset: true,
  },
];

const PRESET_RULES: Rule[] = [
  {
    id: 'rule-ts-strict',
    name: 'Use TypeScript strict mode',
    content: 'Always use TypeScript with strict type checking. No any types.',
    enabled: true,
  },
  {
    id: 'rule-conventions',
    name: 'Follow project conventions',
    content: 'Follow the existing code patterns and naming conventions in the project.',
    enabled: true,
  },
  {
    id: 'rule-security',
    name: 'Security first',
    content: 'Never introduce SQL injection, XSS, or CSRF vulnerabilities. Always validate inputs.',
    enabled: true,
  },
  {
    id: 'rule-tests',
    name: 'Write tests',
    content: 'Generate unit tests for all new functions and components.',
    enabled: false,
  },
  {
    id: 'rule-docs',
    name: 'Document everything',
    content: 'Add JSDoc comments to all exported functions and types.',
    enabled: true,
  },
];

const KEYBINDINGS: Keybinding[] = [
  { action: 'Command Palette', keys: 'Ctrl+K', description: 'Open the command palette', category: 'Navigation' },
  { action: 'Quick panel switch', keys: '1-0', description: 'Switch between panels using number keys', category: 'Navigation' },
  { action: 'Send message', keys: 'Ctrl+Enter', description: 'Send the current chat message', category: 'Chat' },
  { action: 'Toggle terminal', keys: 'Ctrl+/', description: 'Show or hide the terminal panel', category: 'Terminal' },
  { action: 'Toggle sidebar', keys: 'Ctrl+B', description: 'Show or hide the sidebar', category: 'Panels' },
  { action: 'New project', keys: 'Ctrl+Shift+P', description: 'Create a new project', category: 'Navigation' },
  { action: 'Save file', keys: 'Ctrl+S', description: 'Save the current file', category: 'Editor' },
  { action: 'Undo', keys: 'Ctrl+Z', description: 'Undo the last action', category: 'Editor' },
  { action: 'Accept suggestion', keys: 'Tab', description: 'Accept the AI code suggestion', category: 'Editor' },
  { action: 'Close overlay', keys: 'Escape', description: 'Close any open overlay or dialog', category: 'Navigation' },
];

const THEME_SWATCHES: Record<string, { bg: string; fg: string; accent: string; border: string }> = {
  dark: { bg: '#0a0a0a', fg: '#fafafa', accent: '#10b981', border: '#27272a' },
  light: { bg: '#fafafa', fg: '#18181b', accent: '#10b981', border: '#e4e4e7' },
  midnight: { bg: '#0c0a1a', fg: '#e2e8f0', accent: '#8b5cf6', border: '#1e1b4b' },
  forest: { bg: '#0a1a0f', fg: '#d1fae5', accent: '#34d399', border: '#14532d' },
};

const ACCENT_COLORS: { id: AppearanceSettings['accentColor']; label: string; color: string }[] = [
  { id: 'emerald', label: 'Emerald', color: '#10b981' },
  { id: 'amber', label: 'Amber', color: '#f59e0b' },
  { id: 'rose', label: 'Rose', color: '#f43f5e' },
  { id: 'cyan', label: 'Cyan', color: '#06b6d4' },
  { id: 'violet', label: 'Violet', color: '#8b5cf6' },
];

/* ───────── Tab Config ───────── */

type TabId = 'personas' | 'rules' | 'keybindings' | 'appearance' | 'export';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'personas', label: 'AI Personas', icon: <UserCog className="h-4 w-4" /> },
  { id: 'rules', label: 'AI Rules', icon: <FileText className="h-4 w-4" /> },
  { id: 'keybindings', label: 'Keybindings', icon: <Keyboard className="h-4 w-4" /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette className="h-4 w-4" /> },
  { id: 'export', label: 'Export / Import', icon: <Download className="h-4 w-4" /> },
];

/* ───────── Main Component ───────── */

export function CustomizationHub() {
  const [activeTab, setActiveTab] = useState<TabId>('personas');
  const [activePersona, setActivePersona] = useState<string>('builder');
  const [personas, setPersonas] = useState<Persona[]>(PRESET_PERSONAS);
  const [newPersonaName, setNewPersonaName] = useState('');
  const [newPersonaPrompt, setNewPersonaPrompt] = useState('');

  const [rules, setRules] = useState<Rule[]>(PRESET_RULES);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleContent, setNewRuleContent] = useState('');
  const [showAddRule, setShowAddRule] = useState(false);

  const [appearance, setAppearance] = useState<AppearanceSettings>({
    theme: 'dark',
    fontFamily: 'Geist',
    fontSize: 14,
    tabSize: 2,
    wordWrap: true,
    lineNumbers: true,
    minimap: true,
    accentColor: 'emerald',
  });

  /* ── Persona handlers ── */

  const handleCreatePersona = useCallback(() => {
    if (!newPersonaName.trim() || !newPersonaPrompt.trim()) return;
    const newPersona: Persona = {
      id: `custom-${Date.now()}`,
      name: newPersonaName.trim(),
      icon: <Sparkles className="h-5 w-5" />,
      description: newPersonaPrompt.trim().slice(0, 80),
      systemPrompt: newPersonaPrompt.trim(),
      focus: ['custom'],
      color: 'text-orange-400',
    };
    setPersonas((prev) => [...prev, newPersona]);
    setNewPersonaName('');
    setNewPersonaPrompt('');
  }, [newPersonaName, newPersonaPrompt]);

  /* ── Rule handlers ── */

  const handleAddRule = useCallback(() => {
    if (!newRuleName.trim() || !newRuleContent.trim()) return;
    const newRule: Rule = {
      id: `rule-${Date.now()}`,
      name: newRuleName.trim(),
      content: newRuleContent.trim(),
      enabled: true,
    };
    setRules((prev) => [...prev, newRule]);
    setNewRuleName('');
    setNewRuleContent('');
    setShowAddRule(false);
  }, [newRuleName, newRuleContent]);

  const toggleRule = useCallback((id: string) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  }, []);

  const deleteRule = useCallback((id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }, []);

  /* ── Export / Import handlers ── */

  const handleExport = useCallback(() => {
    const config = { activePersona, personas, rules, appearance };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'massive-number-config.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [activePersona, personas, rules, appearance]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const config = JSON.parse(ev.target?.result as string);
          if (config.activePersona) setActivePersona(config.activePersona);
          if (config.personas) setPersonas(config.personas);
          if (config.rules) setRules(config.rules);
          if (config.appearance) setAppearance((prev) => ({ ...prev, ...config.appearance }));
        } catch {
          // Invalid JSON — silently fail
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  const handleReset = useCallback(() => {
    setPersonas(PRESET_PERSONAS);
    setRules(PRESET_RULES);
    setActivePersona('builder');
    setAppearance({
      theme: 'dark',
      fontFamily: 'Geist',
      fontSize: 14,
      tabSize: 2,
      wordWrap: true,
      lineNumbers: true,
      minimap: true,
      accentColor: 'emerald',
    });
  }, []);

  /* ───────── Tab Content Renderers ───────── */

  function renderPersonas() {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">AI Personas</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Switch between specialized AI modes. Each persona shapes the system prompt for every message.
            </p>
          </div>
          <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
            4 Presets
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {personas.map((persona) => {
            const isActive = activePersona === persona.id;
            return (
              <motion.div
                key={persona.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className={`relative overflow-hidden cursor-pointer transition-all ${
                    isActive
                      ? 'border-emerald-500/60 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                      : 'border-border/50 hover:border-border'
                  }`}
                  onClick={() => setActivePersona(persona.id)}
                >
                  {isActive && (
                    <motion.div
                      layoutId="persona-glow"
                      className="absolute inset-0 bg-emerald-500/5"
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    />
                  )}
                  <CardContent className="p-4 relative">
                    <div className="flex items-start gap-3">
                      <div
                        className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-muted/60 text-muted-foreground'
                        }`}
                      >
                        {persona.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{persona.name}</span>
                          {isActive && (
                            <Badge className="text-[9px] h-4 px-1.5 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30">
                              Active
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {persona.description}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {persona.focus.map((f) => (
                            <Badge
                              key={f}
                              variant="secondary"
                              className="text-[9px] h-4 px-1.5 capitalize"
                            >
                              {f}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {!isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3 w-full text-xs h-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePersona(persona.id);
                        }}
                      >
                        Set Active
                      </Button>
                    )}

                    {isActive && (
                      <div className="mt-3 p-2 rounded-md bg-emerald-500/5 border border-emerald-500/10">
                        <p className="text-[10px] text-muted-foreground font-mono leading-relaxed">
                          &quot;{persona.systemPrompt}&quot;
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <Separator />

        {/* Custom Persona Creator */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-orange-400" />
            <h4 className="text-sm font-semibold">Create Custom Persona</h4>
          </div>
          <div className="space-y-2">
            <Input
              placeholder="Persona name..."
              value={newPersonaName}
              onChange={(e) => setNewPersonaName(e.target.value)}
              className="text-sm h-9"
            />
            <Textarea
              placeholder="System prompt — this shapes how the AI behaves when this persona is active..."
              value={newPersonaPrompt}
              onChange={(e) => setNewPersonaPrompt(e.target.value)}
              className="text-sm min-h-[80px] resize-none"
            />
            <Button
              size="sm"
              onClick={handleCreatePersona}
              disabled={!newPersonaName.trim() || !newPersonaPrompt.trim()}
              className="h-8 gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Persona
            </Button>
          </div>
        </div>
      </div>
    );
  }

  function renderRules() {
    const enabledCount = rules.filter((r) => r.enabled).length;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">AI Rules</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Custom rules that shape AI behavior — like .cursorrules for every interaction.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">
              {enabledCount}/{rules.length} active
            </Badge>
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1.5 text-xs"
              onClick={() => setShowAddRule(true)}
            >
              <Plus className="h-3 w-3" />
              Add Rule
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {showAddRule && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="border-emerald-500/30 bg-emerald-500/5">
                <CardContent className="p-4 space-y-2">
                  <Input
                    placeholder="Rule name..."
                    value={newRuleName}
                    onChange={(e) => setNewRuleName(e.target.value)}
                    className="text-sm h-8"
                    autoFocus
                  />
                  <Textarea
                    placeholder="Rule content — what the AI should always follow..."
                    value={newRuleContent}
                    onChange={(e) => setNewRuleContent(e.target.value)}
                    className="text-sm min-h-[60px] resize-none"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="h-7 gap-1.5 text-xs"
                      onClick={handleAddRule}
                      disabled={!newRuleName.trim() || !newRuleContent.trim()}
                    >
                      <Check className="h-3 w-3" />
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => {
                        setShowAddRule(false);
                        setNewRuleName('');
                        setNewRuleContent('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-2">
          {rules.map((rule, idx) => {
            const ruleIcons: React.ReactNode[] = [
              <Code key="code" className="h-3.5 w-3.5" />,
              <BookOpen key="book" className="h-3.5 w-3.5" />,
              <Shield key="shield" className="h-3.5 w-3.5" />,
              <TestTube key="test" className="h-3.5 w-3.5" />,
              <FileText key="file" className="h-3.5 w-3.5" />,
            ];
            return (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
              >
                <Card
                  className={`transition-all ${
                    rule.enabled ? 'border-border/60' : 'border-border/30 opacity-60'
                  }`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 ${
                          rule.enabled
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-muted/40 text-muted-foreground'
                        }`}
                      >
                        {ruleIcons[idx % ruleIcons.length]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-sm font-medium ${
                              rule.enabled ? 'text-foreground' : 'text-muted-foreground'
                            }`}
                          >
                            {rule.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={rule.enabled}
                              onCheckedChange={() => toggleRule(rule.id)}
                              className="scale-75"
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-muted-foreground hover:text-red-400"
                              onClick={() => deleteRule(rule.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {rule.content}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderKeybindings() {
    const categories: Keybinding['category'][] = [
      'Navigation',
      'Chat',
      'Editor',
      'Terminal',
      'Panels',
    ];
    const categoryIcons: Record<string, React.ReactNode> = {
      Navigation: <ChevronRight className="h-3.5 w-3.5 text-amber-400" />,
      Chat: <Monitor className="h-3.5 w-3.5 text-emerald-400" />,
      Editor: <Code className="h-3.5 w-3.5 text-cyan-400" />,
      Terminal: <Keyboard className="h-3.5 w-3.5 text-orange-400" />,
      Panels: <Settings2 className="h-3.5 w-3.5 text-rose-400" />,
    };

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Keybindings</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Keyboard shortcuts for efficient navigation and control.
          </p>
        </div>

        {categories.map((category) => {
          const bindings = KEYBINDINGS.filter((k) => k.category === category);
          if (bindings.length === 0) return null;
          return (
            <div key={category} className="space-y-2">
              <div className="flex items-center gap-2">
                {categoryIcons[category]}
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {category}
                </span>
              </div>
              <div className="space-y-1">
                {bindings.map((binding) => (
                  <div
                    key={binding.action}
                    className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/30 transition-colors"
                  >
                    <div>
                      <span className="text-sm font-medium">{binding.action}</span>
                      <p className="text-[10px] text-muted-foreground">{binding.description}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {binding.keys.split('+').map((key, i) => (
                        <span key={i} className="flex items-center gap-1">
                          {i > 0 && <span className="text-[10px] text-muted-foreground">+</span>}
                          <kbd className="inline-flex h-6 min-w-[24px] items-center justify-center rounded border border-border bg-muted/60 px-1.5 text-[10px] font-mono text-foreground">
                            {key}
                          </kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function renderAppearance() {
    const themes: { id: AppearanceSettings['theme']; label: string; icon: React.ReactNode }[] = [
      { id: 'dark', label: 'Dark', icon: <Moon className="h-3.5 w-3.5" /> },
      { id: 'light', label: 'Light', icon: <Sun className="h-3.5 w-3.5" /> },
      { id: 'midnight', label: 'Midnight', icon: <Sparkles className="h-3.5 w-3.5" /> },
      { id: 'forest', label: 'Forest', icon: <TreePine className="h-3.5 w-3.5" /> },
    ];

    const fonts: AppearanceSettings['fontFamily'][] = [
      'Geist',
      'JetBrains Mono',
      'Fira Code',
      'Cascadia Code',
    ];

    return (
      <div className="space-y-5">
        <div>
          <h3 className="text-sm font-semibold">Appearance</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Customize the look and feel of your workspace.
          </p>
        </div>

        {/* Theme Selector */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Theme</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {themes.map((theme) => {
              const swatch = THEME_SWATCHES[theme.id];
              const isActive = appearance.theme === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => setAppearance((prev) => ({ ...prev, theme: theme.id }))}
                  className={`relative flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                    isActive
                      ? 'border-emerald-500/60 bg-emerald-500/5 ring-1 ring-emerald-500/20'
                      : 'border-border/50 hover:border-border bg-card/30'
                  }`}
                >
                  {/* Mini swatch */}
                  <div
                    className="h-10 w-full rounded-md overflow-hidden flex gap-0.5"
                    style={{ border: `1px solid ${swatch.border}` }}
                  >
                    <div className="flex-1" style={{ backgroundColor: swatch.bg }} />
                    <div className="w-2" style={{ backgroundColor: swatch.accent }} />
                    <div className="flex-1" style={{ backgroundColor: swatch.fg, opacity: 0.15 }} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {theme.icon}
                    <span className="text-xs font-medium">{theme.label}</span>
                  </div>
                  {isActive && (
                    <div className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Font Family */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Font Family</Label>
          <div className="grid grid-cols-2 gap-2">
            {fonts.map((font) => {
              const isActive = appearance.fontFamily === font;
              return (
                <button
                  key={font}
                  onClick={() => setAppearance((prev) => ({ ...prev, fontFamily: font }))}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all text-left ${
                    isActive
                      ? 'border-emerald-500/60 bg-emerald-500/5'
                      : 'border-border/50 hover:border-border bg-card/30'
                  }`}
                >
                  <Type className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span
                      className={`text-xs font-medium block truncate ${isActive ? 'text-emerald-400' : ''}`}
                      style={{ fontFamily: font }}
                    >
                      {font}
                    </span>
                  </div>
                  {isActive && <Check className="h-3 w-3 text-emerald-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Font Size */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Font Size</Label>
            <span className="text-xs text-muted-foreground font-mono">{appearance.fontSize}px</span>
          </div>
          <Slider
            value={[appearance.fontSize]}
            onValueChange={([val]) => setAppearance((prev) => ({ ...prev, fontSize: val }))}
            min={12}
            max={20}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-[9px] text-muted-foreground">
            <span>12px</span>
            <span>20px</span>
          </div>
        </div>

        {/* Editor Settings */}
        <div className="space-y-3">
          <Label className="text-xs font-medium">Editor Settings</Label>

          <div className="grid grid-cols-3 gap-2">
            {([2, 4, 8] as const).map((size) => (
              <button
                key={size}
                onClick={() => setAppearance((prev) => ({ ...prev, tabSize: size }))}
                className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-medium transition-all ${
                  appearance.tabSize === size
                    ? 'border-emerald-500/60 bg-emerald-500/5 text-emerald-400'
                    : 'border-border/50 hover:border-border text-muted-foreground'
                }`}
              >
                <Hash className="h-3 w-3" />
                Tab: {size}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {([
              { key: 'wordWrap' as const, label: 'Word Wrap', icon: <WrapText className="h-3.5 w-3.5" /> },
              { key: 'lineNumbers' as const, label: 'Line Numbers', icon: <Hash className="h-3.5 w-3.5" /> },
              { key: 'minimap' as const, label: 'Minimap', icon: <Map className="h-3.5 w-3.5" /> },
            ]).map((setting) => (
              <div
                key={setting.key}
                className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/20"
              >
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{setting.icon}</span>
                  <span className="text-xs font-medium">{setting.label}</span>
                </div>
                <Switch
                  checked={appearance[setting.key]}
                  onCheckedChange={(val) =>
                    setAppearance((prev) => ({ ...prev, [setting.key]: val }))
                  }
                  className="scale-75"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Accent Color */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Accent Color</Label>
          <div className="flex items-center gap-2">
            {ACCENT_COLORS.map((accent) => {
              const isActive = appearance.accentColor === accent.id;
              return (
                <button
                  key={accent.id}
                  onClick={() =>
                    setAppearance((prev) => ({ ...prev, accentColor: accent.id }))
                  }
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                    isActive
                      ? 'border-transparent shadow-lg'
                      : 'border-border/50 hover:border-border'
                  }`}
                  style={
                    isActive
                      ? { backgroundColor: accent.color + '20', color: accent.color, borderColor: accent.color + '60' }
                      : {}
                  }
                >
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: accent.color }}
                  />
                  <span>{accent.label}</span>
                  {isActive && <Check className="h-3 w-3" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Preview</Label>
          <Card className="border-border/50">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Save className="h-3.5 w-3.5 text-emerald-400" />
                <span
                  className="text-sm font-medium"
                  style={{
                    fontFamily: appearance.fontFamily,
                    fontSize: `${appearance.fontSize}px`,
                  }}
                >
                  function massiveNumber()
                </span>
              </div>
              <div
                className="font-mono text-xs leading-relaxed rounded-md p-3 bg-muted/30 border border-border/30"
                style={{
                  fontFamily: appearance.fontFamily,
                  fontSize: `${appearance.fontSize - 2}px`,
                  tabSize: appearance.tabSize,
                  whiteSpace: appearance.wordWrap ? 'pre-wrap' : 'pre',
                }}
              >
                <div className="flex">
                  {appearance.lineNumbers && (
                    <span className="text-muted-foreground/40 select-none mr-4 text-right w-6">
                      1{'\n'}2{'\n'}3
                    </span>
                  )}
                  <span>
                    <span className="text-rose-400">const</span>{' '}
                    <span className="text-cyan-300">config</span>{' '}
                    <span className="text-rose-400">=</span> {'{'}
                    {'\n'}
                    {'  '}
                    <span className="text-emerald-400">theme</span>:{' '}
                    <span className="text-amber-300">&apos;{appearance.theme}&apos;</span>,
                    {'\n'}
                    {'}'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  function renderExportImport() {
    const configSummary = {
      persona: personas.find((p) => p.id === activePersona)?.name || 'Unknown',
      rulesActive: rules.filter((r) => r.enabled).length,
      rulesTotal: rules.length,
      theme: appearance.theme,
      font: appearance.fontFamily,
      accent: appearance.accentColor,
    };

    return (
      <div className="space-y-5">
        <div>
          <h3 className="text-sm font-semibold">Export / Import Settings</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Backup, restore, or reset your configuration.
          </p>
        </div>

        {/* Config Summary */}
        <Card className="border-border/50">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Current Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Active Persona', value: configSummary.persona },
                { label: 'Rules', value: `${configSummary.rulesActive}/${configSummary.rulesTotal}` },
                { label: 'Theme', value: configSummary.theme },
                { label: 'Font', value: configSummary.font },
                { label: 'Accent', value: configSummary.accent },
                { label: 'Font Size', value: `${appearance.fontSize}px` },
              ].map((item) => (
                <div key={item.label} className="space-y-0.5">
                  <span className="text-[10px] text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-medium block capitalize">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-2">
          <Button
            className="w-full h-10 gap-2"
            onClick={handleExport}
          >
            <Download className="h-4 w-4" />
            Export Settings
          </Button>

          <Button
            variant="outline"
            className="w-full h-10 gap-2"
            onClick={handleImport}
          >
            <Upload className="h-4 w-4" />
            Import Settings
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full h-10 gap-2 text-red-400 border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
              >
                <RotateCcw className="h-4 w-4" />
                Reset to Defaults
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                  Reset All Settings?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will revert all personas, rules, appearance settings, and keybindings
                  back to their defaults. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleReset}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  Reset Everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* JSON Preview */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Configuration JSON</Label>
          <div className="rounded-lg border border-border/30 bg-muted/20 p-3 max-h-48 overflow-y-auto">
            <pre className="text-[10px] font-mono text-muted-foreground leading-relaxed">
              {JSON.stringify(
                { activePersona, personas: personas.length, rules: rules.length, appearance },
                null,
                2
              )}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  /* ───────── Render ───────── */

  const tabContent: Record<TabId, () => React.ReactNode> = {
    personas: renderPersonas,
    rules: renderRules,
    keybindings: renderKeybindings,
    appearance: renderAppearance,
    export: renderExportImport,
  };

  return (
    <div className="flex h-full">
      {/* Tab sidebar */}
      <div className="w-44 border-r border-border/40 bg-card/20 shrink-0 flex flex-col py-2">
        <div className="px-3 pb-2">
          <h2 className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
            Customize
          </h2>
        </div>
        <nav className="flex flex-col gap-0.5 px-2">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-all ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 font-medium'
                    : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {isActive && (
                  <ChevronRight className="h-3 w-3 ml-auto text-emerald-400" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      <ScrollArea className="flex-1">
        <div className="p-5 max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
            >
              {tabContent[activeTab]()}
            </motion.div>
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}
