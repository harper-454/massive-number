'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  LayoutTemplate,
  Star,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Plus,
  Code,
  Bot,
  Server,
  ShoppingCart,
  BarChart3,
  Cpu,
  Building2,
  Smartphone,
  Trash2,
  Edit3,
  Save,
  X,
  Search,
  Sparkles,
  FileCode,
  Braces,
  Palette,
  Wifi,
  Shield,
  ArrowLeftRight,
  Database,
  MessageSquare,
  Zap,
  BookOpen,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ───────────────────────────────────────────────────────────────

interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  techStack: string[];
  rating: number;
  gradient: string;
  icon: React.ElementType;
}

interface CodeSnippet {
  id: string;
  name: string;
  language: string;
  description: string;
  code: string;
  favorited: boolean;
}

interface CustomSnippet {
  id: string;
  name: string;
  language: string;
  description: string;
  code: string;
  createdAt: Date;
}

// ── Data ────────────────────────────────────────────────────────────────

const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'tpl-1',
    name: 'Next.js Full-Stack App',
    description: 'Complete full-stack starter with auth, API routes, and database.',
    techStack: ['Next.js', 'TypeScript', 'Prisma', 'Tailwind'],
    rating: 4.9,
    gradient: 'from-emerald-500 to-teal-600',
    icon: LayoutTemplate,
  },
  {
    id: 'tpl-2',
    name: 'AI Chat Application',
    description: 'Real-time chat with multi-model support, streaming responses, and conversation memory.',
    techStack: ['Next.js', 'Socket.io', 'z-ai-sdk', 'Zustand'],
    rating: 4.8,
    gradient: 'from-amber-500 to-orange-600',
    icon: Bot,
  },
  {
    id: 'tpl-3',
    name: 'REST API Server',
    description: 'Production-ready REST API with validation, auth middleware, and OpenAPI docs.',
    techStack: ['Next.js API', 'Zod', 'Prisma'],
    rating: 4.7,
    gradient: 'from-teal-500 to-emerald-600',
    icon: Server,
  },
  {
    id: 'tpl-4',
    name: 'E-Commerce Store',
    description: 'Full e-commerce with product catalog, cart, checkout, and Stripe payments.',
    techStack: ['Next.js', 'Stripe', 'Prisma', 'Tailwind'],
    rating: 4.6,
    gradient: 'from-orange-500 to-amber-600',
    icon: ShoppingCart,
  },
  {
    id: 'tpl-5',
    name: 'Dashboard Analytics',
    description: 'Data visualization dashboard with charts, filters, and real-time updates.',
    techStack: ['Next.js', 'Recharts', 'Prisma', 'Tailwind'],
    rating: 4.5,
    gradient: 'from-amber-400 to-orange-500',
    icon: BarChart3,
  },
  {
    id: 'tpl-6',
    name: 'AI Agent Framework',
    description: 'Build custom AI agents with tool calling, MCP integration, and step-by-step execution.',
    techStack: ['Next.js', 'z-ai-sdk', 'Socket.io'],
    rating: 4.8,
    gradient: 'from-emerald-400 to-teal-500',
    icon: Cpu,
  },
  {
    id: 'tpl-7',
    name: 'SaaS Starter',
    description: 'Multi-tenant SaaS with billing, teams, roles, and usage tracking.',
    techStack: ['Next.js', 'NextAuth', 'Prisma', 'Stripe'],
    rating: 4.7,
    gradient: 'from-teal-400 to-emerald-500',
    icon: Building2,
  },
  {
    id: 'tpl-8',
    name: 'Mobile-First PWA',
    description: 'Progressive web app with offline support, push notifications, and responsive design.',
    techStack: ['Next.js', 'Service Worker', 'Tailwind'],
    rating: 4.4,
    gradient: 'from-orange-400 to-amber-500',
    icon: Smartphone,
  },
];

// ── Component ───────────────────────────────────────────────────────────

export function TemplatesPanel() {
  const [activeSection, setActiveSection] = useState<'templates' | 'snippets' | 'custom'>('templates');
  const [search, setSearch] = useState('');
  const [expandedSnippet, setExpandedSnippet] = useState<string | null>(null);
  const [codeSnippets, setCodeSnippets] = useState<CodeSnippet[]>([]);
  const [snippetFavorites, setSnippetFavorites] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customSnippets, setCustomSnippets] = useState<CustomSnippet[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', language: 'TypeScript', description: '', code: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/snippets')
      .then(res => res.json())
      .then(data => {
        const snippets = (data.snippets || []).map((s: { id: string; name: string; language: string; description: string; code: string; favorited: boolean; createdAt: string }) => ({
          id: s.id,
          name: s.name,
          language: s.language,
          description: s.description,
          code: s.code,
          favorited: s.favorited || false,
        }));
        setCodeSnippets(snippets);
        const favs: Record<string, boolean> = {};
        snippets.forEach((s: CodeSnippet) => { favs[s.id] = s.favorited; });
        setSnippetFavorites(favs);
        setCustomSnippets(snippets.map((s: CodeSnippet & { createdAt?: string }) => ({
          ...s,
          createdAt: new Date(),
        })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    if (!search) return PROJECT_TEMPLATES;
    const q = search.toLowerCase();
    return PROJECT_TEMPLATES.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.techStack.some((s) => s.toLowerCase().includes(q))
    );
  }, [search]);

  // Filter snippets
  const filteredSnippets = useMemo(() => {
    if (!search) return codeSnippets;
    const q = search.toLowerCase();
    return codeSnippets.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.language.toLowerCase().includes(q)
    );
  }, [search, codeSnippets]);

  const handleCopy = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleFavorite = (id: string) => {
    setSnippetFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateSnippet = () => {
    if (!formData.name.trim() || !formData.code.trim()) return;
    const snippet: CustomSnippet = {
      id: `custom-${Date.now()}`,
      name: formData.name.trim(),
      language: formData.language,
      description: formData.description.trim(),
      code: formData.code,
      createdAt: new Date(),
    };
    setCustomSnippets((prev) => [snippet, ...prev]);
    setFormData({ name: '', language: 'TypeScript', description: '', code: '' });
    setShowCreateForm(false);
  };

  const handleUpdateSnippet = () => {
    if (!editingId || !formData.name.trim() || !formData.code.trim()) return;
    setCustomSnippets((prev) =>
      prev.map((s) =>
        s.id === editingId
          ? { ...s, name: formData.name.trim(), language: formData.language, description: formData.description.trim(), code: formData.code }
          : s
      )
    );
    setEditingId(null);
    setFormData({ name: '', language: 'TypeScript', description: '', code: '' });
  };

  const handleDeleteSnippet = (id: string) => {
    setCustomSnippets((prev) => prev.filter((s) => s.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setFormData({ name: '', language: 'TypeScript', description: '', code: '' });
    }
  };

  const handleEditSnippet = (snippet: CustomSnippet) => {
    setEditingId(snippet.id);
    setFormData({ name: snippet.name, language: snippet.language, description: snippet.description, code: snippet.code });
    setShowCreateForm(false);
  };

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-2.5 w-2.5 ${
              i < full
                ? 'text-amber-400 fill-amber-400'
                : i === full && half
                  ? 'text-amber-400 fill-amber-400/50'
                  : 'text-muted-foreground/30'
            }`}
          />
        ))}
        <span className="text-[9px] text-muted-foreground ml-0.5">{rating}</span>
      </div>
    );
  };

  const SECTIONS = [
    { id: 'templates' as const, label: 'Templates', icon: LayoutTemplate },
    { id: 'snippets' as const, label: 'Snippets', icon: Code },
    { id: 'custom' as const, label: 'Custom', icon: Plus },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <LayoutTemplate className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Templates & Snippets</h2>
              <p className="text-[10px] text-muted-foreground">Starter projects & reusable code</p>
            </div>
          </div>
          <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-400 gap-1">
            <FileCode className="h-2.5 w-2.5" />
            {PROJECT_TEMPLATES.length + codeSnippets.length + customSnippets.length} items
          </Badge>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates & snippets..."
            className="pl-8 h-8 text-xs bg-card/50"
          />
        </div>

        {/* Section tabs */}
        <div className="flex gap-1">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeSection === section.id
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-muted/50 text-muted-foreground hover:text-foreground border border-transparent'
                }`}
              >
                <Icon className="h-3 w-3" />
                {section.label}
              </button>
            );
          })}
        </div>
      </div>

      <Separator className="shrink-0" />

      {/* Content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-4">
          {/* Section 1: Project Templates */}
          {activeSection === 'templates' && (
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">Project Templates</span>
                <span className="text-[9px] text-muted-foreground">({filteredTemplates.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredTemplates.map((template, idx) => {
                  const Icon = template.icon;
                  return (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="group rounded-lg border border-border/50 bg-card/50 overflow-hidden hover:border-border transition-all"
                    >
                      {/* Gradient header */}
                      <div className={`h-20 bg-gradient-to-br ${template.gradient} relative overflow-hidden`}>
                        <div className="absolute inset-0 bg-black/10" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Icon className="h-10 w-10 text-white/30" />
                        </div>
                        {/* Rating overlay */}
                        <div className="absolute top-2 right-2">
                          <Badge className="text-[7px] h-4 px-1.5 bg-black/30 text-white border-0 backdrop-blur-sm gap-0.5">
                            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                            {template.rating}
                          </Badge>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-3">
                        <h3 className="text-xs font-semibold mb-1 group-hover:text-foreground transition-colors">
                          {template.name}
                        </h3>
                        <p className="text-[9px] text-muted-foreground line-clamp-2 mb-2">
                          {template.description}
                        </p>
                        {/* Tech stack badges */}
                        <div className="flex flex-wrap gap-1 mb-2.5">
                          {template.techStack.map((tech) => (
                            <Badge
                              key={tech}
                              variant="outline"
                              className="text-[7px] h-4 px-1.5 bg-muted/50"
                            >
                              {tech}
                            </Badge>
                          ))}
                        </div>
                        <Button
                          size="sm"
                          className="w-full h-7 text-[9px] bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          Use Template
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              {filteredTemplates.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Search className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-xs">No templates match your search</p>
                </div>
              )}
            </div>
          )}

          {/* Section 2: Code Snippets */}
          {activeSection === 'snippets' && (
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <Code className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">Code Snippets</span>
                <span className="text-[9px] text-muted-foreground">({filteredSnippets.length})</span>
              </div>
              <div className="space-y-2">
                {filteredSnippets.map((snippet, idx) => {
                  const isExpanded = expandedSnippet === snippet.id;
                  const isFavorited = snippetFavorites[snippet.id] ?? false;
                  const isCopied = copiedId === snippet.id;
                  const LangIcon = LANGUAGE_ICONS[snippet.language] || Braces;
                  const langColor = LANGUAGE_COLORS[snippet.language] || LANGUAGE_COLORS.TypeScript;

                  return (
                    <motion.div
                      key={snippet.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="rounded-lg border border-border/50 bg-card/50 overflow-hidden hover:border-border/80 transition-all"
                    >
                      {/* Header row */}
                      <div
                        className="flex items-center gap-2 p-3 cursor-pointer"
                        onClick={() => setExpandedSnippet(isExpanded ? null : snippet.id)}
                      >
                        <Badge className={`text-[7px] h-4 px-1.5 border gap-1 ${langColor}`} variant="outline">
                          <LangIcon className="h-2.5 w-2.5" />
                          {snippet.language}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-semibold truncate">{snippet.name}</span>
                          </div>
                          <p className="text-[9px] text-muted-foreground truncate">{snippet.description}</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(snippet.id); }}
                          className="shrink-0 p-1 rounded hover:bg-muted/50 transition-colors"
                          aria-label={isFavorited ? 'Unfavorite' : 'Favorite'}
                        >
                          <Star
                            className={`h-3.5 w-3.5 transition-colors ${
                              isFavorited
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-muted-foreground/40 hover:text-muted-foreground'
                            }`}
                          />
                        </button>
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        )}
                      </div>

                      {/* Expanded code */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 pb-3">
                              <div className="relative rounded-md bg-[#1e1e1e] border border-border/30 overflow-hidden">
                                <div className="flex items-center justify-between px-3 py-1.5 bg-muted/30 border-b border-border/20">
                                  <span className="text-[9px] font-mono text-muted-foreground">{snippet.language}</span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleCopy(snippet.code, snippet.id)}
                                      className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors text-[9px]"
                                    >
                                      {isCopied ? (
                                        <Check className="h-3 w-3 text-emerald-400" />
                                      ) : (
                                        <Copy className="h-3 w-3" />
                                      )}
                                      {isCopied ? 'Copied' : 'Copy'}
                                    </button>
                                  </div>
                                </div>
                                <pre className="p-3 text-[9px] leading-relaxed font-mono text-zinc-300 overflow-x-auto max-h-64 overflow-y-auto scrollbar-thin">
                                  <code>{snippet.code}</code>
                                </pre>
                              </div>
                              {/* Action buttons */}
                              <div className="flex items-center gap-2 mt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 px-2.5 text-[9px] gap-1"
                                  onClick={() => handleCopy(snippet.code, snippet.id)}
                                >
                                  {isCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                                  {isCopied ? 'Copied!' : 'Copy Code'}
                                </Button>
                                <Button
                                  size="sm"
                                  className="h-6 px-2.5 text-[9px] gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                  <Code className="h-3 w-3" />
                                  Use in Editor
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
              {filteredSnippets.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Search className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-xs">No snippets match your search</p>
                </div>
              )}
            </div>
          )}

          {/* Section 3: Custom Snippets */}
          {activeSection === 'custom' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-teal-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Custom Snippets</span>
                  <span className="text-[9px] text-muted-foreground">({customSnippets.length})</span>
                </div>
                <Button
                  size="sm"
                  className="h-6 px-2.5 text-[9px] gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => { setShowCreateForm(!showCreateForm); setEditingId(null); setFormData({ name: '', language: 'TypeScript', description: '', code: '' }); }}
                >
                  <Plus className="h-3 w-3" />
                  Create Snippet
                </Button>
              </div>

              {/* Create / Edit Form */}
              <AnimatePresence>
                {(showCreateForm || editingId) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mb-4 overflow-hidden"
                  >
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-emerald-400">
                          {editingId ? 'Edit Snippet' : 'Create New Snippet'}
                        </span>
                        <button
                          onClick={() => { setShowCreateForm(false); setEditingId(null); setFormData({ name: '', language: 'TypeScript', description: '', code: '' }); }}
                          className="p-1 rounded hover:bg-muted/50 text-muted-foreground transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                        placeholder="Snippet name..."
                        className="h-7 text-[10px] bg-card/50"
                      />
                      <div className="flex gap-2">
                        <Select value={formData.language} onValueChange={(v) => setFormData((p) => ({ ...p, language: v }))}>
                          <SelectTrigger className="h-7 text-[10px] bg-card/50 w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TypeScript">TypeScript</SelectItem>
                            <SelectItem value="CSS">CSS</SelectItem>
                            <SelectItem value="SQL">SQL</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Input
                        value={formData.description}
                        onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                        placeholder="Description..."
                        className="h-7 text-[10px] bg-card/50"
                      />
                      <Textarea
                        value={formData.code}
                        onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value }))}
                        placeholder="Paste or write your code here..."
                        className="min-h-[120px] text-[9px] font-mono bg-[#1e1e1e] border-border/30 resize-y"
                        rows={6}
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="h-6 px-3 text-[9px] gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={editingId ? handleUpdateSnippet : handleCreateSnippet}
                          disabled={!formData.name.trim() || !formData.code.trim()}
                        >
                          <Save className="h-3 w-3" />
                          {editingId ? 'Update' : 'Save Snippet'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-3 text-[9px] text-muted-foreground"
                          onClick={() => { setShowCreateForm(false); setEditingId(null); setFormData({ name: '', language: 'TypeScript', description: '', code: '' }); }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Custom snippets list */}
              {customSnippets.length === 0 && !showCreateForm && !editingId ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FileCode className="h-10 w-10 mb-3 opacity-30" />
                  <p className="text-xs font-medium mb-1">No custom snippets yet</p>
                  <p className="text-[10px] text-muted-foreground/60 mb-3">Create your first reusable code snippet</p>
                  <Button
                    size="sm"
                    className="h-7 px-3 text-[9px] gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => setShowCreateForm(true)}
                  >
                    <Plus className="h-3 w-3" />
                    Create Snippet
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {customSnippets.map((snippet, idx) => {
                    const LangIcon = LANGUAGE_ICONS[snippet.language] || Braces;
                    const langColor = LANGUAGE_COLORS[snippet.language] || LANGUAGE_COLORS.TypeScript;
                    const isCopied = copiedId === snippet.id;

                    return (
                      <motion.div
                        key={snippet.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="rounded-lg border border-border/50 bg-card/50 p-3 hover:border-border/80 transition-all"
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Badge className={`text-[7px] h-4 px-1.5 border gap-1 ${langColor}`} variant="outline">
                                <LangIcon className="h-2.5 w-2.5" />
                                {snippet.language}
                              </Badge>
                              <span className="text-[10px] font-semibold truncate">{snippet.name}</span>
                            </div>
                            {snippet.description && (
                              <p className="text-[9px] text-muted-foreground line-clamp-1">{snippet.description}</p>
                            )}
                            <div className="mt-1.5 rounded bg-[#1e1e1e] border border-border/30 p-2 max-h-24 overflow-hidden relative">
                              <pre className="text-[8px] font-mono text-zinc-400 overflow-hidden">
                                <code>{snippet.code.slice(0, 200)}{snippet.code.length > 200 ? '...' : ''}</code>
                              </pre>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 shrink-0">
                            <button
                              onClick={() => handleCopy(snippet.code, snippet.id)}
                              className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                              aria-label="Copy snippet"
                            >
                              {isCopied ? (
                                <Check className="h-3 w-3 text-emerald-400" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                            <button
                              onClick={() => handleEditSnippet(snippet)}
                              className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                              aria-label="Edit snippet"
                            >
                              <Edit3 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteSnippet(snippet.id)}
                              className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                              aria-label="Delete snippet"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-border/20">
                          <span className="text-[8px] text-muted-foreground">
                            {snippet.createdAt.toLocaleDateString()}
                          </span>
                          <Button
                            size="sm"
                            className="h-5 px-2 text-[8px] gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <Code className="h-2.5 w-2.5" />
                            Use in Editor
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer stats */}
      <Separator className="shrink-0" />
      <div className="shrink-0 px-4 py-2 flex items-center justify-between text-[10px] text-muted-foreground bg-card/30">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <LayoutTemplate className="h-2.5 w-2.5" />
            {PROJECT_TEMPLATES.length} templates
          </span>
          <span className="flex items-center gap-1">
            <Code className="h-2.5 w-2.5" />
            {codeSnippets.length} snippets
          </span>
        </div>
        <span className="flex items-center gap-1">
          <Star className="h-2.5 w-2.5 text-amber-400" />
          {Object.values(snippetFavorites).filter(Boolean).length} favorited
        </span>
      </div>
    </div>
  );
}
