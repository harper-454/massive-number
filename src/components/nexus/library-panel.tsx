'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Globe,
  Smartphone,
  Code,
  Gamepad2,
  Box,
  Star,
  GitFork,
  Plus,
  LayoutGrid,
  List,
  Search,
  MoreVertical,
  Trash2,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  Copy,
  ArrowUpDown,
  Filter,
  Archive,
  Package,
  Layers,
  Cpu,
  FileCode,
  Rocket,
  Clock,
  Tag,
  X,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  Hash,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ───────────────────────────────────────────────────────────────

type LibraryType = 'site' | 'app' | 'component' | 'api' | 'game' | 'model' | 'asset' | 'template';
type LibraryCategory = 'All' | 'Sites' | 'Apps' | 'Components' | 'APIs' | 'Games' | 'Models' | 'Assets' | 'Templates';
type LibraryStatus = 'draft' | 'published' | 'archived';
type ViewMode = 'grid' | 'list';
type SortMode = 'date' | 'name' | 'stars';

interface LibraryItem {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  category: string;
  tags: string[];
  thumbnail?: string | null;
  code: string;
  config: Record<string, unknown>;
  status: string;
  version: string;
  isPublic: boolean;
  stars: number;
  forks: number;
  parentId?: string | null;
  userId: string;
  projectId?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface LibraryStats {
  total: number;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
}

interface CreateFormData {
  name: string;
  description: string;
  type: LibraryType;
  category: string;
  tags: string;
}

// ── Config ──────────────────────────────────────────────────────────────

const CATEGORIES: LibraryCategory[] = [
  'All', 'Sites', 'Apps', 'Components', 'APIs', 'Games', 'Models', 'Assets', 'Templates',
];

const TYPE_TO_CATEGORY: Record<string, LibraryCategory> = {
  site: 'Sites',
  app: 'Apps',
  component: 'Components',
  api: 'APIs',
  game: 'Games',
  model: 'Models',
  asset: 'Assets',
  template: 'Templates',
};

const CATEGORY_TO_TYPES: Record<string, string[]> = {
  All: [],
  Sites: ['site'],
  Apps: ['app'],
  Components: ['component'],
  APIs: ['api'],
  Games: ['game'],
  Models: ['model'],
  Assets: ['asset'],
  Templates: ['template'],
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  site: Globe,
  app: Smartphone,
  component: Code,
  api: Cpu,
  game: Gamepad2,
  model: Box,
  asset: Package,
  template: Layers,
};

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  site: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  app: { bg: 'bg-violet-500/15', text: 'text-violet-400', border: 'border-violet-500/30' },
  component: { bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30' },
  api: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  game: { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' },
  model: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  asset: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
  template: { bg: 'bg-pink-500/15', text: 'text-pink-400', border: 'border-pink-500/30' },
};

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  draft: { bg: 'bg-zinc-500/15', text: 'text-zinc-400', border: 'border-zinc-500/30' },
  published: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  archived: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  draft: FileCode,
  published: Rocket,
  archived: Archive,
};

const LIBRARY_TYPES: LibraryType[] = ['site', 'app', 'component', 'api', 'game', 'model', 'asset', 'template'];

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'date', label: 'Last Updated' },
  { value: 'name', label: 'Name' },
  { value: 'stars', label: 'Stars' },
];

// ── Helpers ─────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

// ── Component ───────────────────────────────────────────────────────────

export function LibraryPanel() {
  // State
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [stats, setStats] = useState<LibraryStats>({ total: 0, byType: {}, byCategory: {} });
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<LibraryCategory>('All');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortMode, setSortMode] = useState<SortMode>('date');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<{ name: string; description: string; code: string }>({ name: '', description: '', code: '' });

  // Create form
  const [createForm, setCreateForm] = useState<CreateFormData>({
    name: '',
    description: '',
    type: 'site',
    category: 'web',
    tags: '',
  });

  // Fetch data
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);
      // Map category tab to type filter
      if (category !== 'All') {
        const types = CATEGORY_TO_TYPES[category];
        if (types.length > 0) params.set('type', types[0]);
      }
      params.set('limit', '100');
      params.set('offset', '0');

      const res = await fetch(`/api/library?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems((data.items || []).map((item: LibraryItem) => ({
          ...item,
          tags: Array.isArray(item.tags) ? item.tags : JSON.parse(item.tags as unknown as string || '[]'),
          config: typeof item.config === 'string' ? JSON.parse(item.config) : item.config,
        })));
        setStats({
          total: data.total || 0,
          byType: data.byType || {},
          byCategory: data.byCategory || {},
        });
      }
    } catch (err) {
      console.error('Failed to fetch library items:', err);
    } finally {
      setLoading(false);
    }
  }, [category, statusFilter, search]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Sorted items
  const sortedItems = useMemo(() => {
    const sorted = [...items];
    switch (sortMode) {
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'stars':
        sorted.sort((a, b) => b.stars - a.stars);
        break;
      case 'date':
      default:
        sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
    return sorted;
  }, [items, sortMode]);

  // Actions
  const handleCreate = async () => {
    if (!createForm.name.trim()) return;
    setCreating(true);
    try {
      const tags = createForm.tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const res = await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createForm.name.trim(),
          description: createForm.description.trim() || undefined,
          type: createForm.type,
          category: createForm.category,
          tags,
        }),
      });
      if (res.ok) {
        setShowCreateDialog(false);
        setCreateForm({ name: '', description: '', type: 'site', category: 'web', tags: '' });
        fetchItems();
      }
    } catch (err) {
      console.error('Create failed:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleFork = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fork', id }),
      });
      if (res.ok) {
        fetchItems();
      }
    } catch (err) {
      console.error('Fork failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePublish = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch('/api/library', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'published', isPublic: true }),
      });
      if (res.ok) {
        fetchItems();
        if (selectedItem?.id === id) {
          setSelectedItem(prev => prev ? { ...prev, status: 'published', isPublic: true } : null);
        }
      }
    } catch (err) {
      console.error('Publish failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchive = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch('/api/library', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'archived' }),
      });
      if (res.ok) {
        fetchItems();
        if (selectedItem?.id === id) {
          setSelectedItem(prev => prev ? { ...prev, status: 'archived' } : null);
        }
      }
    } catch (err) {
      console.error('Archive failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch('/api/library', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        if (selectedItem?.id === id) {
          setShowDetailDialog(false);
          setSelectedItem(null);
        }
        fetchItems();
      }
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateItem = async () => {
    if (!selectedItem) return;
    setActionLoading(selectedItem.id);
    try {
      const res = await fetch('/api/library', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedItem.id,
          name: editData.name,
          description: editData.description,
          code: editData.code,
        }),
      });
      if (res.ok) {
        setEditMode(false);
        fetchItems();
      }
    } catch (err) {
      console.error('Update failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const openDetail = (item: LibraryItem) => {
    setSelectedItem(item);
    setEditData({
      name: item.name,
      description: item.description || '',
      code: item.code || '',
    });
    setEditMode(false);
    setShowDetailDialog(true);
  };

  // Status breakdown for stats bar
  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = { draft: 0, published: 0, archived: 0 };
    items.forEach(item => {
      const s = item.status || 'draft';
      if (counts[s] !== undefined) counts[s]++;
    });
    return counts;
  }, [items]);

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <Layers className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Library</h2>
              <p className="text-[10px] text-muted-foreground">Your generated sites, apps & assets</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {/* View toggle */}
            <div className="flex items-center bg-muted/50 rounded-md border border-border/50 p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded-sm transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LayoutGrid className="h-3 w-3" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1 rounded-sm transition-colors ${
                  viewMode === 'list'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <List className="h-3 w-3" />
              </button>
            </div>
            <Button
              size="sm"
              className="h-7 text-[10px] gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-3 w-3" />
              New
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search library..."
              className="pl-8 h-8 text-xs bg-card/50"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className={`h-8 px-2 text-[10px] gap-1 ${showFilters ? 'border-emerald-500/30 text-emerald-400' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-3 w-3" />
            Filter
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 px-2 text-[10px] gap-1">
                <ArrowUpDown className="h-3 w-3" />
                {SORT_OPTIONS.find(o => o.value === sortMode)?.label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {SORT_OPTIONS.map(opt => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => setSortMode(opt.value)}
                  className="text-xs"
                >
                  {sortMode === opt.value && <CheckCircle2 className="h-3 w-3 mr-1.5 text-emerald-400" />}
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Extended filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden mb-2"
            >
              <div className="flex items-center gap-2 py-2">
                <span className="text-[10px] text-muted-foreground shrink-0">Status:</span>
                <div className="flex gap-1">
                  {(['all', 'draft', 'published', 'archived'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`px-2 py-0.5 rounded text-[9px] font-medium transition-colors ${
                        statusFilter === s
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-muted/50 text-muted-foreground hover:text-foreground border border-transparent'
                      }`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map(cat => {
            const catCount = cat === 'All' ? stats.total : (stats.byType[CATEGORY_TO_TYPES[cat]?.[0] || ''] || 0);
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition-colors shrink-0 flex items-center gap-1 ${
                  category === cat
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-muted/50 text-muted-foreground hover:text-foreground border border-transparent'
                }`}
              >
                {cat}
                {catCount > 0 && (
                  <span className="text-[8px] opacity-60">{catCount}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <Separator className="shrink-0" />

      {/* Content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4">
          {loading ? (
            /* Loading skeleton */
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3' : 'space-y-2'}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-border/30 bg-card/30 p-3 animate-pulse">
                  <div className="flex items-start gap-2">
                    <div className="h-10 w-10 rounded-lg bg-muted/30 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-24 rounded bg-muted/30" />
                      <div className="h-2 w-16 rounded bg-muted/20" />
                      <div className="h-2 w-32 rounded bg-muted/20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : sortedItems.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <div className="h-16 w-16 rounded-2xl bg-muted/20 flex items-center justify-center mb-4">
                <Layers className="h-8 w-8 opacity-30" />
              </div>
              <p className="text-sm font-medium mb-1">
                {search || statusFilter !== 'all' || category !== 'All'
                  ? 'No items match your filters'
                  : 'Your library is empty'}
              </p>
              <p className="text-[10px] text-muted-foreground/60 mb-4 max-w-48 text-center">
                {search || statusFilter !== 'all' || category !== 'All'
                  ? 'Try adjusting your search or filters'
                  : 'Generate your first site, app, or asset to see it here'}
              </p>
              {!search && statusFilter === 'all' && category === 'All' && (
                <Button
                  size="sm"
                  className="h-7 text-[10px] gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Plus className="h-3 w-3" />
                  Create First Item
                </Button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sortedItems.map(item => {
                const Icon = TYPE_ICONS[item.type] || Package;
                const colors = TYPE_COLORS[item.type] || TYPE_COLORS.site;
                const statusColors = STATUS_COLORS[item.status] || STATUS_COLORS.draft;
                const StatusIcon = STATUS_ICONS[item.status] || FileCode;

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-lg border border-border/50 bg-card/50 hover:border-border/80 transition-all cursor-pointer group"
                    onClick={() => openDetail(item)}
                  >
                    {/* Thumbnail area */}
                    <div className={`h-24 rounded-t-lg relative overflow-hidden ${
                      item.thumbnail ? '' : `${colors.bg} flex items-center justify-center`
                    }`}>
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Icon className={`h-8 w-8 ${colors.text} opacity-40`} />
                      )}
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Eye className="h-4 w-4 text-white" />
                      </div>
                      {/* Status indicator */}
                      <div className="absolute top-1.5 right-1.5">
                        <Badge
                          variant="outline"
                          className={`text-[7px] h-4 px-1.5 ${statusColors.bg} ${statusColors.text} border-${statusColors.border}`}
                        >
                          <StatusIcon className="h-2 w-2 mr-0.5" />
                          {item.status}
                        </Badge>
                      </div>
                      {/* Public indicator */}
                      {item.isPublic && (
                        <div className="absolute top-1.5 left-1.5">
                          <Badge variant="outline" className="text-[7px] h-4 px-1 bg-sky-500/15 text-sky-400 border-sky-500/30">
                            <Globe className="h-2 w-2 mr-0.5" />
                            Public
                          </Badge>
                        </div>
                      )}
                    </div>
                    {/* Card content */}
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="text-[11px] font-semibold truncate">{item.name}</span>
                        <Badge
                          variant="outline"
                          className={`text-[7px] h-4 px-1 shrink-0 ${colors.bg} ${colors.text} ${colors.border}`}
                        >
                          {item.type}
                        </Badge>
                      </div>
                      {item.description && (
                        <p className="text-[9px] text-muted-foreground line-clamp-1 mb-2">{item.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[8px] text-muted-foreground flex items-center gap-0.5">
                            <Star className="h-2.5 w-2.5 text-amber-400" />
                            {item.stars}
                          </span>
                          <span className="text-[8px] text-muted-foreground flex items-center gap-0.5">
                            <GitFork className="h-2.5 w-2.5" />
                            {item.forks}
                          </span>
                          <span className="text-[8px] text-muted-foreground">v{item.version}</span>
                        </div>
                        <span className="text-[8px] text-muted-foreground flex items-center gap-0.5">
                          <Clock className="h-2 w-2" />
                          {formatDate(item.updatedAt)}
                        </span>
                      </div>
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {item.tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="text-[7px] px-1 py-0.5 rounded bg-muted/50 text-muted-foreground">
                              {tag}
                            </span>
                          ))}
                          {item.tags.length > 3 && (
                            <span className="text-[7px] px-1 py-0.5 text-muted-foreground">+{item.tags.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className="space-y-1">
              {sortedItems.map(item => {
                const Icon = TYPE_ICONS[item.type] || Package;
                const colors = TYPE_COLORS[item.type] || TYPE_COLORS.site;
                const statusColors = STATUS_COLORS[item.status] || STATUS_COLORS.draft;
                const StatusIcon = STATUS_ICONS[item.status] || FileCode;

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 rounded-lg border border-border/40 bg-card/30 hover:border-border/70 hover:bg-card/60 transition-all cursor-pointer px-3 py-2 group"
                    onClick={() => openDetail(item)}
                  >
                    {/* Icon/Thumbnail */}
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                      item.thumbnail
                        ? 'overflow-hidden'
                        : colors.bg
                    }`}>
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Icon className={`h-4 w-4 ${colors.text}`} />
                      )}
                    </div>

                    {/* Name & desc */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold truncate">{item.name}</span>
                        <Badge
                          variant="outline"
                          className={`text-[7px] h-3.5 px-1 shrink-0 ${statusColors.bg} ${statusColors.text}`}
                        >
                          <StatusIcon className="h-2 w-2 mr-0.5" />
                          {item.status}
                        </Badge>
                      </div>
                      {item.description && (
                        <p className="text-[8px] text-muted-foreground truncate">{item.description}</p>
                      )}
                    </div>

                    {/* Type badge */}
                    <Badge
                      variant="outline"
                      className={`text-[7px] h-5 px-1.5 shrink-0 ${colors.bg} ${colors.text} ${colors.border}`}
                    >
                      {item.type}
                    </Badge>

                    {/* Stats */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[8px] text-muted-foreground flex items-center gap-0.5">
                        <Star className="h-2.5 w-2.5 text-amber-400" />
                        {item.stars}
                      </span>
                      <span className="text-[8px] text-muted-foreground flex items-center gap-0.5">
                        <GitFork className="h-2.5 w-2.5" />
                        {item.forks}
                      </span>
                      <span className="text-[8px] text-muted-foreground">v{item.version}</span>
                    </div>

                    {/* Updated */}
                    <span className="text-[8px] text-muted-foreground shrink-0 w-14 text-right flex items-center gap-0.5 justify-end">
                      <Clock className="h-2 w-2" />
                      {formatDate(item.updatedAt)}
                    </span>

                    {/* Actions dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem
                          className="text-xs"
                          onClick={(e) => { e.stopPropagation(); openDetail(item); }}
                        >
                          <Eye className="h-3 w-3 mr-1.5" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-xs"
                          onClick={(e) => { e.stopPropagation(); handleFork(item.id); }}
                          disabled={actionLoading === item.id}
                        >
                          <GitFork className="h-3 w-3 mr-1.5" /> Fork
                        </DropdownMenuItem>
                        {item.status === 'draft' && (
                          <DropdownMenuItem
                            className="text-xs text-emerald-400"
                            onClick={(e) => { e.stopPropagation(); handlePublish(item.id); }}
                            disabled={actionLoading === item.id}
                          >
                            <Rocket className="h-3 w-3 mr-1.5" /> Publish
                          </DropdownMenuItem>
                        )}
                        {item.status !== 'archived' && (
                          <DropdownMenuItem
                            className="text-xs text-amber-400"
                            onClick={(e) => { e.stopPropagation(); handleArchive(item.id); }}
                            disabled={actionLoading === item.id}
                          >
                            <Archive className="h-3 w-3 mr-1.5" /> Archive
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-xs text-red-400"
                          onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                          disabled={actionLoading === item.id}
                        >
                          <Trash2 className="h-3 w-3 mr-1.5" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      <Separator className="shrink-0" />

      {/* Stats Bar */}
      <div className="shrink-0 px-4 py-2 bg-card/30">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Layers className="h-2.5 w-2.5" />
              {stats.total} items
            </span>
          </div>
          <div className="flex items-center gap-3">
            {Object.entries(statusBreakdown).map(([status, count]) => {
              if (count === 0) return null;
              const sc = STATUS_COLORS[status];
              return (
                <span key={status} className={`text-[9px] flex items-center gap-0.5 ${sc.text}`}>
                  {count} {status}
                </span>
              );
            })}
          </div>
        </div>
        {/* Type breakdown bar */}
        {stats.total > 0 && (
          <div className="flex h-1 rounded-full overflow-hidden bg-muted/30">
            {Object.entries(stats.byType).map(([type, count]) => {
              const pct = (count / stats.total) * 100;
              const typeColorMap: Record<string, string> = {
                site: 'bg-emerald-500',
                app: 'bg-violet-500',
                component: 'bg-sky-500',
                api: 'bg-amber-500',
                game: 'bg-rose-500',
                model: 'bg-cyan-500',
                asset: 'bg-orange-500',
                template: 'bg-pink-500',
              };
              return (
                <div
                  key={type}
                  className={`${typeColorMap[type] || 'bg-zinc-500'} transition-all`}
                  style={{ width: `${pct}%` }}
                  title={`${type}: ${count}`}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ── Create Dialog ──────────────────────────────────────────── */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-emerald-500/15 flex items-center justify-center">
                <Plus className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              Create Library Item
            </DialogTitle>
            <DialogDescription className="text-[11px] text-muted-foreground">
              Add a new site, app, component, or asset to your library.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Name *</label>
              <Input
                value={createForm.name}
                onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="My awesome project"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Type *</label>
              <div className="grid grid-cols-4 gap-1">
                {LIBRARY_TYPES.map(type => {
                  const Icon = TYPE_ICONS[type];
                  const colors = TYPE_COLORS[type];
                  return (
                    <button
                      key={type}
                      onClick={() => setCreateForm(prev => ({ ...prev, type }))}
                      className={`flex flex-col items-center gap-1 p-2 rounded-md text-[9px] font-medium transition-colors border ${
                        createForm.type === type
                          ? `${colors.bg} ${colors.text} ${colors.border}`
                          : 'bg-muted/30 text-muted-foreground border-transparent hover:border-border/50'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Category</label>
              <Input
                value={createForm.category}
                onChange={(e) => setCreateForm(prev => ({ ...prev, category: e.target.value }))}
                placeholder="web, mobile, backend..."
                className="h-8 text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Description</label>
              <Textarea
                value={createForm.description}
                onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this item does..."
                className="text-xs min-h-[60px] resize-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                Tags <span className="opacity-50">(comma separated)</span>
              </label>
              <Input
                value={createForm.tags}
                onChange={(e) => setCreateForm(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="react, typescript, saas"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-[10px] h-7"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="text-[10px] h-7 bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
              onClick={handleCreate}
              disabled={!createForm.name.trim() || creating}
            >
              {creating ? (
                <Sparkles className="h-3 w-3 animate-spin" />
              ) : (
                <Plus className="h-3 w-3" />
              )}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Detail Dialog ──────────────────────────────────────────── */}
      <Dialog open={showDetailDialog} onOpenChange={(open) => { if (!open) { setShowDetailDialog(false); setSelectedItem(null); setEditMode(false); } }}>
        <DialogContent className="sm:max-w-2xl bg-zinc-950 border-zinc-800 max-h-[80vh] overflow-y-auto">
          {selectedItem && (() => {
            const Icon = TYPE_ICONS[selectedItem.type] || Package;
            const colors = TYPE_COLORS[selectedItem.type] || TYPE_COLORS.site;
            const statusColors = STATUS_COLORS[selectedItem.status] || STATUS_COLORS.draft;
            const StatusIcon = STATUS_ICONS[selectedItem.status] || FileCode;

            return (
              <>
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <DialogTitle className="text-sm flex items-center gap-2">
                      <div className={`h-7 w-7 rounded-lg ${colors.bg} flex items-center justify-center`}>
                        <Icon className={`h-4 w-4 ${colors.text}`} />
                      </div>
                      {editMode ? (
                        <Input
                          value={editData.name}
                          onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                          className="h-7 text-xs max-w-48"
                        />
                      ) : (
                        <span>{selectedItem.name}</span>
                      )}
                      <Badge variant="outline" className={`text-[8px] h-5 px-1.5 ${colors.bg} ${colors.text} ${colors.border}`}>
                        {selectedItem.type}
                      </Badge>
                    </DialogTitle>
                    <div className="flex items-center gap-1">
                      {!editMode ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => setEditMode(true)}
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[10px] text-red-400 hover:text-red-300"
                            onClick={() => { setEditMode(false); setEditData({ name: selectedItem.name, description: selectedItem.description || '', code: selectedItem.code || '' }); }}
                          >
                            <X className="h-3 w-3 mr-0.5" /> Cancel
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white gap-0.5"
                            onClick={handleUpdateItem}
                            disabled={actionLoading === selectedItem.id}
                          >
                            <CheckCircle2 className="h-3 w-3" /> Save
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <DialogDescription className="sr-only">Details for {selectedItem.name}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  {/* Meta row */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant="outline" className={`text-[8px] h-5 px-1.5 gap-0.5 ${statusColors.bg} ${statusColors.text}`}>
                      <StatusIcon className="h-2.5 w-2.5" />
                      {selectedItem.status}
                    </Badge>
                    <Badge variant="outline" className="text-[8px] h-5 px-1.5 gap-0.5 bg-zinc-500/10 text-zinc-400 border-zinc-500/30">
                      <Hash className="h-2.5 w-2.5" />
                      v{selectedItem.version}
                    </Badge>
                    <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                      <Star className="h-2.5 w-2.5 text-amber-400" />
                      {selectedItem.stars} stars
                    </span>
                    <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                      <GitFork className="h-2.5 w-2.5" />
                      {selectedItem.forks} forks
                    </span>
                    <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" />
                      Updated {formatDate(selectedItem.updatedAt)}
                    </span>
                    {selectedItem.isPublic ? (
                      <Badge variant="outline" className="text-[8px] h-5 px-1.5 gap-0.5 bg-sky-500/15 text-sky-400 border-sky-500/30">
                        <Globe className="h-2.5 w-2.5" /> Public
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[8px] h-5 px-1.5 gap-0.5 bg-zinc-500/10 text-zinc-500 border-zinc-500/30">
                        <EyeOff className="h-2.5 w-2.5" /> Private
                      </Badge>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Description</label>
                    {editMode ? (
                      <Textarea
                        value={editData.description}
                        onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                        className="text-xs min-h-[60px] resize-none"
                      />
                    ) : (
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {selectedItem.description || 'No description provided.'}
                      </p>
                    )}
                  </div>

                  {/* Tags */}
                  {selectedItem.tags && selectedItem.tags.length > 0 && (
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Tags</label>
                      <div className="flex gap-1 flex-wrap">
                        {selectedItem.tags.map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-[8px] h-5 px-1.5 bg-muted/30 text-muted-foreground border-border/50 gap-0.5">
                            <Tag className="h-2 w-2" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Config */}
                  {selectedItem.config && Object.keys(selectedItem.config).length > 0 && (
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Configuration</label>
                      <div className="rounded-md border border-border/40 bg-zinc-900/80 p-3">
                        <pre className="text-[9px] text-emerald-400/80 font-mono whitespace-pre-wrap overflow-x-auto max-h-40 overflow-y-auto">
                          {JSON.stringify(selectedItem.config, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Code */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-medium text-muted-foreground">Code</label>
                      {!editMode && selectedItem.code && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 text-[8px] text-muted-foreground gap-0.5"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedItem.code);
                          }}
                        >
                          <Copy className="h-2.5 w-2.5" /> Copy
                        </Button>
                      )}
                    </div>
                    {editMode ? (
                      <Textarea
                        value={editData.code}
                        onChange={(e) => setEditData(prev => ({ ...prev, code: e.target.value }))}
                        className="text-[9px] font-mono min-h-[120px] resize-none"
                      />
                    ) : (
                      <div className="rounded-md border border-border/40 bg-zinc-900/80 p-3">
                        <pre className="text-[9px] text-sky-400/80 font-mono whitespace-pre-wrap overflow-x-auto max-h-48 overflow-y-auto">
                          {selectedItem.code || '// No code yet'}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Metadata */}
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Metadata</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-md border border-border/30 bg-muted/20 p-2">
                        <span className="text-[8px] text-muted-foreground block">Created</span>
                        <span className="text-[10px]">{new Date(selectedItem.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="rounded-md border border-border/30 bg-muted/20 p-2">
                        <span className="text-[8px] text-muted-foreground block">Category</span>
                        <span className="text-[10px]">{selectedItem.category}</span>
                      </div>
                      {selectedItem.parentId && (
                        <div className="rounded-md border border-border/30 bg-muted/20 p-2 col-span-2">
                          <span className="text-[8px] text-muted-foreground block">Forked from</span>
                          <span className="text-[10px] flex items-center gap-1">
                            <GitFork className="h-2.5 w-2.5 text-muted-foreground" />
                            {selectedItem.parentId}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] gap-1"
                      onClick={() => handleFork(selectedItem.id)}
                      disabled={actionLoading === selectedItem.id}
                    >
                      <GitFork className="h-3 w-3" />
                      Fork
                    </Button>
                    {selectedItem.status === 'draft' && (
                      <Button
                        size="sm"
                        className="h-7 text-[10px] gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handlePublish(selectedItem.id)}
                        disabled={actionLoading === selectedItem.id}
                      >
                        <Rocket className="h-3 w-3" />
                        Publish
                      </Button>
                    )}
                    {selectedItem.status === 'published' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[10px] gap-1"
                        onClick={() => handleArchive(selectedItem.id)}
                        disabled={actionLoading === selectedItem.id}
                      >
                        <Archive className="h-3 w-3" />
                        Archive
                      </Button>
                    )}
                    {selectedItem.status === 'archived' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[10px] gap-1"
                        onClick={() => handlePublish(selectedItem.id)}
                        disabled={actionLoading === selectedItem.id}
                      >
                        <Rocket className="h-3 w-3" />
                        Republish
                      </Button>
                    )}
                    <div className="flex-1" />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] gap-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                      onClick={() => handleDelete(selectedItem.id)}
                      disabled={actionLoading === selectedItem.id}
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
