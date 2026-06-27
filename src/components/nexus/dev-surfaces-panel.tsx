'use client';

import { useState, useEffect } from 'react';
import {
  Gamepad2,
  Globe,
  Server,
  Monitor,
  Link2,
  Smartphone,
  BarChart3,
  Cable,
  Rocket,
  Box,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  Sparkles,
  Layout,
  ArrowRight,
  Star,
  Loader2,
  Settings2,
  Play,
  Shapes,
  Shield,
  Music,
  Video,
  Map,
  Cpu,
  Database,
  Cuboid,
  PuzzleIcon,
  Zap,
  Blocks,
  BrainCircuit,
  Hammer,
  Network,
  Filter,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';

// Surface type → panel view mapping for launching
const SURFACE_LAUNCH_TARGET: Record<string, string> = {
  modeling: 'editor',
  game: 'editor',
  'web-design': 'editor',
  backend: 'terminal',
  frontend: 'editor',
  fullstack: 'editor',
  mobile: 'editor',
  data: 'terminal',
  api: 'editor',
  devops: 'terminal',
  custom: 'editor',
  // New surfaces
  '3d-modeling': 'editor',
  unity: 'editor',
  unreal: 'editor',
  godot: 'editor',
  'chrome-ext': 'editor',
  'vscode-ext': 'editor',
  web3: 'editor',
  'ml-training': 'terminal',
  'devops-pro': 'terminal',
  security: 'terminal',
  audio: 'editor',
  video: 'editor',
  gis: 'editor',
  iot: 'terminal',
  database: 'editor',
};

interface DevSurface {
  id: string;
  name: string;
  type: string;
  description?: string;
  icon?: string;
  color: string;
  tools: string[];
  layout: Record<string, unknown>;
  status: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

const SURFACE_ICONS: Record<string, React.ReactNode> = {
  modeling: <Box className="h-6 w-6" />,
  game: <Gamepad2 className="h-6 w-6" />,
  'web-design': <Globe className="h-6 w-6" />,
  backend: <Server className="h-6 w-6" />,
  frontend: <Monitor className="h-6 w-6" />,
  fullstack: <Link2 className="h-6 w-6" />,
  mobile: <Smartphone className="h-6 w-6" />,
  data: <BarChart3 className="h-6 w-6" />,
  api: <Cable className="h-6 w-6" />,
  devops: <Rocket className="h-6 w-6" />,
  // New surfaces
  '3d-modeling': <Cuboid className="h-6 w-6" />,
  unity: <Blocks className="h-6 w-6" />,
  unreal: <Shapes className="h-6 w-6" />,
  godot: <Gamepad2 className="h-6 w-6" />,
  'chrome-ext': <PuzzleIcon className="h-6 w-6" />,
  'vscode-ext': <Zap className="h-6 w-6" />,
  web3: <Network className="h-6 w-6" />,
  'ml-training': <BrainCircuit className="h-6 w-6" />,
  'devops-pro': <Hammer className="h-6 w-6" />,
  security: <Shield className="h-6 w-6" />,
  audio: <Music className="h-6 w-6" />,
  video: <Video className="h-6 w-6" />,
  gis: <Map className="h-6 w-6" />,
  iot: <Cpu className="h-6 w-6" />,
  database: <Database className="h-6 w-6" />,
};

const SURFACE_COLORS: Record<string, { bg: string; border: string; text: string; gradient: string }> = {
  modeling: { bg: 'bg-rose-500/15', border: 'border-rose-500/30', text: 'text-rose-400', gradient: 'from-rose-500/20 to-pink-600/20' },
  game: { bg: 'bg-violet-500/15', border: 'border-violet-500/30', text: 'text-violet-400', gradient: 'from-violet-500/20 to-purple-600/20' },
  'web-design': { bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', text: 'text-emerald-400', gradient: 'from-emerald-500/20 to-green-600/20' },
  backend: { bg: 'bg-amber-500/15', border: 'border-amber-500/30', text: 'text-amber-400', gradient: 'from-amber-500/20 to-orange-600/20' },
  frontend: { bg: 'bg-cyan-500/15', border: 'border-cyan-500/30', text: 'text-cyan-400', gradient: 'from-cyan-500/20 to-teal-600/20' },
  fullstack: { bg: 'bg-teal-500/15', border: 'border-teal-500/30', text: 'text-teal-400', gradient: 'from-emerald-500/20 to-teal-600/20' },
  mobile: { bg: 'bg-sky-500/15', border: 'border-sky-500/30', text: 'text-sky-400', gradient: 'from-sky-500/20 to-blue-600/20' },
  data: { bg: 'bg-yellow-500/15', border: 'border-yellow-500/30', text: 'text-yellow-400', gradient: 'from-yellow-500/20 to-amber-600/20' },
  api: { bg: 'bg-orange-500/15', border: 'border-orange-500/30', text: 'text-orange-400', gradient: 'from-orange-500/20 to-red-600/20' },
  devops: { bg: 'bg-zinc-500/15', border: 'border-zinc-500/30', text: 'text-zinc-400', gradient: 'from-zinc-500/20 to-zinc-700/20' },
  // New surfaces
  '3d-modeling': { bg: 'bg-pink-500/15', border: 'border-pink-500/30', text: 'text-pink-400', gradient: 'from-pink-500/20 to-rose-600/20' },
  unity: { bg: 'bg-purple-500/15', border: 'border-purple-500/30', text: 'text-purple-400', gradient: 'from-purple-500/20 to-violet-600/20' },
  unreal: { bg: 'bg-fuchsia-500/15', border: 'border-fuchsia-500/30', text: 'text-fuchsia-400', gradient: 'from-fuchsia-500/20 to-purple-600/20' },
  godot: { bg: 'bg-sky-500/15', border: 'border-sky-500/30', text: 'text-sky-400', gradient: 'from-sky-400/20 to-cyan-600/20' },
  'chrome-ext': { bg: 'bg-green-500/15', border: 'border-green-500/30', text: 'text-green-400', gradient: 'from-green-500/20 to-emerald-600/20' },
  'vscode-ext': { bg: 'bg-cyan-500/15', border: 'border-cyan-500/30', text: 'text-cyan-400', gradient: 'from-cyan-500/20 to-sky-600/20' },
  web3: { bg: 'bg-amber-500/15', border: 'border-amber-500/30', text: 'text-amber-400', gradient: 'from-amber-400/20 to-yellow-600/20' },
  'ml-training': { bg: 'bg-red-500/15', border: 'border-red-500/30', text: 'text-red-400', gradient: 'from-red-500/20 to-rose-600/20' },
  'devops-pro': { bg: 'bg-slate-500/15', border: 'border-slate-500/30', text: 'text-slate-400', gradient: 'from-slate-500/20 to-zinc-700/20' },
  security: { bg: 'bg-red-600/15', border: 'border-red-600/30', text: 'text-red-500', gradient: 'from-red-600/20 to-red-800/20' },
  audio: { bg: 'bg-purple-500/15', border: 'border-purple-500/30', text: 'text-purple-400', gradient: 'from-purple-500/20 to-fuchsia-600/20' },
  video: { bg: 'bg-rose-600/15', border: 'border-rose-600/30', text: 'text-rose-500', gradient: 'from-rose-600/20 to-pink-700/20' },
  gis: { bg: 'bg-emerald-600/15', border: 'border-emerald-600/30', text: 'text-emerald-500', gradient: 'from-emerald-600/20 to-green-700/20' },
  iot: { bg: 'bg-teal-500/15', border: 'border-teal-500/30', text: 'text-teal-400', gradient: 'from-teal-500/20 to-cyan-700/20' },
  database: { bg: 'bg-violet-600/15', border: 'border-violet-600/30', text: 'text-violet-500', gradient: 'from-violet-600/20 to-purple-800/20' },
};

const SURFACE_EMOJIS: Record<string, string> = {
  modeling: '🎨',
  game: '🎮',
  'web-design': '🌐',
  backend: '⚙️',
  frontend: '🖥️',
  fullstack: '🔗',
  mobile: '📱',
  data: '📊',
  api: '🔌',
  devops: '🚀',
  // New surfaces
  '3d-modeling': '🧊',
  unity: '🕹️',
  unreal: '🔥',
  godot: '🎯',
  'chrome-ext': '🧩',
  'vscode-ext': '⚡',
  web3: '⛓️',
  'ml-training': '🧠',
  'devops-pro': '🏗️',
  security: '🛡️',
  audio: '🎵',
  video: '🎬',
  gis: '🗺️',
  iot: '📡',
  database: '🗄️',
};

interface DevSurfacesPanelProps {
  onLaunchSurface?: (surface: DevSurface, targetPanel: string) => void;
}

// Category definitions for filtering
const SURFACE_CATEGORIES = [
  { id: 'all', label: 'All', types: [] },
  { id: 'game', label: 'Game Dev', types: ['game', 'unity', 'unreal', 'godot'] },
  { id: 'web', label: 'Web', types: ['web-design', 'chrome-ext', 'vscode-ext', 'frontend'] },
  { id: 'data', label: 'Data', types: ['data', 'ml-training', 'database', 'gis'] },
  { id: 'infra', label: 'Infra', types: ['backend', 'devops', 'devops-pro', 'security', 'iot'] },
  { id: 'creative', label: 'Creative', types: ['modeling', '3d-modeling', 'audio', 'video'] },
  { id: 'code', label: 'Code', types: ['fullstack', 'api', 'mobile', 'web3'] },
] as const;

type CategoryId = typeof SURFACE_CATEGORIES[number]['id'];

export function DevSurfacesPanel({ onLaunchSurface }: DevSurfacesPanelProps) {
  const [surfaces, setSurfaces] = useState<DevSurface[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSurface, setSelectedSurface] = useState<DevSurface | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [launching, setLaunching] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('custom');
  const [newDesc, setNewDesc] = useState('');
  const [newColor, setNewColor] = useState('#10b981');
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');

  const handleLaunch = (surface: DevSurface) => {
    const targetPanel = SURFACE_LAUNCH_TARGET[surface.type] || 'editor';
    setLaunching(surface.id);
    // Small delay for visual feedback
    setTimeout(() => {
      setLaunching(null);
      if (onLaunchSurface) {
        onLaunchSurface(surface, targetPanel);
      }
    }, 600);
  };

  const fetchSurfaces = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dev-surfaces');
      if (res.ok) {
        const data = await res.json();
        setSurfaces(data.surfaces || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSurfaces(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const res = await fetch('/api/dev-surfaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, type: newType, description: newDesc, color: newColor }),
      });
      if (res.ok) {
        setNewName(''); setNewDesc(''); setCreateOpen(false);
        fetchSurfaces();
      }
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch('/api/dev-surfaces', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (selectedSurface?.id === id) setSelectedSurface(null);
      fetchSurfaces();
    } catch {
      // ignore
    }
  };

  const colors = (type: string) => SURFACE_COLORS[type] || SURFACE_COLORS.devops;

  // Filter surfaces by active category
  const filteredSurfaces = activeCategory === 'all'
    ? surfaces
    : surfaces.filter((s) => {
        const cat = SURFACE_CATEGORIES.find((c) => c.id === activeCategory);
        return cat && cat.types.includes(s.type as typeof cat.types[number]);
      });

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <Layout className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Dev Surfaces</h2>
              <p className="text-[10px] text-muted-foreground">Specialized workspaces for every domain</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[9px]">
              {filteredSurfaces.length} surfaces
            </Badge>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-7 gap-1 text-xs bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-3 w-3" /> Custom
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-900 border-zinc-800">
                <DialogHeader>
                  <DialogTitle>Create Custom Surface</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 pt-2">
                  <Input placeholder="Surface name" value={newName} onChange={(e) => setNewName(e.target.value)} className="bg-zinc-800 border-zinc-700" />
                  <Input placeholder="Type (e.g. robotics)" value={newType} onChange={(e) => setNewType(e.target.value)} className="bg-zinc-800 border-zinc-700" />
                  <Textarea placeholder="Description" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="bg-zinc-800 border-zinc-700 min-h-[80px]" />
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-zinc-400">Color:</label>
                    <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="h-8 w-8 rounded cursor-pointer" />
                  </div>
                  <Button onClick={handleCreate} className="w-full bg-emerald-600 hover:bg-emerald-700">Create Surface</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <Separator className="shrink-0" />

      {/* Category filter */}
      <div className="shrink-0 px-4 py-2 flex items-center gap-1.5 overflow-x-auto">
        <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        {SURFACE_CATEGORIES.map((cat) => (
          <Button
            key={cat.id}
            variant={activeCategory === cat.id ? 'default' : 'ghost'}
            size="sm"
            className={`h-6 px-2.5 text-[10px] shrink-0 ${
              activeCategory === cat.id
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => {
              setActiveCategory(cat.id);
              setSelectedSurface(null);
            }}
          >
            {cat.label}
            {cat.id !== 'all' && (
              <span className="ml-1 text-[8px] opacity-60">
                {surfaces.filter((s) => cat.types.includes(s.type as typeof cat.types[number])).length}
              </span>
            )}
          </Button>
        ))}
      </div>

      <Separator className="shrink-0" />

      {/* Main content */}
      <div className="flex-1 min-h-0 flex">
        {/* Surface grid */}
        <ScrollArea className={`${selectedSurface ? 'w-1/2' : 'w-full'} transition-all`}>
          <div className="p-4 grid grid-cols-2 gap-3">
            {filteredSurfaces.map((surface, idx) => {
              const c = colors(surface.type);
              const emoji = SURFACE_EMOJIS[surface.type] || '🔧';
              const isSelected = selectedSurface?.id === surface.id;

              return (
                <motion.div
                  key={surface.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <Card
                    className={`cursor-pointer transition-all hover:scale-[1.02] ${c.border} ${
                      isSelected ? 'ring-2 ring-emerald-500/50' : ''
                    }`}
                    onClick={() => setSelectedSurface(isSelected ? null : surface)}
                  >
                    <CardContent className="p-3">
                      <div className={`h-20 rounded-lg bg-gradient-to-br ${c.gradient} flex items-center justify-center mb-2 relative group`}>
                        <span className="text-3xl">{emoji}</span>
                        {/* Launch overlay on hover */}
                        <div className="absolute inset-0 rounded-lg bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                          <Button
                            size="sm"
                            className="h-7 gap-1 text-[10px] bg-emerald-600 hover:bg-emerald-700"
                            onClick={(e) => { e.stopPropagation(); handleLaunch(surface); }}
                            disabled={launching === surface.id}
                          >
                            {launching === surface.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Play className="h-3 w-3" />
                            )}
                            Launch
                          </Button>
                        </div>
                        {surface.status === 'active' && (
                          <div className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-400" />
                        )}
                      </div>
                      <h3 className="text-xs font-semibold truncate">{surface.name}</h3>
                      <p className="text-[9px] text-muted-foreground line-clamp-2 mt-0.5">
                        {surface.description || `${surface.type} development workspace`}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="secondary" className={`text-[8px] h-4 ${c.text}`}>
                          {surface.type}
                        </Badge>
                        <span className="text-[8px] text-muted-foreground">
                          {Array.isArray(surface.tools) ? surface.tools.length : 0} tools
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Detail pane */}
        <AnimatePresence>
          {selectedSurface && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '50%', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-l border-border/40 overflow-hidden"
            >
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  {(() => {
                    const s = selectedSurface;
                    const c = colors(s.type);
                    const emoji = SURFACE_EMOJIS[s.type] || '🔧';
                    const icon = SURFACE_ICONS[s.type] || <Settings2 className="h-6 w-6" />;

                    return (
                      <>
                        {/* Header */}
                        <div className={`rounded-xl bg-gradient-to-br ${c.gradient} p-6 text-center`}>
                          <span className="text-5xl block mb-2">{emoji}</span>
                          <h2 className="text-lg font-bold">{s.name}</h2>
                          <p className="text-xs text-muted-foreground mt-1">
                            {s.description || `${s.type} development workspace`}
                          </p>
                          <div className="flex items-center justify-center gap-2 mt-3">
                            <Badge className={`${c.bg} ${c.text} border-0`}>{s.type}</Badge>
                            <Badge variant="secondary" className="text-[9px]">
                              {Array.isArray(s.tools) ? s.tools.length : 0} tools
                            </Badge>
                            <Badge variant="secondary" className="text-[9px]">
                              v{s.sortOrder || 1}
                            </Badge>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2">
                          <Button
                            className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2"
                            onClick={() => handleLaunch(s)}
                            disabled={launching === s.id}
                          >
                            {launching === s.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4" />
                            )}
                            {launching === s.id ? 'Launching...' : `Launch ${s.name}`}
                          </Button>
                          <div className="grid grid-cols-3 gap-2">
                            <Button variant="outline" size="sm" className="text-xs gap-1">
                              <Plus className="h-3 w-3" /> New
                            </Button>
                            <Button variant="outline" size="sm" className="text-xs gap-1">
                              <Star className="h-3 w-3" /> Recent
                            </Button>
                            <Button variant="outline" size="sm" className="text-xs gap-1">
                              <ArrowRight className="h-3 w-3" /> Import
                            </Button>
                          </div>
                        </div>

                        {/* Tools */}
                        <div>
                          <h3 className="text-xs font-semibold text-zinc-300 mb-2">Available Tools</h3>
                          <div className="space-y-1.5">
                            {(Array.isArray(s.tools) ? s.tools : []).map((tool, i) => (
                              <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-zinc-800/50">
                                <div className={`h-6 w-6 rounded ${c.bg} flex items-center justify-center ${c.text}`}>
                                  <Pencil className="h-3 w-3" />
                                </div>
                                <span className="text-xs">{tool}</span>
                              </div>
                            ))}
                            {(!Array.isArray(s.tools) || s.tools.length === 0) && (
                              <p className="text-[10px] text-muted-foreground italic">No tools configured yet</p>
                            )}
                          </div>
                        </div>

                        {/* Layout config */}
                        <div>
                          <h3 className="text-xs font-semibold text-zinc-300 mb-2">Layout</h3>
                          <div className="grid grid-cols-3 gap-1.5">
                            {['Editor', 'Preview', 'Console', 'Chat', 'Files', 'Terminal'].map((panel) => (
                              <div key={panel} className="flex items-center gap-1.5 p-1.5 rounded bg-zinc-800/50 text-[9px]">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                {panel}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Metadata */}
                        <div className="text-[9px] text-muted-foreground space-y-1">
                          <p>Created: {new Date(s.createdAt).toLocaleDateString()}</p>
                          <p>Updated: {new Date(s.updatedAt).toLocaleDateString()}</p>
                        </div>

                        {/* Delete */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs gap-1"
                          onClick={() => handleDelete(s.id)}
                        >
                          <Trash2 className="h-3 w-3" /> Delete Surface
                        </Button>
                      </>
                    );
                  })()}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
