'use client';

import { useState } from 'react';
import { useEffect } from 'react';
import {
  Settings,
  Key,
  Palette,
  Globe,
  Bot,
  Shield,
  Zap,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Check,
  RefreshCw,
  CreditCard,
  Cpu,
  Cloud,
  MessageSquare,
  Code,
  Terminal,
  Search,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { useModelStore } from '@/stores/model-store';

// ── Provider Data ──────────────────────────────────────────────────────────

interface ProviderInfo {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  connected: boolean;
  enabled: boolean;
  apiKey: string;
  models: { id: string; name: string }[];
}

const INITIAL_PROVIDERS: ProviderInfo[] = [];

// ── Provider icon map ────────────────────────────────────────────────────────

const PROVIDER_ICON_MAP: Record<string, React.ReactNode> = {
  google: <Globe className="h-5 w-5" />,
  deepseek: <Zap className="h-5 w-5" />,
  meta: <Cpu className="h-5 w-5" />,
  alibaba: <MessageSquare className="h-5 w-5" />,
  mistral: <Bot className="h-5 w-5" />,
  groq: <Zap className="h-5 w-5" />,
  cerebras: <Cpu className="h-5 w-5" />,
  cohere: <Cloud className="h-5 w-5" />,
  sambanova: <Zap className="h-5 w-5" />,
  openrouter: <Globe className="h-5 w-5" />,
};

// ── Component ───────────────────────────────────────────────────────────

export function SettingsPanel() {
  const { models, selectedModel, setSelectedModel, toggleModel } =
    useModelStore();
  const [providers, setProviders] = useState<ProviderInfo[]>([]);

  useEffect(() => {
    fetch('/api/providers')
      .then(res => res.json())
      .then(data => {
        const mapped = (data.providers || []).map((p: { id: string; name: string; provider: string; apiKey: string; models: Array<{ id: string; name: string }>; enabled: boolean }) => ({
          id: p.provider || p.id,
          name: p.name,
          icon: PROVIDER_ICON_MAP[p.provider?.toLowerCase()] || <Cloud className="h-5 w-5" />,
          color: 'text-muted-foreground',
          connected: !!p.apiKey,
          enabled: p.enabled,
          apiKey: p.apiKey || '',
          models: p.models || [],
        }));
        setProviders(mapped);
      })
      .catch(() => {});
  }, []);
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newProviderName, setNewProviderName] = useState('');
  const [newProviderKey, setNewProviderKey] = useState('');

  // General settings
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [defaultModel, setDefaultModel] = useState('auto');
  const [autoApprove, setAutoApprove] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [costOptimization, setCostOptimization] = useState(true);
  const [webGrounding, setWebGrounding] = useState(false);
  const [fontSize, setFontSize] = useState([14]);
  const [tabSize, setTabSize] = useState('2');
  const [wordWrap, setWordWrap] = useState(true);

  // Helpers
  const toggleProviderEnabled = (id: string) => {
    setProviders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  };

  const toggleShowApiKey = (id: string) => {
    setShowApiKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const removeProvider = (id: string) => {
    setProviders((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAddProvider = () => {
    if (!newProviderName.trim() || !newProviderKey.trim()) return;
    const newProvider: ProviderInfo = {
      id: `custom-${Date.now()}`,
      name: newProviderName.trim(),
      icon: <Cloud className="h-5 w-5" />,
      color: 'text-gray-400',
      connected: true,
      enabled: true,
      apiKey: newProviderKey.trim(),
      models: [],
    };
    setProviders((prev) => [...prev, newProvider]);
    setNewProviderName('');
    setNewProviderKey('');
    setAddDialogOpen(false);
  };

  // ── Usage by model (derived from model store, all free) ─────────────────
  const USAGE_BY_MODEL = models.map((m) => ({
    model: m.name,
    tokens: m.contextWindow,
    cost: m.costPer1kTokens,
    color: m.provider === 'google' ? 'bg-red-500' :
           m.provider === 'deepseek' ? 'bg-cyan-500' :
           m.provider === 'meta' ? 'bg-violet-500' :
           m.provider === 'alibaba' ? 'bg-amber-500' :
           m.provider === 'mistral' ? 'bg-orange-500' :
           m.provider === 'groq' ? 'bg-emerald-500' :
           m.provider === 'cerebras' ? 'bg-rose-500' :
           m.provider === 'cohere' ? 'bg-teal-500' :
           'bg-emerald-500',
  }));

  const maxTokens = Math.max(...USAGE_BY_MODEL.map((m) => m.tokens), 1);

  // ── Speed rating helper ──────────────────────────────────────────────────
  const speedStars = (speed: string) => {
    const map: Record<string, number> = {
      optimal: 4,
      fast: 4,
      medium: 3,
      slow: 2,
    };
    const count = map[speed] ?? 3;
    return '★'.repeat(count) + '☆'.repeat(5 - count);
  };

  // ── Auto-routing config (updated June 2026 — all free models) ────────────
  const autoRouting: { task: string; icon: React.ReactNode; model: string }[] =
    [
      {
        task: 'General Chat',
        icon: <MessageSquare className="h-4 w-4" />,
        model: 'gemini-2.5-flash',
      },
      {
        task: 'Code Generation',
        icon: <Code className="h-4 w-4" />,
        model: 'qwen3-coder-480b',
      },
      {
        task: 'Agent Tasks',
        icon: <Bot className="h-4 w-4" />,
        model: 'qwen3.7-max',
      },
      {
        task: 'Web Search',
        icon: <Search className="h-4 w-4" />,
        model: 'gemini-2.5-flash',
      },
      {
        task: 'Reasoning',
        icon: <Sparkles className="h-4 w-4" />,
        model: 'deepseek-r1',
      },
      {
        task: 'Ultra Fast',
        icon: <Zap className="h-4 w-4" />,
        model: 'llama-4-scout-17b',
      },
    ];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
        <Settings className="h-5 w-5 text-zinc-400" />
        <h2 className="text-lg font-semibold">Settings</h2>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="providers" className="flex flex-1 flex-col overflow-hidden">
        <TabsList className="mx-4 mt-2 grid w-auto grid-cols-4 bg-zinc-900">
          <TabsTrigger
            value="providers"
            className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100"
          >
            Providers
          </TabsTrigger>
          <TabsTrigger
            value="models"
            className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100"
          >
            Models
          </TabsTrigger>
          <TabsTrigger
            value="general"
            className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100"
          >
            General
          </TabsTrigger>
          <TabsTrigger
            value="usage"
            className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100"
          >
            Usage
          </TabsTrigger>
        </TabsList>

        {/* ── Providers Tab ────────────────────────────────────────────── */}
        <TabsContent value="providers" className="mt-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-3 p-4">
              {/* Add provider button */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-400">
                  {providers.filter((p) => p.connected).length} of{' '}
                  {providers.length} providers connected
                </p>
                <Dialog
                  open={addDialogOpen}
                  onOpenChange={setAddDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      className="bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                    >
                      <Plus className="mr-1 h-4 w-4" /> Add Provider
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="border-zinc-800 bg-zinc-950 text-zinc-100 sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Custom Provider</DialogTitle>
                      <DialogDescription className="text-zinc-400">
                        Connect a new AI provider with an API key
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label className="text-zinc-300">Provider Name</Label>
                        <Input
                          value={newProviderName}
                          onChange={(e) => setNewProviderName(e.target.value)}
                          placeholder="e.g. Cohere"
                          className="border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-zinc-300">API Key</Label>
                        <Input
                          type="password"
                          value={newProviderKey}
                          onChange={(e) => setNewProviderKey(e.target.value)}
                          placeholder="Enter API key"
                          className="border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600"
                        />
                      </div>
                      <Button
                        onClick={handleAddProvider}
                        className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        <Check className="mr-1 h-4 w-4" /> Connect Provider
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Provider cards */}
              {providers.map((provider) => (
                <Card
                  key={provider.id}
                  className="border-zinc-800 bg-zinc-900/60 transition-colors hover:bg-zinc-900"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 ${provider.color}`}
                        >
                          {provider.icon}
                        </div>
                        <div>
                          <CardTitle className="text-sm font-medium">
                            {provider.name}
                          </CardTitle>
                          <CardDescription className="text-xs text-zinc-500">
                            {provider.models.length} model
                            {provider.models.length !== 1 ? 's' : ''} available
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            provider.connected
                              ? 'border-emerald-700 text-emerald-400'
                              : 'border-zinc-700 text-zinc-500'
                          }`}
                        >
                          {provider.connected ? 'Connected' : 'Disconnected'}
                        </Badge>
                        <Switch
                          checked={provider.enabled}
                          onCheckedChange={() =>
                            toggleProviderEnabled(provider.id)
                          }
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    {/* Model badges */}
                    <div className="flex flex-wrap gap-1">
                      {provider.models.map((m) => (
                        <Badge
                          key={m.id}
                          variant="secondary"
                          className="bg-zinc-800 text-[10px] text-zinc-300"
                        >
                          {m.name}
                        </Badge>
                      ))}
                    </div>

                    {/* API key field */}
                    <div className="flex items-center gap-2">
                      <Key className="h-3.5 w-3.5 text-zinc-500" />
                      <div className="relative flex-1">
                        <Input
                          type={
                            showApiKeys[provider.id] ? 'text' : 'password'
                          }
                          value={provider.apiKey || 'No API key set'}
                          readOnly
                          className="h-8 border-zinc-700 bg-zinc-800 pr-9 text-xs text-zinc-400"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-0.5 top-0.5 h-7 w-7 text-zinc-500 hover:text-zinc-300"
                          onClick={() => toggleShowApiKey(provider.id)}
                        >
                          {showApiKeys[provider.id] ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-500 hover:text-red-400"
                        onClick={() => removeProvider(provider.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ── Models Tab ───────────────────────────────────────────────── */}
        <TabsContent value="models" className="mt-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-4 p-4">
              {/* Auto-routing section */}
              <div>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                  <Zap className="h-4 w-4 text-amber-400" /> Auto-Routing
                  Configuration
                </h3>
                <Card className="border-zinc-800 bg-zinc-900/60">
                  <CardContent className="divide-y divide-zinc-800 p-0">
                    {autoRouting.map((r) => (
                      <div
                        key={r.task}
                        className="flex items-center justify-between px-4 py-2.5"
                      >
                        <div className="flex items-center gap-2 text-sm text-zinc-300">
                          {r.icon}
                          {r.task}
                        </div>
                        <Select
                          value={r.model}
                          onValueChange={() => {
                            /* configurable */
                          }}
                        >
                          <SelectTrigger className="h-7 w-36 border-zinc-700 bg-zinc-800 text-xs text-zinc-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-zinc-700 bg-zinc-900">
                            {models
                              .filter((m) => m.id !== 'auto')
                              .map((m) => (
                                <SelectItem
                                  key={m.id}
                                  value={m.id}
                                  className="text-xs text-zinc-300"
                                >
                                  {m.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <Separator className="bg-zinc-800" />

              {/* Model cards grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {models.map((model) => (
                  <Card
                    key={model.id}
                    className={`border-zinc-800 bg-zinc-900/60 transition-colors ${
                      model.enabled ? 'hover:bg-zinc-900' : 'opacity-50'
                    }`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-sm font-medium">
                            {model.name}
                          </CardTitle>
                          <CardDescription className="text-[11px] text-zinc-500">
                            {model.provider} · {model.description}
                          </CardDescription>
                        </div>
                        <Switch
                          checked={model.enabled}
                          onCheckedChange={() => toggleModel(model.id)}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-0">
                      {/* Capability badges */}
                      <div className="flex flex-wrap gap-1">
                        {model.capabilities.map((cap) => (
                          <Badge
                            key={cap}
                            variant="secondary"
                            className="bg-zinc-800 text-[9px] text-zinc-400"
                          >
                            {cap}
                          </Badge>
                        ))}
                      </div>
                      {/* Stats row */}
                      <div className="grid grid-cols-3 gap-2 text-[11px] text-zinc-400">
                        <div>
                          <span className="text-zinc-600">Cost</span>
                          <br />${model.costPer1kTokens}/1K
                        </div>
                        <div>
                          <span className="text-zinc-600">Context</span>
                          <br />
                          {model.contextWindow >= 1000000
                            ? `${model.contextWindow / 1000000}M`
                            : `${model.contextWindow / 1000}K`}
                        </div>
                        <div>
                          <span className="text-zinc-600">Speed</span>
                          <br />
                          <span className="text-amber-400">
                            {speedStars(model.speed)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ── General Tab ──────────────────────────────────────────────── */}
        <TabsContent value="general" className="mt-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-6 p-4">
              {/* Theme */}
              <section className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                  <Palette className="h-4 w-4" /> Appearance
                </h3>
                <Card className="border-zinc-800 bg-zinc-900/60">
                  <CardContent className="space-y-4 p-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-zinc-300">Theme</Label>
                      <Select
                        value={theme}
                        onValueChange={(v) =>
                          setTheme(v as 'dark' | 'light' | 'system')
                        }
                      >
                        <SelectTrigger className="w-32 border-zinc-700 bg-zinc-800 text-sm text-zinc-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-zinc-700 bg-zinc-900">
                          <SelectItem
                            value="dark"
                            className="text-zinc-300"
                          >
                            Dark
                          </SelectItem>
                          <SelectItem
                            value="light"
                            className="text-zinc-300"
                          >
                            Light
                          </SelectItem>
                          <SelectItem
                            value="system"
                            className="text-zinc-300"
                          >
                            System
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-zinc-300">
                          Font Size
                        </Label>
                        <span className="text-xs text-zinc-500">
                          {fontSize[0]}px
                        </span>
                      </div>
                      <Slider
                        value={fontSize}
                        onValueChange={setFontSize}
                        min={10}
                        max={24}
                        step={1}
                        className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                      />
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Default Model */}
              <section className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                  <Bot className="h-4 w-4" /> Model Preferences
                </h3>
                <Card className="border-zinc-800 bg-zinc-900/60">
                  <CardContent className="space-y-4 p-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-zinc-300">
                        Default Model
                      </Label>
                      <Select
                        value={defaultModel}
                        onValueChange={(v) => {
                          setDefaultModel(v);
                          setSelectedModel(v);
                        }}
                      >
                        <SelectTrigger className="w-48 border-zinc-700 bg-zinc-800 text-sm text-zinc-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-zinc-700 bg-zinc-900">
                          {models
                            .filter((m) => m.enabled)
                            .map((m) => (
                              <SelectItem
                                key={m.id}
                                value={m.id}
                                className="text-zinc-300"
                              >
                                {m.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator className="bg-zinc-800" />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm text-zinc-300">
                          Cost Optimization
                        </Label>
                        <p className="text-[11px] text-zinc-500">
                          Auto-route to the cheapest capable model
                        </p>
                      </div>
                      <Switch
                        checked={costOptimization}
                        onCheckedChange={setCostOptimization}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm text-zinc-300">
                          Web Grounding
                        </Label>
                        <p className="text-[11px] text-zinc-500">
                          Always search before coding
                        </p>
                      </div>
                      <Switch
                        checked={webGrounding}
                        onCheckedChange={setWebGrounding}
                      />
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Behavior */}
              <section className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                  <Shield className="h-4 w-4" /> Behavior
                </h3>
                <Card className="border-zinc-800 bg-zinc-900/60">
                  <CardContent className="space-y-4 p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm text-zinc-300">
                          Agent Auto-Approve
                        </Label>
                        <p className="text-[11px] text-zinc-500">
                          Allow agents to run without confirmation
                        </p>
                      </div>
                      <Switch
                        checked={autoApprove}
                        onCheckedChange={setAutoApprove}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm text-zinc-300">
                          Voice Enabled
                        </Label>
                        <p className="text-[11px] text-zinc-500">
                          Enable voice-to-code input
                        </p>
                      </div>
                      <Switch
                        checked={voiceEnabled}
                        onCheckedChange={setVoiceEnabled}
                      />
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Editor */}
              <section className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                  <Code className="h-4 w-4" /> Editor
                </h3>
                <Card className="border-zinc-800 bg-zinc-900/60">
                  <CardContent className="space-y-4 p-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-zinc-300">Tab Size</Label>
                      <Select
                        value={tabSize}
                        onValueChange={setTabSize}
                      >
                        <SelectTrigger className="w-20 border-zinc-700 bg-zinc-800 text-sm text-zinc-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-zinc-700 bg-zinc-900">
                          <SelectItem
                            value="2"
                            className="text-zinc-300"
                          >
                            2
                          </SelectItem>
                          <SelectItem
                            value="4"
                            className="text-zinc-300"
                          >
                            4
                          </SelectItem>
                          <SelectItem
                            value="8"
                            className="text-zinc-300"
                          >
                            8
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-zinc-300">
                        Word Wrap
                      </Label>
                      <Switch
                        checked={wordWrap}
                        onCheckedChange={setWordWrap}
                      />
                    </div>
                  </CardContent>
                </Card>
              </section>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ── Usage Tab ───────────────────────────────────────────────── */}
        <TabsContent value="usage" className="mt-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-6 p-4">
              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="border-zinc-800 bg-zinc-900/60">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <RefreshCw className="h-4 w-4" />
                      <span className="text-xs">Tokens Today</span>
                    </div>
                    <p className="mt-1 text-2xl font-bold text-zinc-100">
                      47,283
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-zinc-800 bg-zinc-900/60">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <CreditCard className="h-4 w-4" />
                      <span className="text-xs">Cost Today</span>
                    </div>
                    <p className="mt-1 text-2xl font-bold text-emerald-400">
                      $2.14
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Cost breakdown */}
              <section className="space-y-3">
                <h3 className="text-sm font-medium text-zinc-300">
                  Context Window by Model
                </h3>
                <Card className="border-zinc-800 bg-zinc-900/60">
                  <CardContent className="space-y-3 p-4">
                    {USAGE_BY_MODEL.map((item) => (
                      <div key={item.model} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-300">{item.model}</span>
                          <span className="text-zinc-500">
                            {item.tokens >= 1000000
                              ? `${(item.tokens / 1000000).toFixed(0)}M`
                              : `${(item.tokens / 1000).toFixed(0)}K`} ctx · {item.cost === 0 ? 'FREE' : `$${item.cost.toFixed(4)}/1K`}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-zinc-800">
                          <div
                            className={`h-2 rounded-full ${item.color} transition-all duration-500`}
                            style={{
                              width: `${Math.min((item.tokens / maxTokens) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </section>

              {/* Session stats */}
              <section className="space-y-3">
                <h3 className="text-sm font-medium text-zinc-300">
                  Session Stats
                </h3>
                <Card className="border-zinc-800 bg-zinc-900/60">
                  <CardContent className="grid grid-cols-2 gap-4 p-4">
                    <div>
                      <p className="text-[11px] text-zinc-500">
                        Messages Sent
                      </p>
                      <p className="text-lg font-semibold text-zinc-100">24</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-zinc-500">
                        Agent Runs
                      </p>
                      <p className="text-lg font-semibold text-zinc-100">3</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-zinc-500">Avg Response Time</p>
                      <p className="text-lg font-semibold text-zinc-100">
                        1.8s
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-zinc-500">Sessions Today</p>
                      <p className="text-lg font-semibold text-zinc-100">2</p>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Context window chart */}
              <section className="space-y-3">
                <h3 className="text-sm font-medium text-zinc-300">Provider Coverage</h3>
                <Card className="border-zinc-800 bg-zinc-900/60">
                  <CardContent className="space-y-3 p-4">
                    {USAGE_BY_MODEL.map((item) => (
                      <div key={item.model} className="flex-1">
                        <div className="mb-1 flex items-center justify-between text-xs text-zinc-300">
                          <span>{item.model}</span>
                          <span className="text-zinc-500">
                            {item.tokens >= 1000000
                              ? `${(item.tokens / 1000000).toFixed(0)}M ctx`
                              : `${(item.tokens / 1000).toFixed(0)}K ctx`}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-zinc-800">
                          <div
                            className={`h-2 rounded-full ${item.color} transition-all duration-500`}
                            style={{
                              width: `${Math.min((item.tokens / maxTokens) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </section>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SettingsPanel;
