'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  User,
  Mail,
  Calendar,
  Shield,
  Crown,
  Settings,
  Activity,
  Monitor,
  Edit3,
  Check,
  X,
  Plus,
  Trash2,
  RefreshCw,
  LogIn,
  MessageSquare,
  BookOpen,
  Bot,
  Clock,
  Globe,
  ChevronRight,
  Star,
  Zap,
  Save,
  Loader2,
  AlertCircle,
  Key,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

// ── Types ──────────────────────────────────────────────────────────────────

interface AccountData {
  id: string;
  userId: string;
  displayName: string | null;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  role: string;
  plan: string;
  status: string;
  lastLoginAt: string | null;
  loginCount: number;
  preferences: string;
  createdAt: string;
  updatedAt: string;
}

interface ActivityItem {
  id: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

interface AccountStats {
  loginCount: number;
  lastLogin: string | null;
  chatsCreated: number;
  libraryItems: number;
  agentsRun: number;
}

interface PrefEntry {
  key: string;
  value: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const planConfig: Record<string, { label: string; color: string; icon: React.ReactNode; features: string[] }> = {
  free: {
    label: 'Free',
    color: 'border-zinc-600 text-zinc-300',
    icon: <Zap className="h-3.5 w-3.5" />,
    features: ['5 chats/day', 'Basic models', '1 project'],
  },
  pro: {
    label: 'Pro',
    color: 'border-emerald-600 text-emerald-400',
    icon: <Star className="h-3.5 w-3.5" />,
    features: ['Unlimited chats', 'All models', '10 projects', 'Priority support'],
  },
  enterprise: {
    label: 'Enterprise',
    color: 'border-amber-500 text-amber-400',
    icon: <Crown className="h-3.5 w-3.5" />,
    features: ['Unlimited everything', 'Custom models', 'SSO/SAML', 'Dedicated support'],
  },
};

const roleColors: Record<string, string> = {
  admin: 'border-red-500/50 text-red-400 bg-red-500/10',
  developer: 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10',
  user: 'border-zinc-600 text-zinc-300 bg-zinc-500/10',
};

const activityIcons: Record<string, React.ReactNode> = {
  login: <LogIn className="h-3.5 w-3.5" />,
  chat: <MessageSquare className="h-3.5 w-3.5" />,
  library: <BookOpen className="h-3.5 w-3.5" />,
  agent: <Bot className="h-3.5 w-3.5" />,
  settings: <Settings className="h-3.5 w-3.5" />,
  default: <Activity className="h-3.5 w-3.5" />,
};

function getInitials(name: string | null): string {
  if (!name) return '??';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

// ── Component ──────────────────────────────────────────────────────────────

export function AccountPanel() {
  // ── State ──────────────────────────────────────────────────────────────
  const [account, setAccount] = useState<AccountData | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState<AccountStats>({
    loginCount: 0,
    lastLogin: null,
    chatsCreated: 0,
    libraryItems: 0,
    agentsRun: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editing state
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  // Preferences state
  const [preferences, setPreferences] = useState<PrefEntry[]>([]);
  const [newPrefKey, setNewPrefKey] = useState('');
  const [newPrefValue, setNewPrefValue] = useState('');
  const [prefSaving, setPrefSaving] = useState(false);

  // Plan upgrade dialog
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  // Session info
  const [sessionInfo, setSessionInfo] = useState({
    userAgent: '',
    language: '',
    platform: '',
    screenSize: '',
    timezone: '',
    cookiesEnabled: false,
    online: true,
    currentUrl: '',
    sessionStarted: '',
  });

  // ── Data fetching ──────────────────────────────────────────────────────

  const fetchAccount = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/account');
      if (!res.ok) throw new Error('Failed to fetch account');
      const data = await res.json();
      setAccount(data.account);

      // Parse preferences
      try {
        const prefs = JSON.parse(data.account.preferences || '{}');
        const prefEntries: PrefEntry[] = Object.entries(prefs).map(
          ([key, value]) => ({ key, value: String(value) })
        );
        setPreferences(prefEntries);
      } catch {
        setPreferences([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchActivities = useCallback(async () => {
    try {
      setActivityLoading(true);
      const res = await fetch('/api/activity?limit=20');
      if (!res.ok) throw new Error('Failed to fetch activities');
      const data = await res.json();
      setActivities(data.activities || []);
    } catch {
      // Silently handle activity fetch errors
    } finally {
      setActivityLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      // Fetch stats from multiple endpoints
      const [chatsRes, libraryRes, agentsRes] = await Promise.allSettled([
        fetch('/api/history'),
        fetch('/api/library'),
        fetch('/api/agents'),
      ]);

      let chatsCreated = 0;
      let libraryItems = 0;
      let agentsRun = 0;

      if (chatsRes.status === 'fulfilled' && chatsRes.value.ok) {
        const chatsData = await chatsRes.value.json();
        chatsCreated = Array.isArray(chatsData.chats) ? chatsData.chats.length : 0;
      }
      if (libraryRes.status === 'fulfilled' && libraryRes.value.ok) {
        const libData = await libraryRes.value.json();
        libraryItems = Array.isArray(libData.items) ? libData.items.length : 0;
      }
      if (agentsRes.status === 'fulfilled' && agentsRes.value.ok) {
        const agentsData = await agentsRes.value.json();
        agentsRun = Array.isArray(agentsData.agents) ? agentsData.agents.length : 0;
      }

      setStats((prev) => ({
        ...prev,
        chatsCreated,
        libraryItems,
        agentsRun,
      }));
    } catch {
      // Silently handle stats errors
    }
  }, []);

  // ── Effects ────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchAccount();
    fetchActivities();
  }, [fetchAccount, fetchActivities]);

  useEffect(() => {
    if (account) {
      setStats((prev) => ({
        ...prev,
        loginCount: account.loginCount,
        lastLogin: account.lastLoginAt,
      }));
      fetchStats();
    }
  }, [account, fetchStats]);

  useEffect(() => {
    // Capture session info on mount
    if (typeof window !== 'undefined') {
      setSessionInfo({
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenSize: `${window.screen.width} × ${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        cookiesEnabled: navigator.cookieEnabled,
        online: navigator.onLine,
        currentUrl: window.location.href,
        sessionStarted: new Date().toISOString(),
      });
    }
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────

  const startEditing = (field: string, value: string) => {
    setEditingField(field);
    setEditValue(value || '');
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValue('');
  };

  const saveField = async (field: string) => {
    if (!account) return;
    try {
      setSaving(true);
      const res = await fetch('/api/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: account.userId,
          [field]: field === 'email' ? editValue : editValue,
        }),
      });
      if (!res.ok) throw new Error('Failed to update');
      const data = await res.json();
      setAccount(data.account);
      setEditingField(null);
      setEditValue('');
    } catch {
      // Keep editing on error
    } finally {
      setSaving(false);
    }
  };

  const savePreferences = async () => {
    if (!account) return;
    try {
      setPrefSaving(true);
      const prefsObj: Record<string, string> = {};
      preferences.forEach((p) => {
        prefsObj[p.key] = p.value;
      });
      const res = await fetch('/api/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: account.userId,
          preferences: prefsObj,
        }),
      });
      if (!res.ok) throw new Error('Failed to save preferences');
      const data = await res.json();
      setAccount(data.account);
    } catch {
      // Handle error silently
    } finally {
      setPrefSaving(false);
    }
  };

  const addPreference = () => {
    if (!newPrefKey.trim()) return;
    setPreferences((prev) => [
      ...prev,
      { key: newPrefKey.trim(), value: newPrefValue },
    ]);
    setNewPrefKey('');
    setNewPrefValue('');
  };

  const removePreference = (key: string) => {
    setPreferences((prev) => prev.filter((p) => p.key !== key));
  };

  const updatePreference = (key: string, value: string) => {
    setPreferences((prev) =>
      prev.map((p) => (p.key === key ? { ...p, value } : p))
    );
  };

  const handleUpgradePlan = async (plan: string) => {
    if (!account) return;
    try {
      const res = await fetch('/api/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: account.userId, plan }),
      });
      if (!res.ok) throw new Error('Failed to update plan');
      const data = await res.json();
      setAccount(data.account);
      setUpgradeOpen(false);
    } catch {
      // Handle error silently
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────

  const getInitials = (name: string | null) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const activityIcon = (action: string) => {
    const map: Record<string, React.ReactNode> = {
      login: <LogIn className="h-3.5 w-3.5" />,
      chat: <MessageSquare className="h-3.5 w-3.5" />,
      library: <BookOpen className="h-3.5 w-3.5" />,
      agent: <Bot className="h-3.5 w-3.5" />,
      settings: <Settings className="h-3.5 w-3.5" />,
    };
    return map[action] || <Activity className="h-3.5 w-3.5" />;
  };

  const activityColor = (action: string) => {
    const map: Record<string, string> = {
      login: 'text-emerald-400',
      chat: 'text-blue-400',
      library: 'text-amber-400',
      agent: 'text-violet-400',
      settings: 'text-zinc-400',
    };
    return map[action] || 'text-zinc-400';
  };

  const activityBg = (action: string) => {
    const map: Record<string, string> = {
      login: 'bg-emerald-500/10',
      chat: 'bg-blue-500/10',
      library: 'bg-amber-500/10',
      agent: 'bg-violet-500/10',
      settings: 'bg-zinc-500/10',
    };
    return map[action] || 'bg-zinc-500/10';
  };

  // ── Loading skeleton ───────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-full flex-col bg-zinc-950 text-zinc-100">
        <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
          <User className="h-5 w-5 text-zinc-400" />
          <h2 className="text-lg font-semibold">Account</h2>
        </div>
        <div className="space-y-4 p-4">
          <Card className="border-zinc-800 bg-zinc-900/60">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-20 w-20 rounded-full bg-zinc-800" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-40 bg-zinc-800" />
                  <Skeleton className="h-4 w-56 bg-zinc-800" />
                  <Skeleton className="h-4 w-32 bg-zinc-800" />
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg bg-zinc-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────

  if (error && !account) {
    return (
      <div className="flex h-full flex-col bg-zinc-950 text-zinc-100">
        <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
          <User className="h-5 w-5 text-zinc-400" />
          <h2 className="text-lg font-semibold">Account</h2>
        </div>
        <div className="flex flex-1 items-center justify-center p-4">
          <Card className="border-red-900/50 bg-zinc-900/60 w-full max-w-md">
            <CardContent className="flex flex-col items-center gap-4 p-6">
              <AlertCircle className="h-10 w-10 text-red-400" />
              <p className="text-sm text-zinc-300">{error}</p>
              <Button
                onClick={fetchAccount}
                className="bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!account) return null;

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-zinc-400" />
          <h2 className="text-lg font-semibold">Account</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            fetchAccount();
            fetchActivities();
            fetchStats();
          }}
          className="text-zinc-400 hover:text-zinc-200"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="flex flex-1 flex-col overflow-hidden">
        <TabsList className="mx-4 mt-2 grid w-auto grid-cols-4 bg-zinc-900">
          <TabsTrigger
            value="profile"
            className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100"
          >
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="plan"
            className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100"
          >
            Plan
          </TabsTrigger>
          <TabsTrigger
            value="preferences"
            className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100"
          >
            Preferences
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100"
          >
            Activity
          </TabsTrigger>
        </TabsList>

        {/* ── Profile Tab ──────────────────────────────────────────────── */}
        <TabsContent value="profile" className="mt-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-4 p-4">
              {/* Profile Card */}
              <Card className="border-zinc-800 bg-zinc-900/60">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                    {/* Avatar */}
                    <div className="relative">
                      {account.avatarUrl ? (
                        <Avatar className="h-20 w-20 border-2 border-zinc-700">
                          <AvatarImage
                            src={account.avatarUrl}
                            alt={account.displayName || 'Avatar'}
                          />
                          <AvatarFallback className="bg-zinc-800 text-lg text-zinc-300">
                            {getInitials(account.displayName)}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-zinc-700 bg-zinc-800 text-xl font-semibold text-emerald-400">
                          {getInitials(account.displayName)}
                        </div>
                      )}
                      {account.status === 'active' && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full border-2 border-zinc-900 bg-emerald-500" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center sm:text-left">
                      <div className="flex flex-col items-center gap-2 sm:flex-row">
                        {/* Display Name */}
                        {editingField === 'displayName' ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="h-8 w-48 border-zinc-700 bg-zinc-800 text-sm text-zinc-100"
                              placeholder="Display name"
                              autoFocus
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-emerald-400 hover:text-emerald-300"
                              onClick={() => saveField('displayName')}
                              disabled={saving}
                            >
                              {saving ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-zinc-500 hover:text-zinc-300"
                              onClick={cancelEditing}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <h3
                            className="text-xl font-semibold cursor-pointer group flex items-center gap-2"
                            onClick={() =>
                              startEditing(
                                'displayName',
                                account.displayName || ''
                              )
                            }
                          >
                            {account.displayName || 'Unnamed'}
                            <Edit3 className="h-3.5 w-3.5 text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100" />
                          </h3>
                        )}
                      </div>

                      {/* Badges */}
                      <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            account.role === 'admin'
                              ? 'border-red-500/50 text-red-400'
                              : account.role === 'developer'
                                ? 'border-emerald-600 text-emerald-400'
                                : 'border-zinc-600 text-zinc-400'
                          }`}
                        >
                          <Shield className="mr-1 h-3 w-3" />
                          {account.role.charAt(0).toUpperCase() +
                            account.role.slice(1)}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            planConfig[account.plan]?.color ||
                            'border-zinc-600 text-zinc-400'
                          }`}
                        >
                          {planConfig[account.plan]?.icon}
                          <span className="ml-1">
                            {planConfig[account.plan]?.label || account.plan}
                          </span>
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            account.status === 'active'
                              ? 'border-emerald-600 text-emerald-400'
                              : 'border-zinc-600 text-zinc-500'
                          }`}
                        >
                          <div
                            className={`mr-1 h-1.5 w-1.5 rounded-full ${
                              account.status === 'active'
                                ? 'bg-emerald-400'
                                : 'bg-zinc-500'
                            }`}
                          />
                          {account.status.charAt(0).toUpperCase() +
                            account.status.slice(1)}
                        </Badge>
                      </div>

                      {/* Email */}
                      <div className="mt-3 flex items-center justify-center gap-2 sm:justify-start">
                        <Mail className="h-3.5 w-3.5 text-zinc-500" />
                        {editingField === 'email' ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="email"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="h-7 w-52 border-zinc-700 bg-zinc-800 text-xs text-zinc-100"
                              placeholder="Email address"
                              autoFocus
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-emerald-400 hover:text-emerald-300"
                              onClick={() => saveField('email')}
                              disabled={saving}
                            >
                              {saving ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-zinc-500 hover:text-zinc-300"
                              onClick={cancelEditing}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span
                            className="cursor-pointer text-sm text-zinc-400 hover:text-zinc-300"
                            onClick={() =>
                              startEditing('email', account.email)
                            }
                          >
                            {account.email}
                          </span>
                        )}
                      </div>

                      {/* Bio */}
                      <div className="mt-2 flex items-start justify-center gap-2 sm:justify-start">
                        {editingField === 'bio' ? (
                          <div className="flex-1 space-y-2">
                            <Textarea
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="min-h-[60px] border-zinc-700 bg-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-600"
                              placeholder="Tell us about yourself..."
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="h-7 bg-emerald-600 text-white hover:bg-emerald-700"
                                onClick={() => saveField('bio')}
                                disabled={saving}
                              >
                                {saving ? (
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                ) : (
                                  <Check className="mr-1 h-3 w-3" />
                                )}
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-zinc-400 hover:text-zinc-200"
                                onClick={cancelEditing}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <span
                            className="cursor-pointer text-sm text-zinc-500 hover:text-zinc-400"
                            onClick={() => startEditing('bio', account.bio || '')}
                          >
                            {account.bio || 'No bio — click to add'}
                          </span>
                        )}
                      </div>

                      {/* Avatar URL */}
                      <div className="mt-2 flex items-center justify-center gap-2 sm:justify-start">
                        {editingField === 'avatarUrl' ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="h-7 w-52 border-zinc-700 bg-zinc-800 text-xs text-zinc-100"
                              placeholder="Avatar URL"
                              autoFocus
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-emerald-400 hover:text-emerald-300"
                              onClick={() => saveField('avatarUrl')}
                              disabled={saving}
                            >
                              {saving ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-zinc-500 hover:text-zinc-300"
                              onClick={cancelEditing}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span
                            className="cursor-pointer text-xs text-zinc-600 hover:text-zinc-400"
                            onClick={() =>
                              startEditing('avatarUrl', account.avatarUrl || '')
                            }
                          >
                            {account.avatarUrl
                              ? 'Change avatar'
                              : 'Set avatar URL'}
                          </span>
                        )}
                      </div>

                      {/* Member since */}
                      <div className="mt-3 flex items-center justify-center gap-2 sm:justify-start">
                        <Calendar className="h-3.5 w-3.5 text-zinc-600" />
                        <span className="text-xs text-zinc-500">
                          Member since {formatDate(account.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Separator className="bg-zinc-800" />

              {/* Account Stats */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-300">
                  <Activity className="h-4 w-4 text-amber-400" /> Account Stats
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {[
                    {
                      label: 'Logins',
                      value: stats.loginCount,
                      icon: <LogIn className="h-4 w-4" />,
                      color: 'text-emerald-400',
                      bg: 'bg-emerald-500/10',
                    },
                    {
                      label: 'Last Login',
                      value: timeAgo(stats.lastLogin || ''),
                      icon: <Clock className="h-4 w-4" />,
                      color: 'text-blue-400',
                      bg: 'bg-blue-500/10',
                    },
                    {
                      label: 'Chats',
                      value: stats.chatsCreated,
                      icon: <MessageSquare className="h-4 w-4" />,
                      color: 'text-violet-400',
                      bg: 'bg-violet-500/10',
                    },
                    {
                      label: 'Library Items',
                      value: stats.libraryItems,
                      icon: <BookOpen className="h-4 w-4" />,
                      color: 'text-amber-400',
                      bg: 'bg-amber-500/10',
                    },
                    {
                      label: 'Agents Run',
                      value: stats.agentsRun,
                      icon: <Bot className="h-4 w-4" />,
                      color: 'text-rose-400',
                      bg: 'bg-rose-500/10',
                    },
                  ].map((stat) => (
                    <Card
                      key={stat.label}
                      className="border-zinc-800 bg-zinc-900/60"
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-md ${stat.bg} ${stat.color}`}
                          >
                            {stat.icon}
                          </div>
                          <div>
                            <p className="text-lg font-semibold">
                              {stat.value}
                            </p>
                            <p className="text-[10px] text-zinc-500">
                              {stat.label}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Separator className="bg-zinc-800" />

              {/* Session Info */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-300">
                  <Monitor className="h-4 w-4 text-emerald-400" /> Session Info
                </h3>
                <Card className="border-zinc-800 bg-zinc-900/60">
                  <CardContent className="divide-y divide-zinc-800 p-0">
                    {[
                      {
                        label: 'Platform',
                        value: sessionInfo.platform,
                        icon: <Monitor className="h-3.5 w-3.5" />,
                      },
                      {
                        label: 'Screen',
                        value: sessionInfo.screenSize,
                        icon: <Globe className="h-3.5 w-3.5" />,
                      },
                      {
                        label: 'Timezone',
                        value: sessionInfo.timezone,
                        icon: <Clock className="h-3.5 w-3.5" />,
                      },
                      {
                        label: 'Language',
                        value: sessionInfo.language,
                        icon: <Globe className="h-3.5 w-3.5" />,
                      },
                      {
                        label: 'Cookies',
                        value: sessionInfo.cookiesEnabled ? 'Enabled' : 'Disabled',
                        icon: <Key className="h-3.5 w-3.5" />,
                      },
                      {
                        label: 'Connection',
                        value: sessionInfo.online ? 'Online' : 'Offline',
                        icon: <Activity className="h-3.5 w-3.5" />,
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between px-4 py-2.5"
                      >
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                          {item.icon}
                          {item.label}
                        </div>
                        <span className="text-sm text-zinc-300">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* User Agent (truncated) */}
                <div className="mt-2">
                  <Label className="text-xs text-zinc-500">User Agent</Label>
                  <p className="mt-0.5 break-all text-[10px] leading-relaxed text-zinc-600">
                    {sessionInfo.userAgent}
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ── Plan Tab ──────────────────────────────────────────────────── */}
        <TabsContent value="plan" className="mt-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-4 p-4">
              {/* Current Plan */}
              <Card className="border-zinc-800 bg-zinc-900/60">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <Crown className="h-4 w-4 text-amber-400" />
                    Current Plan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-xl border ${
                        account.plan === 'enterprise'
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                          : account.plan === 'pro'
                            ? 'border-emerald-600/30 bg-emerald-500/10 text-emerald-400'
                            : 'border-zinc-700 bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {planConfig[account.plan]?.icon || <Zap className="h-6 w-6" />}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">
                        {planConfig[account.plan]?.label || account.plan}
                      </h3>
                      <p className="text-xs text-zinc-500">
                        Active since {formatDate(account.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Plan features */}
                  <div className="mt-4 space-y-1.5">
                    {(planConfig[account.plan]?.features || []).map(
                      (feature) => (
                        <div
                          key={feature}
                          className="flex items-center gap-2 text-xs text-zinc-400"
                        >
                          <Check className="h-3 w-3 text-emerald-400" />
                          {feature}
                        </div>
                      )
                    )}
                  </div>

                  {account.plan !== 'enterprise' && (
                    <Button
                      className="mt-4 w-full bg-emerald-600 text-white hover:bg-emerald-700"
                      onClick={() => setUpgradeOpen(true)}
                    >
                      <Crown className="mr-2 h-4 w-4" /> Upgrade Plan
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Separator className="bg-zinc-800" />

              {/* Plan Comparison */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-300">
                  <Star className="h-4 w-4 text-amber-400" /> Plan Comparison
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {Object.entries(planConfig).map(([key, plan]) => (
                    <Card
                      key={key}
                      className={`border bg-zinc-900/60 transition-colors ${
                        account.plan === key
                          ? 'border-emerald-600/50 ring-1 ring-emerald-600/20'
                          : 'border-zinc-800 hover:bg-zinc-900'
                      }`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-sm font-medium">
                            {plan.icon}
                            {plan.label}
                          </CardTitle>
                          {account.plan === key && (
                            <Badge className="bg-emerald-600 text-[10px] text-white">
                              Current
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 pt-0">
                        {plan.features.map((f) => (
                          <div
                            key={f}
                            className="flex items-center gap-1.5 text-xs text-zinc-400"
                          >
                            <ChevronRight className="h-3 w-3 text-zinc-600" />
                            {f}
                          </div>
                        ))}
                        {account.plan !== key && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 w-full border-zinc-700 text-xs text-zinc-300 hover:bg-zinc-800"
                            onClick={() => handleUpgradePlan(key)}
                          >
                            Switch to {plan.label}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Usage overview */}
              <Separator className="bg-zinc-800" />
              <div>
                <h3 className="mb-3 text-sm font-medium text-zinc-300">
                  Usage Overview
                </h3>
                <Card className="border-zinc-800 bg-zinc-900/60">
                  <CardContent className="space-y-4 p-4">
                    {[
                      {
                        label: 'Chats',
                        current: stats.chatsCreated,
                        max: account.plan === 'free' ? 5 : account.plan === 'pro' ? 100 : Infinity,
                        color: 'bg-emerald-500',
                      },
                      {
                        label: 'Library Items',
                        current: stats.libraryItems,
                        max: account.plan === 'free' ? 3 : account.plan === 'pro' ? 50 : Infinity,
                        color: 'bg-amber-500',
                      },
                      {
                        label: 'Agent Runs',
                        current: stats.agentsRun,
                        max: account.plan === 'free' ? 10 : account.plan === 'pro' ? 200 : Infinity,
                        color: 'bg-violet-500',
                      },
                    ].map((usage) => {
                      const pct =
                        usage.max === Infinity
                          ? 25
                          : Math.min(
                              (usage.current / usage.max) * 100,
                              100
                            );
                      return (
                        <div key={usage.label}>
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="text-zinc-400">
                              {usage.label}
                            </span>
                            <span className="text-zinc-500">
                              {usage.current}
                              {usage.max !== Infinity && ` / ${usage.max}`}
                              {usage.max === Infinity && ' / ∞'}
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                            <div
                              className={`h-full rounded-full transition-all ${usage.color}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ── Preferences Tab ───────────────────────────────────────────── */}
        <TabsContent
          value="preferences"
          className="mt-0 flex-1 overflow-hidden"
        >
          <ScrollArea className="h-full">
            <div className="space-y-4 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                    <Settings className="h-4 w-4 text-emerald-400" /> JSON
                    Preferences
                  </h3>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Manage key-value preference pairs stored in your account
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={savePreferences}
                  disabled={prefSaving}
                >
                  {prefSaving ? (
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="mr-1 h-3.5 w-3.5" />
                  )}
                  Save All
                </Button>
              </div>

              {/* Existing preferences */}
              {preferences.length > 0 ? (
                <Card className="border-zinc-800 bg-zinc-900/60">
                  <CardContent className="divide-y divide-zinc-800 p-0">
                    {preferences.map((pref, idx) => (
                      <div
                        key={pref.key}
                        className="flex items-center gap-3 px-4 py-2.5"
                      >
                        <span className="w-6 text-center text-[10px] text-zinc-600">
                          {idx + 1}
                        </span>
                        <div className="flex flex-1 items-center gap-2">
                          <Input
                            value={pref.key}
                            readOnly
                            className="h-7 w-36 border-zinc-700 bg-zinc-800 text-xs text-zinc-400"
                          />
                          <Input
                            value={pref.value}
                            onChange={(e) =>
                              updatePreference(pref.key, e.target.value)
                            }
                            className="h-7 flex-1 border-zinc-700 bg-zinc-800 text-xs text-zinc-100"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-zinc-500 hover:text-red-400"
                          onClick={() => removePreference(pref.key)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-zinc-800 bg-zinc-900/60">
                  <CardContent className="flex flex-col items-center gap-2 p-8">
                    <Settings className="h-8 w-8 text-zinc-700" />
                    <p className="text-sm text-zinc-500">No preferences set</p>
                    <p className="text-xs text-zinc-600">
                      Add key-value pairs below
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Add new preference */}
              <Card className="border-zinc-800 bg-zinc-900/60">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-xs font-medium text-zinc-400">
                    <Plus className="h-3.5 w-3.5" /> Add Preference
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Input
                      value={newPrefKey}
                      onChange={(e) => setNewPrefKey(e.target.value)}
                      placeholder="Key"
                      className="h-8 w-32 border-zinc-700 bg-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-600"
                    />
                    <Input
                      value={newPrefValue}
                      onChange={(e) => setNewPrefValue(e.target.value)}
                      placeholder="Value"
                      className="h-8 flex-1 border-zinc-700 bg-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-600"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') addPreference();
                      }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 border-zinc-700 text-xs text-zinc-300 hover:bg-zinc-800"
                      onClick={addPreference}
                      disabled={!newPrefKey.trim()}
                    >
                      <Plus className="mr-1 h-3 w-3" /> Add
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Raw JSON preview */}
              <Card className="border-zinc-800 bg-zinc-900/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-zinc-500">
                    Raw JSON Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="max-h-32 overflow-auto rounded-md bg-zinc-900 p-3 text-[10px] leading-relaxed text-zinc-500">
                    {JSON.stringify(
                      Object.fromEntries(
                        preferences.map((p) => [p.key, p.value])
                      ),
                      null,
                      2
                    )}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ── Activity Tab ──────────────────────────────────────────────── */}
        <TabsContent value="activity" className="mt-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-4 p-4">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                  <Activity className="h-4 w-4 text-amber-400" /> Recent
                  Activity
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchActivities}
                  className="text-zinc-400 hover:text-zinc-200"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>

              {activityLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full bg-zinc-800" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-3/4 bg-zinc-800" />
                        <Skeleton className="h-3 w-1/4 bg-zinc-800" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activities.length > 0 ? (
                <Card className="border-zinc-800 bg-zinc-900/60">
                  <CardContent className="divide-y divide-zinc-800 p-0">
                    {activities.map((act) => (
                      <div
                        key={act.id}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${activityBg(act.action)} ${activityColor(act.action)}`}
                        >
                          {activityIcon(act.action)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-zinc-300">
                            <span className="font-medium">{act.action}</span>
                            {act.entity && (
                              <span className="text-zinc-500">
                                {' '}
                                · {act.entity}
                              </span>
                            )}
                          </p>
                          {act.description && (
                            <p className="truncate text-xs text-zinc-500">
                              {act.description}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="text-[10px] text-zinc-600">
                            {timeAgo(act.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-zinc-800 bg-zinc-900/60">
                  <CardContent className="flex flex-col items-center gap-2 p-8">
                    <Activity className="h-8 w-8 text-zinc-700" />
                    <p className="text-sm text-zinc-500">No activity yet</p>
                    <p className="text-xs text-zinc-600">
                      Activity will appear here as you use the platform
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Upgrade Dialog */}
      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-950 text-zinc-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-400" />
              Upgrade Your Plan
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Choose a plan that fits your needs
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {Object.entries(planConfig)
              .filter(([key]) => key !== account.plan)
              .map(([key, plan]) => (
                <Card
                  key={key}
                  className="cursor-pointer border-zinc-800 bg-zinc-900/60 transition-colors hover:bg-zinc-900 hover:border-zinc-700"
                  onClick={() => handleUpgradePlan(key)}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          key === 'enterprise'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-emerald-500/10 text-emerald-400'
                        }`}
                      >
                        {plan.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{plan.label}</p>
                        <p className="text-xs text-zinc-500">
                          {plan.features.slice(0, 2).join(' · ')}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-zinc-600" />
                  </CardContent>
                </Card>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
