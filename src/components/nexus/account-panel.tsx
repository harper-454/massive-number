'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  User,
  Mail,
  Calendar,
  Shield,
  Crown,
  CreditCard,
  Key,
  Server,
  BarChart3,
  Heart,
  Settings,
  Edit3,
  Check,
  X,
  Plus,
  Trash2,
  RefreshCw,
  Loader2,
  AlertCircle,
  Zap,
  ChevronRight,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  Wifi,
  WifiOff,
  Search,
  DollarSign,
  Star,
  Clock,
  Globe,
  Activity,
  Bot,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  EyeOff,
  TestTube,
  Monitor,
  Cpu,
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
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'framer-motion';

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

interface SubscriptionData {
  subscription: {
    id: string;
    userId: string;
    plan: string;
    status: string;
    stripeCustomerId: string | null;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    createdAt: string;
  };
  planInfo: PlanInfo;
  plans: Record<string, PlanInfo>;
}

interface PlanInfo {
  name: string;
  price: number;
  tokenLimit: number;
  models: number;
  surfaces: number;
  features: string[];
}

interface UsageData {
  period: string;
  totals: { inputTokens: number; outputTokens: number; totalTokens: number; cost: number };
  byProvider: Record<string, { totalTokens: number; cost: number; count: number }>;
  byModel: Record<string, { totalTokens: number; cost: number; provider: string }>;
  monthlyUsage: { period: string; totalTokens: number; cost: number }[];
  tokenLimit: number;
  usagePercent: number;
  plan: string;
}

interface ApiKeyData {
  id: string;
  userId: string;
  provider: string;
  label: string | null;
  key: string;
  baseUrl: string | null;
  models: string[];
  enabled: boolean;
  isLocal: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

interface ModelHealthItem {
  id: string;
  name: string;
  provider: string;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  availability: number;
  errorRate: number;
  lastChecked: string;
  tier: 'free' | 'pro' | 'enterprise';
}

// ── Constants ──────────────────────────────────────────────────────────────

const PROVIDER_OPTIONS = [
  { value: 'openai', label: 'OpenAI', icon: '🤖', color: 'text-emerald-400' },
  { value: 'anthropic', label: 'Anthropic', icon: '🧠', color: 'text-orange-400' },
  { value: 'google', label: 'Google AI', icon: '💎', color: 'text-teal-400' },
  { value: 'deepseek', label: 'DeepSeek', icon: '🔍', color: 'text-amber-400' },
  { value: 'custom', label: 'Custom', icon: '⚙️', color: 'text-white/60' },
];

const LOCAL_PROVIDERS = [
  { value: 'lmstudio', label: 'LM Studio', icon: '🖥️', defaultUrl: 'http://localhost:1234/v1' },
  { value: 'ollama', label: 'Ollama', icon: '🦙', defaultUrl: 'http://localhost:11434' },
  { value: 'custom', label: 'Custom Endpoint', icon: '🔗', defaultUrl: '' },
];

const DONATION_AMOUNTS = [5, 10, 25, 50];

// ── Main Component ────────────────────────────────────────────────────────

export function AccountPanel() {
  const [activeTab, setActiveTab] = useState('profile');
  const [account, setAccount] = useState<AccountData | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKeyData[]>([]);
  const [modelHealth, setModelHealth] = useState<ModelHealthItem[]>([]);
  const [healthSummary, setHealthSummary] = useState<{ healthy: number; degraded: number; down: number; total: number; avgLatency: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit states
  const [editingProfile, setEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  // API key dialog
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);
  const [newKeyProvider, setNewKeyProvider] = useState('openai');
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [newKeyBaseUrl, setNewKeyBaseUrl] = useState('');
  const [addingKey, setAddingKey] = useState(false);
  const [showKeyValue, setShowKeyValue] = useState(false);

  // Local provider dialog
  const [localDialogOpen, setLocalDialogOpen] = useState(false);
  const [localProvider, setLocalProvider] = useState('lmstudio');
  const [localUrl, setLocalUrl] = useState('http://localhost:1234/v1');
  const [localKeyValue, setLocalKeyValue] = useState('');
  const [localLabel, setLocalLabel] = useState('');
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  // Donation
  const [donationAmount, setDonationAmount] = useState(10);
  const [customAmount, setCustomAmount] = useState('');
  const [donationMessage, setDonationMessage] = useState('');
  const [donating, setDonating] = useState(false);
  const [donationSuccess, setDonationSuccess] = useState(false);

  // Plan change
  const [changingPlan, setChangingPlan] = useState<string | null>(null);

  const userId = 'default';

  // ── Data fetching ─────────────────────────────────────────────────────

  const fetchAccount = useCallback(async () => {
    try {
      const res = await fetch(`/api/account?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setAccount(data.account);
        setDisplayName(data.account.displayName || '');
        setBio(data.account.bio || '');
      }
    } catch (err) {
      console.error('Failed to fetch account:', err);
    }
  }, []);

  const fetchSubscription = useCallback(async () => {
    try {
      const res = await fetch(`/api/subscription?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setSubscription(data);
      }
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
    }
  }, []);

  const fetchUsage = useCallback(async () => {
    try {
      const res = await fetch(`/api/subscription/usage?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      }
    } catch (err) {
      console.error('Failed to fetch usage:', err);
    }
  }, []);

  const fetchApiKeys = useCallback(async () => {
    try {
      const res = await fetch(`/api/api-keys?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data.keys);
      }
    } catch (err) {
      console.error('Failed to fetch API keys:', err);
    }
  }, []);

  const fetchModelHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/model-health');
      if (res.ok) {
        const data = await res.json();
        setModelHealth(data.models);
        setHealthSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to fetch model health:', err);
    }
  }, []);

  const initialLoadRef = useRef(false);
  const loadedTabsRef = useRef<Set<string>>(new Set());

  // Handle tab changes — load data on demand
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    if (loadedTabsRef.current.has(tab)) return;
    loadedTabsRef.current.add(tab);
    if (tab === 'billing') fetchUsage();
    if (tab === 'api-keys') fetchApiKeys();
    if (tab === 'local-providers') { fetchApiKeys(); fetchModelHealth(); }
    if (tab === 'token-usage') fetchUsage();
    if (tab === 'donate') fetchUsage();
  }, [fetchApiKeys, fetchModelHealth, fetchUsage]);

  // Initial load — run once on mount
  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await fetchAccount();
        await fetchSubscription();
      } catch {
        if (!cancelled) setError('Failed to load account data. Please try again.');
      }
      if (!cancelled) {
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, displayName, bio }),
      });
      if (res.ok) {
        const data = await res.json();
        setAccount(data.account);
        setEditingProfile(false);
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
    }
    setSaving(false);
  };

  const changePlan = async (plan: string) => {
    setChangingPlan(plan);
    try {
      const res = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, plan }),
      });
      if (res.ok) {
        await fetchSubscription();
      }
    } catch (err) {
      console.error('Failed to change plan:', err);
    }
    setChangingPlan(null);
  };

  const cancelSubscription = async () => {
    try {
      const res = await fetch('/api/subscription', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'cancel' }),
      });
      if (res.ok) {
        await fetchSubscription();
      }
    } catch (err) {
      console.error('Failed to cancel subscription:', err);
    }
  };

  const reactivateSubscription = async () => {
    try {
      const res = await fetch('/api/subscription', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'reactivate' }),
      });
      if (res.ok) {
        await fetchSubscription();
      }
    } catch (err) {
      console.error('Failed to reactivate subscription:', err);
    }
  };

  const addApiKey = async () => {
    setAddingKey(true);
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          provider: newKeyProvider,
          label: newKeyLabel || null,
          key: newKeyValue,
          baseUrl: newKeyBaseUrl || null,
          isLocal: false,
        }),
      });
      if (res.ok) {
        await fetchApiKeys();
        setKeyDialogOpen(false);
        setNewKeyValue('');
        setNewKeyLabel('');
        setNewKeyBaseUrl('');
      }
    } catch (err) {
      console.error('Failed to add API key:', err);
    }
    setAddingKey(false);
  };

  const addLocalProvider = async () => {
    setAddingKey(true);
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          provider: localProvider,
          label: localLabel || LOCAL_PROVIDERS.find(p => p.value === localProvider)?.label,
          key: localKeyValue || 'local',
          baseUrl: localUrl,
          isLocal: true,
        }),
      });
      if (res.ok) {
        await fetchApiKeys();
        setLocalDialogOpen(false);
        setLocalKeyValue('');
        setLocalLabel('');
      }
    } catch (err) {
      console.error('Failed to add local provider:', err);
    }
    setAddingKey(false);
  };

  const toggleApiKey = async (id: string, enabled: boolean) => {
    try {
      const res = await fetch('/api/api-keys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, enabled: !enabled }),
      });
      if (res.ok) {
        await fetchApiKeys();
      }
    } catch (err) {
      console.error('Failed to toggle API key:', err);
    }
  };

  const deleteApiKey = async (id: string) => {
    try {
      const res = await fetch(`/api/api-keys?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchApiKeys();
      }
    } catch (err) {
      console.error('Failed to delete API key:', err);
    }
  };

  const testConnection = async (id: string) => {
    setTestingConnection(id);
    try {
      const res = await fetch('/api/api-keys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, test: true }),
      });
      if (res.ok) {
        await fetchApiKeys();
      }
    } catch (err) {
      console.error('Failed to test connection:', err);
    }
    setTimeout(() => setTestingConnection(null), 1500);
  };

  const handleDonate = async () => {
    setDonating(true);
    try {
      const amount = customAmount ? parseFloat(customAmount) : donationAmount;
      const res = await fetch('/api/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount, message: donationMessage }),
      });
      if (res.ok) {
        setDonationSuccess(true);
        setTimeout(() => setDonationSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to donate:', err);
    }
    setDonating(false);
  };

  // ── Helpers ───────────────────────────────────────────────────────────

  const formatTokens = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
  };

  const formatCost = (n: number): string => `$${n.toFixed(4)}`;

  const formatDate = (d: string | null): string => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-emerald-400';
      case 'degraded': return 'text-amber-400';
      case 'down': return 'text-red-400';
      default: return 'text-white/40';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20';
      case 'degraded': return 'bg-amber-400/10 text-amber-400 border-amber-400/20';
      case 'down': return 'bg-red-400/10 text-red-400 border-red-400/20';
      default: return 'bg-white/5 text-white/40 border-white/10';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'pro': return 'bg-amber-400/10 text-amber-400 border-amber-400/20';
      case 'enterprise': return 'bg-orange-400/10 text-orange-400 border-orange-400/20';
      default: return 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20';
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'pro': return <Crown className="h-3.5 w-3.5" />;
      case 'enterprise': return <Shield className="h-3.5 w-3.5" />;
      default: return <Zap className="h-3.5 w-3.5" />;
    }
  };

  // ── Loading / Error states ────────────────────────────────────────────

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#09090b]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
          <span className="text-sm text-white/40">Loading account...</span>
        </div>
      </div>
    );
  }

  if (error && !account) {
    return (
      <div className="h-full flex items-center justify-center bg-[#09090b]">
        <Card className="w-80 bg-white/[0.03] border-white/[0.06]">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-10 w-10 text-amber-400 mx-auto mb-3" />
            <p className="text-sm text-white/60 mb-4">{error}</p>
            <Button onClick={loadAll} variant="outline" size="sm" className="border-white/10 text-white/60">
              <RefreshCw className="h-3.5 w-3.5 mr-2" /> Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────

  const localKeys = apiKeys.filter(k => k.isLocal);
  const remoteKeys = apiKeys.filter(k => !k.isLocal);
  const currentPlan = subscription?.planInfo;

  return (
    <div className="h-full bg-[#09090b] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06] shrink-0">
        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-400/20 to-orange-600/20 flex items-center justify-center">
          <User className="h-4.5 w-4.5 text-amber-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white/90">Account & Billing</h2>
          <p className="text-[11px] text-white/35">Manage your profile, subscription, and API keys</p>
        </div>
        <div className="flex-1" />
        {account && (
          <Badge variant="outline" className={`${getPlanColor(account.plan)} text-[10px]`}>
            {getPlanIcon(account.plan)}
            <span className="ml-1">{subscription?.planInfo?.name || 'Free'}</span>
          </Badge>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col min-h-0">
        <div className="px-6 pt-3 shrink-0">
          <TabsList className="bg-white/[0.03] border border-white/[0.06] h-9 w-full">
            <TabsTrigger value="profile" className="text-[11px] h-7 gap-1.5 flex-1 data-[state=active]:bg-amber-400/10 data-[state=active]:text-amber-400">
              <User className="h-3 w-3" /> Profile
            </TabsTrigger>
            <TabsTrigger value="billing" className="text-[11px] h-7 gap-1.5 flex-1 data-[state=active]:bg-amber-400/10 data-[state=active]:text-amber-400">
              <CreditCard className="h-3 w-3" /> Billing
            </TabsTrigger>
            <TabsTrigger value="api-keys" className="text-[11px] h-7 gap-1.5 flex-1 data-[state=active]:bg-amber-400/10 data-[state=active]:text-amber-400">
              <Key className="h-3 w-3" /> BYOK
            </TabsTrigger>
            <TabsTrigger value="local-providers" className="text-[11px] h-7 gap-1.5 flex-1 data-[state=active]:bg-amber-400/10 data-[state=active]:text-amber-400">
              <Server className="h-3 w-3" /> Local
            </TabsTrigger>
            <TabsTrigger value="token-usage" className="text-[11px] h-7 gap-1.5 flex-1 data-[state=active]:bg-amber-400/10 data-[state=active]:text-amber-400">
              <BarChart3 className="h-3 w-3" /> Usage
            </TabsTrigger>
            <TabsTrigger value="donate" className="text-[11px] h-7 gap-1.5 flex-1 data-[state=active]:bg-amber-400/10 data-[state=active]:text-amber-400">
              <Heart className="h-3 w-3" /> Donate
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6 max-w-3xl mx-auto">

            {/* ═══ PROFILE TAB ═══ */}
            <TabsContent value="profile" className="mt-0">
              <div className="grid gap-6">
                {/* Profile Card */}
                <Card className="bg-white/[0.02] border-white/[0.06]">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-sm text-white/80">Profile</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingProfile(!editingProfile)}
                        className="h-7 text-[11px] text-white/40 hover:text-white/70"
                      >
                        {editingProfile ? <X className="h-3.5 w-3.5 mr-1" /> : <Edit3 className="h-3.5 w-3.5 mr-1" />}
                        {editingProfile ? 'Cancel' : 'Edit'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16 border-2 border-white/10">
                        <AvatarImage src={account?.avatarUrl || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-amber-400/20 to-orange-600/20 text-amber-400 text-lg font-semibold">
                          {(account?.displayName || 'D')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        {editingProfile ? (
                          <div className="space-y-3">
                            <div>
                              <Label className="text-[11px] text-white/40 mb-1.5 block">Display Name</Label>
                              <Input
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="h-8 text-sm bg-white/[0.04] border-white/[0.08] text-white/90"
                                placeholder="Your display name"
                              />
                            </div>
                            <div>
                              <Label className="text-[11px] text-white/40 mb-1.5 block">Bio</Label>
                              <Textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="text-sm bg-white/[0.04] border-white/[0.08] text-white/90 min-h-[60px] resize-none"
                                placeholder="Tell us about yourself"
                              />
                            </div>
                            <Button onClick={saveProfile} disabled={saving} size="sm" className="h-8 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border-0">
                              {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1.5" />}
                              Save Changes
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-semibold text-white/90">
                                {account?.displayName || 'Developer'}
                              </h3>
                              <Badge variant="outline" className={`${getPlanColor(account?.plan || 'free')} text-[9px]`}>
                                {getPlanIcon(account?.plan || 'free')}
                                <span className="ml-1">{subscription?.planInfo?.name || 'Free'}</span>
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1.5 text-[12px] text-white/40">
                              <Mail className="h-3 w-3" />
                              <span>{account?.email || 'dev@massive-number.ai'}</span>
                            </div>
                            {account?.bio && (
                              <p className="text-[12px] text-white/50 mt-1">{account.bio}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-[11px] text-white/30">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Joined {formatDate(account?.createdAt || null)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Last login {formatDate(account?.lastLoginAt || null)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Activity className="h-3 w-3" />
                                {account?.loginCount || 0} sessions
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'AI Models', value: subscription?.planInfo?.models === Infinity ? '∞' : String(subscription?.planInfo?.models || 16), icon: Bot, color: 'text-emerald-400' },
                    { label: 'Surfaces', value: subscription?.planInfo?.surfaces === Infinity ? '∞' : String(subscription?.planInfo?.surfaces || 10), icon: Monitor, color: 'text-teal-400' },
                    { label: 'Tokens/Mo', value: currentPlan?.tokenLimit === Infinity ? '∞' : formatTokens(currentPlan?.tokenLimit || 100000), icon: Zap, color: 'text-amber-400' },
                    { label: 'Status', value: subscription?.subscription?.status || 'Active', icon: Shield, color: 'text-orange-400' },
                  ].map((stat) => (
                    <Card key={stat.label} className="bg-white/[0.02] border-white/[0.06]">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                          <span className="text-[10px] text-white/35 uppercase tracking-wider">{stat.label}</span>
                        </div>
                        <p className="text-lg font-semibold text-white/90">{stat.value}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Account Details */}
                <Card className="bg-white/[0.02] border-white/[0.06]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-white/80">Account Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2.5">
                      {[
                        { label: 'User ID', value: account?.userId || 'default', icon: User },
                        { label: 'Email', value: account?.email || 'dev@massive-number.ai', icon: Mail },
                        { label: 'Role', value: account?.role || 'user', icon: Shield },
                        { label: 'Plan', value: subscription?.planInfo?.name || 'Free', icon: Crown },
                        { label: 'Member Since', value: formatDate(account?.createdAt || null), icon: Calendar },
                      ].map((row) => (
                        <div key={row.label} className="flex items-center justify-between py-1">
                          <div className="flex items-center gap-2 text-[12px] text-white/40">
                            <row.icon className="h-3.5 w-3.5" />
                            <span>{row.label}</span>
                          </div>
                          <span className="text-[12px] text-white/70 font-medium">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ═══ BILLING TAB ═══ */}
            <TabsContent value="billing" className="mt-0">
              <div className="grid gap-6">
                {/* Current Plan */}
                <Card className="bg-white/[0.02] border-white/[0.06]">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm text-white/80">Current Plan</CardTitle>
                      <Badge variant="outline" className={`${getPlanColor(subscription?.subscription?.plan || 'free')} text-[10px]`}>
                        {getPlanIcon(subscription?.subscription?.plan || 'free')}
                        <span className="ml-1">{subscription?.planInfo?.name || 'Free'}</span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Token usage bar */}
                      {usage && (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] text-white/40">Token Usage This Month</span>
                            <span className="text-[11px] text-white/60">
                              {formatTokens(usage.totals.totalTokens)} / {currentPlan?.tokenLimit === Infinity ? '∞' : formatTokens(currentPlan?.tokenLimit || 100000)}
                            </span>
                          </div>
                          <Progress
                            value={currentPlan?.tokenLimit === Infinity ? 5 : usage.usagePercent}
                            className="h-2 bg-white/[0.05]"
                          />
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-white/25">{usage.usagePercent.toFixed(1)}% used</span>
                            <span className="text-[10px] text-white/25">
                              {formatCost(usage.totals.cost)} spent
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Subscription status */}
                      {subscription?.subscription && (
                        <div className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`h-2 w-2 rounded-full ${
                                subscription.subscription.status === 'active' ? 'bg-emerald-400' :
                                subscription.subscription.status === 'trialing' ? 'bg-amber-400' :
                                subscription.subscription.status === 'past_due' ? 'bg-red-400' :
                                'bg-white/20'
                              }`} />
                              <span className="text-[12px] font-medium text-white/70 capitalize">
                                {subscription.subscription.status.replace('_', ' ')}
                              </span>
                            </div>
                            {subscription.subscription.cancelAtPeriodEnd && (
                              <p className="text-[11px] text-amber-400/70">
                                Cancellation scheduled at period end
                              </p>
                            )}
                            {subscription.subscription.currentPeriodEnd && (
                              <p className="text-[11px] text-white/30">
                                Renews {formatDate(subscription.subscription.currentPeriodEnd)}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {subscription.subscription.plan !== 'free' && !subscription.subscription.cancelAtPeriodEnd && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={cancelSubscription}
                                className="h-7 text-[11px] text-red-400/70 hover:text-red-400 hover:bg-red-400/10"
                              >
                                Cancel
                              </Button>
                            )}
                            {subscription.subscription.cancelAtPeriodEnd && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={reactivateSubscription}
                                className="h-7 text-[11px] text-emerald-400/70 hover:text-emerald-400 hover:bg-emerald-400/10"
                              >
                                Reactivate
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Features list */}
                      {currentPlan && (
                        <div>
                          <p className="text-[11px] text-white/35 mb-2 uppercase tracking-wider">Plan Features</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {currentPlan.features.map((feature) => (
                              <div key={feature} className="flex items-center gap-2 text-[12px] text-white/50">
                                <Check className="h-3 w-3 text-emerald-400/70 shrink-0" />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Plan Comparison */}
                <div>
                  <h3 className="text-sm font-medium text-white/70 mb-3">Available Plans</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {subscription?.plans && Object.entries(subscription.plans).map(([key, plan]) => {
                      const isCurrent = subscription.subscription?.plan === key;
                      return (
                        <Card key={key} className={`bg-white/[0.02] border-white/[0.06] relative ${isCurrent ? 'ring-1 ring-amber-400/30' : ''}`}>
                          {isCurrent && (
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                              <Badge className="bg-amber-400/20 text-amber-400 border-amber-400/30 text-[9px]">Current</Badge>
                            </div>
                          )}
                          <CardContent className="p-4 pt-5">
                            <div className="text-center mb-3">
                              <div className="flex items-center justify-center gap-1.5 mb-1">
                                {getPlanIcon(key)}
                                <h4 className="text-sm font-semibold text-white/90">{plan.name}</h4>
                              </div>
                              <div className="flex items-baseline justify-center gap-0.5">
                                <span className="text-2xl font-bold text-white/90">${plan.price}</span>
                                {plan.price > 0 && <span className="text-[11px] text-white/35">/mo</span>}
                              </div>
                            </div>
                            <div className="space-y-1.5 mb-4">
                              <div className="text-[11px] text-white/40 flex items-center gap-1.5">
                                <Zap className="h-3 w-3 text-amber-400/60" />
                                {plan.tokenLimit === Infinity ? 'Unlimited' : formatTokens(plan.tokenLimit)} tokens/mo
                              </div>
                              <div className="text-[11px] text-white/40 flex items-center gap-1.5">
                                <Globe className="h-3 w-3 text-teal-400/60" />
                                {plan.models === Infinity ? '∞' : plan.models} models
                              </div>
                              <div className="text-[11px] text-white/40 flex items-center gap-1.5">
                                <Monitor className="h-3 w-3 text-emerald-400/60" />
                                {plan.surfaces === Infinity ? '∞' : plan.surfaces} surfaces
                              </div>
                            </div>
                            {!isCurrent && (
                              <Button
                                onClick={() => changePlan(key)}
                                disabled={changingPlan !== null}
                                size="sm"
                                className={`w-full h-8 text-[11px] border-0 ${
                                  key === 'enterprise'
                                    ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                                    : key === 'pro'
                                    ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                                    : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                }`}
                              >
                                {changingPlan === key ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                ) : (
                                  <ArrowUpRight className="h-3.5 w-3.5 mr-1.5" />
                                )}
                                {plan.price === 0 ? 'Downgrade' : 'Upgrade'}
                              </Button>
                            )}
                            {isCurrent && (
                              <div className="text-center text-[11px] text-white/25 py-1">Current plan</div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* Payment History (placeholder) */}
                <Card className="bg-white/[0.02] border-white/[0.06]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-white/80">Payment History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-6">
                      <CreditCard className="h-8 w-8 text-white/10 mx-auto mb-2" />
                      <p className="text-[12px] text-white/30">No payment history yet</p>
                      <p className="text-[11px] text-white/20 mt-0.5">Upgrade to a paid plan to see invoices</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ═══ API KEYS (BYOK) TAB ═══ */}
            <TabsContent value="api-keys" className="mt-0">
              <div className="grid gap-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-white/80">Bring Your Own Key</h3>
                    <p className="text-[11px] text-white/35 mt-0.5">Add your API keys to use your own provider accounts</p>
                  </div>
                  <Dialog open={keyDialogOpen} onOpenChange={setKeyDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="h-8 text-[11px] bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border-0">
                        <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Key
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#111] border-white/[0.08] max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-sm text-white/90">Add API Key</DialogTitle>
                        <DialogDescription className="text-[12px] text-white/40">
                          Enter your provider API key. Keys are stored locally and encrypted.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3 mt-2">
                        <div>
                          <Label className="text-[11px] text-white/40 mb-1.5 block">Provider</Label>
                          <Select value={newKeyProvider} onValueChange={setNewKeyProvider}>
                            <SelectTrigger className="h-8 text-sm bg-white/[0.04] border-white/[0.08]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1a1a1a] border-white/[0.08]">
                              {PROVIDER_OPTIONS.map(p => (
                                <SelectItem key={p.value} value={p.value} className="text-sm">
                                  {p.icon} {p.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-[11px] text-white/40 mb-1.5 block">Label (optional)</Label>
                          <Input
                            value={newKeyLabel}
                            onChange={(e) => setNewKeyLabel(e.target.value)}
                            className="h-8 text-sm bg-white/[0.04] border-white/[0.08]"
                            placeholder="e.g., Work account"
                          />
                        </div>
                        <div>
                          <Label className="text-[11px] text-white/40 mb-1.5 block">API Key</Label>
                          <div className="relative">
                            <Input
                              value={newKeyValue}
                              onChange={(e) => setNewKeyValue(e.target.value)}
                              type={showKeyValue ? 'text' : 'password'}
                              className="h-8 text-sm bg-white/[0.04] border-white/[0.08] pr-9"
                              placeholder="sk-..."
                            />
                            <button
                              onClick={() => setShowKeyValue(!showKeyValue)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50"
                            >
                              {showKeyValue ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>
                        {newKeyProvider === 'custom' && (
                          <div>
                            <Label className="text-[11px] text-white/40 mb-1.5 block">Base URL</Label>
                            <Input
                              value={newKeyBaseUrl}
                              onChange={(e) => setNewKeyBaseUrl(e.target.value)}
                              className="h-8 text-sm bg-white/[0.04] border-white/[0.08]"
                              placeholder="https://api.example.com/v1"
                            />
                          </div>
                        )}
                        <Button
                          onClick={addApiKey}
                          disabled={addingKey || !newKeyValue}
                          className="w-full h-8 text-[11px] bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border-0"
                        >
                          {addingKey ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Plus className="h-3.5 w-3.5 mr-1.5" />}
                          Add Key
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* API Keys List */}
                {remoteKeys.length === 0 ? (
                  <Card className="bg-white/[0.02] border-white/[0.06]">
                    <CardContent className="p-8 text-center">
                      <Key className="h-10 w-10 text-white/10 mx-auto mb-3" />
                      <p className="text-[12px] text-white/30">No API keys added yet</p>
                      <p className="text-[11px] text-white/20 mt-0.5">Add your own keys to use premium models directly</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {remoteKeys.map((apiKey) => {
                      const providerInfo = PROVIDER_OPTIONS.find(p => p.value === apiKey.provider);
                      return (
                        <motion.div
                          key={apiKey.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-colors"
                        >
                          <div className="h-8 w-8 rounded-md bg-white/[0.05] flex items-center justify-center text-sm">
                            {providerInfo?.icon || '🔑'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[12px] font-medium text-white/80">
                                {apiKey.label || providerInfo?.label || apiKey.provider}
                              </span>
                              <Badge variant="outline" className="text-[9px] h-4 bg-white/[0.03] border-white/[0.06] text-white/40">
                                {apiKey.provider}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-[11px] text-white/25 font-mono">{apiKey.key}</span>
                              {apiKey.lastUsedAt && (
                                <span className="text-[10px] text-white/20">
                                  Used {formatDate(apiKey.lastUsedAt)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => testConnection(apiKey.id)}
                              disabled={testingConnection === apiKey.id}
                              className="h-7 text-[10px] text-white/30 hover:text-white/60"
                            >
                              {testingConnection === apiKey.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <TestTube className="h-3 w-3" />
                              )}
                            </Button>
                            <Switch
                              checked={apiKey.enabled}
                              onCheckedChange={() => toggleApiKey(apiKey.id, apiKey.enabled)}
                              className="scale-75"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteApiKey(apiKey.id)}
                              className="h-7 text-[10px] text-red-400/40 hover:text-red-400 hover:bg-red-400/10"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* Provider Info Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PROVIDER_OPTIONS.map(p => (
                    <Card key={p.value} className="bg-white/[0.02] border-white/[0.06]">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-lg">{p.icon}</span>
                          <span className="text-[12px] font-medium text-white/70">{p.label}</span>
                          <Badge variant="outline" className="ml-auto text-[9px] bg-white/[0.03] border-white/[0.06] text-white/30">
                            {remoteKeys.filter(k => k.provider === p.value).length} key{remoteKeys.filter(k => k.provider === p.value).length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-white/25">
                          {p.value === 'openai' && 'Get keys from platform.openai.com'}
                          {p.value === 'anthropic' && 'Get keys from console.anthropic.com'}
                          {p.value === 'google' && 'Get keys from aistudio.google.com'}
                          {p.value === 'deepseek' && 'Get keys from platform.deepseek.com'}
                          {p.value === 'custom' && 'Connect to any OpenAI-compatible API'}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* ═══ LOCAL PROVIDERS TAB ═══ */}
            <TabsContent value="local-providers" className="mt-0">
              <div className="grid gap-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-white/80">Local Providers</h3>
                    <p className="text-[11px] text-white/35 mt-0.5">Connect to LM Studio, Ollama, or custom local endpoints</p>
                  </div>
                  <Dialog open={localDialogOpen} onOpenChange={setLocalDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="h-8 text-[11px] bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border-0">
                        <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Provider
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#111] border-white/[0.08] max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-sm text-white/90">Add Local Provider</DialogTitle>
                        <DialogDescription className="text-[12px] text-white/40">
                          Connect to a local AI provider running on your machine
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3 mt-2">
                        <div>
                          <Label className="text-[11px] text-white/40 mb-1.5 block">Provider</Label>
                          <Select value={localProvider} onValueChange={(v) => {
                            setLocalProvider(v);
                            const p = LOCAL_PROVIDERS.find(lp => lp.value === v);
                            if (p) setLocalUrl(p.defaultUrl);
                          }}>
                            <SelectTrigger className="h-8 text-sm bg-white/[0.04] border-white/[0.08]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1a1a1a] border-white/[0.08]">
                              {LOCAL_PROVIDERS.map(p => (
                                <SelectItem key={p.value} value={p.value} className="text-sm">
                                  {p.icon} {p.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-[11px] text-white/40 mb-1.5 block">Label (optional)</Label>
                          <Input
                            value={localLabel}
                            onChange={(e) => setLocalLabel(e.target.value)}
                            className="h-8 text-sm bg-white/[0.04] border-white/[0.08]"
                            placeholder="e.g., My LM Studio"
                          />
                        </div>
                        <div>
                          <Label className="text-[11px] text-white/40 mb-1.5 block">Base URL</Label>
                          <Input
                            value={localUrl}
                            onChange={(e) => setLocalUrl(e.target.value)}
                            className="h-8 text-sm bg-white/[0.04] border-white/[0.08]"
                            placeholder="http://localhost:1234/v1"
                          />
                        </div>
                        <div>
                          <Label className="text-[11px] text-white/40 mb-1.5 block">API Key (optional, some providers need this)</Label>
                          <Input
                            value={localKeyValue}
                            onChange={(e) => setLocalKeyValue(e.target.value)}
                            type="password"
                            className="h-8 text-sm bg-white/[0.04] border-white/[0.08]"
                            placeholder="Usually not required for local"
                          />
                        </div>
                        <Button
                          onClick={addLocalProvider}
                          disabled={addingKey}
                          className="w-full h-8 text-[11px] bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border-0"
                        >
                          {addingKey ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Plus className="h-3.5 w-3.5 mr-1.5" />}
                          Add Provider
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Local Provider Presets */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {LOCAL_PROVIDERS.map(lp => (
                    <Card key={lp.value} className="bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] transition-colors cursor-pointer"
                      onClick={() => {
                        setLocalProvider(lp.value);
                        setLocalUrl(lp.defaultUrl);
                        setLocalDialogOpen(true);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="text-center">
                          <span className="text-2xl block mb-2">{lp.icon}</span>
                          <h4 className="text-[12px] font-medium text-white/80">{lp.label}</h4>
                          {lp.defaultUrl && (
                            <p className="text-[10px] text-white/25 font-mono mt-1">{lp.defaultUrl}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Configured Local Providers */}
                {localKeys.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[11px] text-white/35 uppercase tracking-wider">Configured Providers</h4>
                    {localKeys.map((lk) => (
                      <motion.div
                        key={lk.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]"
                      >
                        <div className="h-8 w-8 rounded-md bg-white/[0.05] flex items-center justify-center text-sm">
                          {LOCAL_PROVIDERS.find(p => p.value === lk.provider)?.icon || '🖥️'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-medium text-white/80">
                              {lk.label || LOCAL_PROVIDERS.find(p => p.value === lk.provider)?.label || lk.provider}
                            </span>
                            <Badge variant="outline" className="text-[9px] h-4 bg-white/[0.03] border-white/[0.06] text-white/40">
                              local
                            </Badge>
                          </div>
                          <span className="text-[11px] text-white/25 font-mono block">{lk.baseUrl || 'No URL set'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => testConnection(lk.id)}
                            disabled={testingConnection === lk.id}
                            className="h-7 text-[10px] text-white/30 hover:text-white/60"
                          >
                            {testingConnection === lk.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Wifi className="h-3 w-3" />
                            )}
                          </Button>
                          <Switch
                            checked={lk.enabled}
                            onCheckedChange={() => toggleApiKey(lk.id, lk.enabled)}
                            className="scale-75"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteApiKey(lk.id)}
                            className="h-7 text-[10px] text-red-400/40 hover:text-red-400 hover:bg-red-400/10"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Model Health */}
                {modelHealth.length > 0 && (
                  <Card className="bg-white/[0.02] border-white/[0.06]">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm text-white/80">Model Health Status</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={fetchModelHealth}
                          className="h-6 text-[10px] text-white/30 hover:text-white/60"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" /> Refresh
                        </Button>
                      </div>
                      {healthSummary && (
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[10px] text-emerald-400/70">{healthSummary.healthy} healthy</span>
                          <span className="text-[10px] text-amber-400/70">{healthSummary.degraded} degraded</span>
                          <span className="text-[10px] text-red-400/70">{healthSummary.down} down</span>
                          <span className="text-[10px] text-white/20">avg {healthSummary.avgLatency}ms</span>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
                        {modelHealth.map(mh => (
                          <div key={mh.id} className="flex items-center gap-2.5 py-1.5">
                            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                              mh.status === 'healthy' ? 'bg-emerald-400' :
                              mh.status === 'degraded' ? 'bg-amber-400' :
                              'bg-red-400'
                            }`} />
                            <span className="text-[11px] text-white/60 flex-1">{mh.name}</span>
                            <Badge variant="outline" className={`text-[8px] h-4 ${getStatusBg(mh.status)}`}>
                              {mh.status}
                            </Badge>
                            <span className="text-[10px] text-white/20 w-14 text-right">{mh.latencyMs}ms</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Auto-discovery hint */}
                <Card className="bg-white/[0.02] border-white/[0.06] border-dashed">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Search className="h-5 w-5 text-amber-400/40 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-[12px] font-medium text-white/60">Auto-Discover Models</h4>
                        <p className="text-[11px] text-white/30 mt-0.5">
                          After connecting a local provider, available models will be auto-discovered and added to your model list.
                          Make sure your local server is running before testing the connection.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ═══ TOKEN USAGE TAB ═══ */}
            <TabsContent value="token-usage" className="mt-0">
              <div className="grid gap-6">
                {/* Usage Overview */}
                {usage && (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Total Tokens', value: formatTokens(usage.totals.totalTokens), icon: Zap, color: 'text-amber-400' },
                        { label: 'Input Tokens', value: formatTokens(usage.totals.inputTokens), icon: ArrowUpRight, color: 'text-teal-400' },
                        { label: 'Output Tokens', value: formatTokens(usage.totals.outputTokens), icon: ArrowDownRight, color: 'text-emerald-400' },
                        { label: 'Total Cost', value: formatCost(usage.totals.cost), icon: DollarSign, color: 'text-orange-400' },
                      ].map((stat) => (
                        <Card key={stat.label} className="bg-white/[0.02] border-white/[0.06]">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-1.5 mb-1">
                              <stat.icon className={`h-3 w-3 ${stat.color}`} />
                              <span className="text-[10px] text-white/35 uppercase tracking-wider">{stat.label}</span>
                            </div>
                            <p className="text-lg font-semibold text-white/90">{stat.value}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Usage bar */}
                    <Card className="bg-white/[0.02] border-white/[0.06]">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-white/80">Monthly Usage</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-2">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] text-white/40">{usage.period}</span>
                            <span className="text-[11px] text-white/60">
                              {formatTokens(usage.totals.totalTokens)} / {usage.tokenLimit === Infinity ? '∞' : formatTokens(usage.tokenLimit)}
                            </span>
                          </div>
                          <Progress
                            value={usage.tokenLimit === Infinity ? 5 : usage.usagePercent}
                            className="h-3 bg-white/[0.05]"
                          />
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-[10px] text-white/25">
                              {usage.usagePercent.toFixed(1)}% of limit
                            </span>
                            <span className="text-[10px] text-white/25">
                              Resets {formatDate(subscription?.subscription?.currentPeriodEnd || null)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Monthly Trend */}
                    {usage.monthlyUsage.length > 0 && (
                      <Card className="bg-white/[0.02] border-white/[0.06]">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-white/80">6-Month Trend</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-end gap-2 h-32">
                            {usage.monthlyUsage.map((mu, i) => {
                              const maxTokens = Math.max(...usage.monthlyUsage.map(m => m.totalTokens), 1);
                              const height = Math.max(4, (mu.totalTokens / maxTokens) * 100);
                              return (
                                <div key={mu.period} className="flex-1 flex flex-col items-center gap-1">
                                  <span className="text-[9px] text-white/30 font-mono">
                                    {mu.totalTokens > 0 ? formatTokens(mu.totalTokens) : '0'}
                                  </span>
                                  <div className="w-full relative" style={{ height: '100px' }}>
                                    <motion.div
                                      initial={{ height: 0 }}
                                      animate={{ height: `${height}%` }}
                                      transition={{ delay: i * 0.05, duration: 0.3 }}
                                      className={`absolute bottom-0 w-full rounded-t-sm ${
                                        i === usage.monthlyUsage.length - 1
                                          ? 'bg-gradient-to-t from-amber-500/30 to-amber-400/10'
                                          : 'bg-gradient-to-t from-white/[0.06] to-white/[0.02]'
                                      }`}
                                    />
                                  </div>
                                  <span className="text-[9px] text-white/20">
                                    {mu.period.slice(5)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* By Provider */}
                    {Object.keys(usage.byProvider).length > 0 && (
                      <Card className="bg-white/[0.02] border-white/[0.06]">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-white/80">Usage by Provider</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {Object.entries(usage.byProvider)
                              .sort((a, b) => b[1].totalTokens - a[1].totalTokens)
                              .map(([provider, data]) => {
                                const maxP = Math.max(...Object.values(usage.byProvider).map(v => v.totalTokens), 1);
                                const pct = (data.totalTokens / maxP) * 100;
                                return (
                                  <div key={provider}>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-[11px] text-white/60 capitalize">{provider}</span>
                                      <div className="flex items-center gap-3">
                                        <span className="text-[10px] text-white/30">{formatTokens(data.totalTokens)}</span>
                                        <span className="text-[10px] text-white/30">{formatCost(data.cost)}</span>
                                        <span className="text-[10px] text-white/20">{data.count} calls</span>
                                      </div>
                                    </div>
                                    <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pct}%` }}
                                        className="h-full bg-gradient-to-r from-amber-400/40 to-orange-400/20 rounded-full"
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* By Model */}
                    {Object.keys(usage.byModel).length > 0 && (
                      <Card className="bg-white/[0.02] border-white/[0.06]">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-white/80">Usage by Model</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-1.5">
                            {Object.entries(usage.byModel)
                              .sort((a, b) => b[1].totalTokens - a[1].totalTokens)
                              .map(([model, data]) => (
                                <div key={model} className="flex items-center gap-2 py-1">
                                  <Cpu className="h-3 w-3 text-white/20 shrink-0" />
                                  <span className="text-[11px] text-white/60 flex-1 min-w-0 truncate">{model}</span>
                                  <span className="text-[10px] text-white/25">{data.provider}</span>
                                  <span className="text-[10px] text-white/30">{formatTokens(data.totalTokens)}</span>
                                  <span className="text-[10px] text-white/30 w-16 text-right">{formatCost(data.cost)}</span>
                                </div>
                              ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}

                {!usage && (
                  <Card className="bg-white/[0.02] border-white/[0.06]">
                    <CardContent className="p-8 text-center">
                      <BarChart3 className="h-10 w-10 text-white/10 mx-auto mb-3" />
                      <p className="text-[12px] text-white/30">No usage data available</p>
                      <p className="text-[11px] text-white/20 mt-0.5">Start chatting to see your usage stats</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* ═══ DONATE TAB ═══ */}
            <TabsContent value="donate" className="mt-0">
              <div className="grid gap-6">
                <Card className="bg-white/[0.02] border-white/[0.06]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-white/80 flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-400/70" />
                      Support Massive Number
                    </CardTitle>
                    <CardDescription className="text-[11px] text-white/35">
                      Your donations help us keep building and improving the platform. Every contribution matters!
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Amount selection */}
                      <div>
                        <Label className="text-[11px] text-white/40 mb-2 block">Select Amount</Label>
                        <div className="grid grid-cols-4 gap-2">
                          {DONATION_AMOUNTS.map((amt) => (
                            <button
                              key={amt}
                              onClick={() => { setDonationAmount(amt); setCustomAmount(''); }}
                              className={`py-3 rounded-lg border text-sm font-medium transition-all ${
                                donationAmount === amt && !customAmount
                                  ? 'bg-amber-400/10 border-amber-400/30 text-amber-400'
                                  : 'bg-white/[0.03] border-white/[0.06] text-white/50 hover:bg-white/[0.06] hover:text-white/70'
                              }`}
                            >
                              ${amt}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Custom amount */}
                      <div>
                        <Label className="text-[11px] text-white/40 mb-1.5 block">Custom Amount</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/25" />
                          <Input
                            value={customAmount}
                            onChange={(e) => {
                              setCustomAmount(e.target.value);
                              if (e.target.value) setDonationAmount(parseFloat(e.target.value) || 0);
                            }}
                            type="number"
                            min="1"
                            className="h-8 text-sm bg-white/[0.04] border-white/[0.08] pl-7"
                            placeholder="Enter custom amount"
                          />
                        </div>
                      </div>

                      {/* Message */}
                      <div>
                        <Label className="text-[11px] text-white/40 mb-1.5 block">Message (optional)</Label>
                        <Textarea
                          value={donationMessage}
                          onChange={(e) => setDonationMessage(e.target.value)}
                          className="text-sm bg-white/[0.04] border-white/[0.08] min-h-[60px] resize-none"
                          placeholder="Leave a message with your donation"
                        />
                      </div>

                      {/* Donate button */}
                      <Button
                        onClick={handleDonate}
                        disabled={donating || (!customAmount && donationAmount === 0) || (customAmount && parseFloat(customAmount) <= 0)}
                        className="w-full h-10 text-[13px] bg-gradient-to-r from-red-500/20 to-orange-500/20 text-orange-400 hover:from-red-500/30 hover:to-orange-500/30 border-0"
                      >
                        {donating ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Heart className="h-4 w-4 mr-2" />
                        )}
                        Donate ${customAmount || donationAmount}
                      </Button>

                      {/* Success message */}
                      <AnimatePresence>
                        {donationSuccess && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center gap-2 p-3 rounded-lg bg-emerald-400/10 border border-emerald-400/20"
                          >
                            <Check className="h-4 w-4 text-emerald-400" />
                            <span className="text-[12px] text-emerald-400">Thank you for your donation! 🎉</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </CardContent>
                </Card>

                {/* Why Donate */}
                <Card className="bg-white/[0.02] border-white/[0.06]">
                  <CardContent className="p-4">
                    <h4 className="text-[12px] font-medium text-white/60 mb-3">Why Donate?</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { icon: Cpu, title: 'Infrastructure', desc: 'Keep our servers running and models accessible' },
                        { icon: Zap, title: 'Development', desc: 'Fund new features and improvements' },
                        { icon: Globe, title: 'Open Source', desc: 'Help us maintain and grow our open-source tools' },
                        { icon: Star, title: 'Community', desc: 'Support the community with free tier access' },
                      ].map((item) => (
                        <div key={item.title} className="flex items-start gap-2">
                          <item.icon className="h-4 w-4 text-amber-400/50 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[11px] font-medium text-white/60">{item.title}</p>
                            <p className="text-[10px] text-white/30">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
