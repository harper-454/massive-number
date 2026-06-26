'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Store,
  Search,
  Star,
  Download,
  CheckCircle2,
  X,
  Sparkles,
  ShieldCheck,
  Tag,
  Package,
  Users,
  ChevronRight,
  Flame,
  Bot,
  TestTube2,
  Palette,
  Server,
  Database,
  Lock,
  BookOpen,
  Activity,
  Languages,
  Zap,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ───────────────────────────────────────────────────────────────

type MarketplaceCategory =
  | 'All'
  | 'AI'
  | 'Testing'
  | 'Design'
  | 'DevOps'
  | 'Database'
  | 'Security'
  | 'Documentation'
  | 'Monitoring'
  | 'Localization';

interface Plugin {
  id: string;
  name: string;
  description: string;
  author: string;
  rating: number;
  downloads: number;
  price: 'free' | number;
  verified: boolean;
  featured: boolean;
  category: MarketplaceCategory;
  icon: React.ElementType;
  installed: boolean;
}

// ── Category Config (config, not data) ──────────────────────────────────

const CATEGORIES: MarketplaceCategory[] = [
  'All', 'AI', 'Testing', 'Design', 'DevOps', 'Database', 'Security', 'Documentation', 'Monitoring', 'Localization',
];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  AI: Bot,
  Testing: TestTube2,
  Design: Palette,
  DevOps: Server,
  Database: Database,
  Security: Lock,
  Documentation: BookOpen,
  Monitoring: Activity,
  Localization: Languages,
};

// ── Marketplace Icon Map ────────────────────────────────────────────────

const MARKETPLACE_ICON_MAP: Record<string, React.ElementType> = {
  ai: Bot,
  testing: TestTube2,
  design: Palette,
  devops: Server,
  database: Database,
  security: Lock,
  documentation: BookOpen,
  monitoring: Activity,
  localization: Languages,
};

// ── Component ───────────────────────────────────────────────────────────

export function MarketplacePanel() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<MarketplaceCategory>('All');
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [installedPlugins, setInstalledPlugins] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/marketplace')
      .then(res => res.json())
      .then(data => {
        const mapped = (data.items || []).map((p: { id: string; name: string; description: string; author: string; rating: number; downloads: number; price: string; verified: boolean; category: string; installed: boolean }) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          author: p.author,
          rating: p.rating,
          downloads: p.downloads,
          price: p.price === 'free' ? 'free' as const : parseFloat(String(p.price).replace(/[^0-9.]/g, '')) || 0,
          verified: p.verified,
          featured: p.rating >= 4.6 && p.downloads >= 5000,
          category: (p.category?.charAt(0).toUpperCase() + p.category?.slice(1)) as MarketplaceCategory,
          icon: MARKETPLACE_ICON_MAP[p.category?.toLowerCase()] || Package,
          installed: p.installed,
        }));
        setPlugins(mapped);
        const inst: Record<string, boolean> = {};
        mapped.forEach((p: Plugin) => { inst[p.id] = p.installed; });
        setInstalledPlugins(inst);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredPlugins = useMemo(() => {
    return plugins.filter((p) => {
      const matchesCategory = category === 'All' || p.category === category;
      const matchesSearch =
        search === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase()) ||
        p.author.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [search, category, plugins]);

  const featuredPlugins = filteredPlugins.filter((p) => p.featured);
  const regularPlugins = filteredPlugins.filter((p) => !p.featured);

  const totalInstalled = Object.values(installedPlugins).filter(Boolean).length;
  const totalDownloads = plugins.reduce((s, p) => s + p.downloads, 0);
  const communityBuilt = plugins.filter((p) => p.author !== 'MASSIVE NUMBER').length;

  const toggleInstall = (id: string) => {
    const action = installedPlugins[id] ? 'uninstall' : 'install';
    setInstalledPlugins((prev) => ({ ...prev, [id]: !prev[id] }));
    fetch('/api/marketplace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, itemId: id }),
    }).catch(() => {
      setInstalledPlugins((prev) => ({ ...prev, [id]: !prev[id] }));
    });
  };

  const formatDownloads = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
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
        <span className="text-[8px] text-muted-foreground ml-0.5">{rating}</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-orange-500/15 flex items-center justify-center">
              <Store className="h-4 w-4 text-orange-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Integration Marketplace</h2>
              <p className="text-[10px] text-muted-foreground">Extend your platform with plugins</p>
            </div>
          </div>
          <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-400 gap-1">
            <Package className="h-2.5 w-2.5" />
            {totalInstalled} installed
          </Badge>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search integrations..."
            className="pl-8 h-8 text-xs bg-card/50"
          />
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const CatIcon = CATEGORY_ICONS[cat];
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition-colors shrink-0 flex items-center gap-1 ${
                  category === cat
                    ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                    : 'bg-muted/50 text-muted-foreground hover:text-foreground border border-transparent'
                }`}
              >
                {CatIcon && <CatIcon className="h-2.5 w-2.5" />}
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      <Separator className="shrink-0" />

      {/* Content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-4">
          {/* Featured section */}
          {featuredPlugins.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <Flame className="h-3.5 w-3.5 text-orange-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">Featured</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {featuredPlugins.map((plugin) => {
                  const isInstalled = installedPlugins[plugin.id] ?? false;
                  const Icon = plugin.icon;

                  return (
                    <motion.div
                      key={plugin.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-lg border border-orange-500/20 bg-gradient-to-b from-orange-500/5 to-transparent p-3 hover:border-orange-500/40 transition-colors"
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <div className="h-8 w-8 rounded-lg bg-orange-500/15 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-orange-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-semibold truncate">{plugin.name}</span>
                            {plugin.verified && (
                              <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                            )}
                          </div>
                          <span className="text-[8px] text-muted-foreground">by {plugin.author}</span>
                        </div>
                      </div>
                      <p className="text-[9px] text-muted-foreground line-clamp-2 mb-2">
                        {plugin.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {renderStars(plugin.rating)}
                          <span className="text-[8px] text-muted-foreground flex items-center gap-0.5">
                            <Download className="h-2 w-2" />
                            {formatDownloads(plugin.downloads)}
                          </span>
                        </div>
                        <Badge
                          className={`text-[7px] h-4 px-1.5 border ${
                            plugin.price === 'free'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          }`}
                          variant="outline"
                        >
                          {plugin.price === 'free' ? 'Free' : `$${plugin.price}`}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant={isInstalled ? 'outline' : 'default'}
                        className={`w-full h-6 mt-2 text-[9px] ${
                          isInstalled
                            ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                            : ''
                        }`}
                        onClick={() => toggleInstall(plugin.id)}
                      >
                        {isInstalled ? (
                          <>
                            <X className="h-3 w-3 mr-0.5" />
                            Uninstall
                          </>
                        ) : (
                          <>
                            <Download className="h-3 w-3 mr-0.5" />
                            Install
                          </>
                        )}
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* All plugins grid */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Package className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">
                {category === 'All' ? 'All Integrations' : category}
              </span>
              <span className="text-[9px] text-muted-foreground">({filteredPlugins.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {regularPlugins.map((plugin) => {
                const isInstalled = installedPlugins[plugin.id] ?? false;
                const Icon = plugin.icon;

                return (
                  <motion.div
                    key={plugin.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`rounded-lg border p-3 transition-colors hover:border-border/80 ${
                      isInstalled
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : 'border-border/50 bg-card/50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isInstalled ? 'bg-emerald-500/15' : 'bg-muted/50'
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 ${
                            isInstalled ? 'text-emerald-400' : 'text-muted-foreground'
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold truncate">{plugin.name}</span>
                          {plugin.verified && (
                            <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400 shrink-0" />
                          )}
                          {isInstalled && (
                            <Badge className="text-[7px] h-3.5 px-1 bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 shrink-0">
                              Installed
                            </Badge>
                          )}
                        </div>
                        <span className="text-[8px] text-muted-foreground">by {plugin.author}</span>
                        <p className="text-[9px] text-muted-foreground line-clamp-1 mt-0.5">
                          {plugin.description}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          {renderStars(plugin.rating)}
                          <span className="text-[8px] text-muted-foreground flex items-center gap-0.5">
                            <Download className="h-2 w-2" />
                            {formatDownloads(plugin.downloads)}
                          </span>
                          <Badge
                            className={`text-[7px] h-3.5 px-1 border ${
                              plugin.price === 'free'
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            }`}
                            variant="outline"
                          >
                            <Tag className="h-2 w-2 mr-0.5" />
                            {plugin.price === 'free' ? 'Free' : `$${plugin.price}`}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={isInstalled ? 'ghost' : 'outline'}
                        className={`h-6 px-2 text-[8px] shrink-0 ${
                          isInstalled ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10' : ''
                        }`}
                        onClick={() => toggleInstall(plugin.id)}
                      >
                        {isInstalled ? 'Remove' : 'Install'}
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {filteredPlugins.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Search className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-xs">No integrations match your search</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <Separator className="shrink-0" />

      {/* Stats footer */}
      <div className="shrink-0 px-4 py-2 flex items-center justify-between text-[10px] text-muted-foreground bg-card/30">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Package className="h-2.5 w-2.5" />
            {plugins.length} integrations available
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-2.5 w-2.5" />
            {communityBuilt} community-built
          </span>
        </div>
        <span className="flex items-center gap-1">
          <Download className="h-2.5 w-2.5" />
          {formatDownloads(totalDownloads)} total downloads
        </span>
      </div>
    </div>
  );
}
