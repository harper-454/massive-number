'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  MessageSquare,
  Bot,
  Plug,
  FileText,
  GitBranch,
  Package,
  User,
  Download,
  X,
  Check,
  CheckCheck,
  Trash2,
  Search,
  Clock,
  Sparkles,
  Globe,
  Code,
  Settings,
  Store,
  Crown,
  Palette,
  Zap,
  Activity,
  ChevronDown,
  ChevronRight,
  Filter,
  ArrowUpRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

type NotificationType = 'info' | 'success' | 'warning' | 'error';
type NotificationFilter = 'all' | 'unread' | 'info' | 'success' | 'warning' | 'error';
type DateFilter = 'today' | '7days' | '30days' | 'all';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
}

interface TimelineItem {
  id: string;
  icon: React.ElementType;
  iconColor: string;
  action: string;
  timestamp: Date;
  entityLink?: string;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  navigateTo: string;
  color: string;
}

// ── Data ────────────────────────────────────────────────────────────────
// Quick actions are config, not data — KEEP

// Timeline icon map
const TIMELINE_ICON_MAP: Record<string, React.ElementType> = {
  messagesquare: MessageSquare,
  bot: Bot,
  plug: Plug,
  filetext: FileText,
  gitbranch: GitBranch,
  package: Package,
  user: User,
  collab_invite: User,
  snippet_create: Code,
  mcp_connect: Plug,
  spec_generate: FileText,
  agent_launch: Bot,
  chat_message: MessageSquare,
  marketplace_install: Package,
  settings_update: Settings,
};

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'qa-1', label: 'New Chat', icon: MessageSquare, navigateTo: 'chat', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30 hover:bg-emerald-500/25' },
  { id: 'qa-2', label: 'New Agent', icon: Bot, navigateTo: 'agent', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30 hover:bg-amber-500/25' },
  { id: 'qa-3', label: 'Web Search', icon: Globe, navigateTo: 'search', color: 'text-teal-400 bg-teal-500/15 border-teal-500/30 hover:bg-teal-500/25' },
  { id: 'qa-4', label: 'Connect MCP', icon: Plug, navigateTo: 'mcp', color: 'text-orange-400 bg-orange-500/15 border-orange-500/30 hover:bg-orange-500/25' },
  { id: 'qa-5', label: 'New Spec', icon: FileText, navigateTo: 'spec', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30 hover:bg-emerald-500/25' },
  { id: 'qa-6', label: 'View Marketplace', icon: Store, navigateTo: 'marketplace', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30 hover:bg-amber-500/25' },
  { id: 'qa-7', label: 'Customize', icon: Palette, navigateTo: 'settings', color: 'text-teal-400 bg-teal-500/15 border-teal-500/30 hover:bg-teal-500/25' },
  { id: 'qa-8', label: 'View Comparison', icon: Crown, navigateTo: 'competitive', color: 'text-orange-400 bg-orange-500/15 border-orange-500/30 hover:bg-orange-500/25' },
];

const NOTIFICATION_CONFIG: Record<NotificationType, { icon: React.ElementType; colorClass: string; bgClass: string; borderClass: string }> = {
  info: { icon: Info, colorClass: 'text-teal-400', bgClass: 'bg-teal-500/10', borderClass: 'border-teal-500/20' },
  success: { icon: CheckCircle2, colorClass: 'text-emerald-400', bgClass: 'bg-emerald-500/10', borderClass: 'border-emerald-500/20' },
  warning: { icon: AlertTriangle, colorClass: 'text-amber-400', bgClass: 'bg-amber-500/10', borderClass: 'border-amber-500/20' },
  error: { icon: XCircle, colorClass: 'text-red-400', bgClass: 'bg-red-500/10', borderClass: 'border-red-500/20' },
};

// ── Helpers ─────────────────────────────────────────────────────────────

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

function isToday(date: Date): boolean {
  const now = new Date();
  return date.toDateString() === now.toDateString();
}

function isWithinDays(date: Date, days: number): boolean {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return date >= cutoff;
}

// ── Component ───────────────────────────────────────────────────────────

export function NotificationsPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifFilter, setNotifFilter] = useState<NotificationFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [activeSection, setActiveSection] = useState<'notifications' | 'timeline' | 'actions'>('notifications');
  const [expandedTimeline, setExpandedTimeline] = useState<Set<string>>(new Set());
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/notifications').then(r => r.json()),
      fetch('/api/activity').then(r => r.json()),
    ])
      .then(([notifData, activityData]) => {
        setNotifications((notifData.notifications || []).map((n: { id: string; type: string; title: string; description: string; createdAt: string; read: boolean; actionUrl?: string }) => ({
          id: n.id,
          type: n.type as NotificationType,
          title: n.title,
          description: n.description,
          timestamp: new Date(n.createdAt),
          read: n.read,
        })));
        setTimelineItems((activityData.activities || []).map((a: { id: string; action: string; entity?: string; entityId?: string; description?: string; metadata?: string; createdAt: string }) => ({
          id: a.id,
          icon: TIMELINE_ICON_MAP[a.action?.toLowerCase()] || Activity,
          iconColor: 'text-muted-foreground',
          action: a.description || a.action,
          timestamp: new Date(a.createdAt),
        })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Type filter
    if (notifFilter === 'unread') {
      filtered = filtered.filter((n) => !n.read);
    } else if (notifFilter !== 'all') {
      filtered = filtered.filter((n) => n.type === notifFilter);
    }

    // Date filter
    if (dateFilter === 'today') {
      filtered = filtered.filter((n) => isToday(n.timestamp));
    } else if (dateFilter === '7days') {
      filtered = filtered.filter((n) => isWithinDays(n.timestamp, 7));
    } else if (dateFilter === '30days') {
      filtered = filtered.filter((n) => isWithinDays(n.timestamp, 30));
    }

    return filtered;
  }, [notifications, notifFilter, dateFilter]);

  // Filtered timeline
  const filteredTimeline = useMemo(() => {
    if (dateFilter === 'today') {
      return timelineItems.filter((t) => isToday(t.timestamp));
    }
    if (dateFilter === '7days') {
      return timelineItems.filter((t) => isWithinDays(t.timestamp, 7));
    }
    if (dateFilter === '30days') {
      return timelineItems.filter((t) => isWithinDays(t.timestamp, 30));
    }
    return timelineItems;
  }, [dateFilter, timelineItems]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const FILTER_OPTIONS: { id: NotificationFilter; label: string; count?: number }[] = [
    { id: 'all', label: 'All', count: notifications.length },
    { id: 'unread', label: 'Unread', count: unreadCount },
    { id: 'info', label: 'Info' },
    { id: 'success', label: 'Success' },
    { id: 'warning', label: 'Warning' },
    { id: 'error', label: 'Error' },
  ];

  const SECTIONS = [
    { id: 'notifications' as const, label: 'Notifications', icon: Bell, badge: unreadCount > 0 ? unreadCount : undefined },
    { id: 'timeline' as const, label: 'Timeline', icon: Clock },
    { id: 'actions' as const, label: 'Quick Actions', icon: Zap },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-amber-500/15 flex items-center justify-center relative">
              <Bell className="h-4 w-4 text-amber-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-red-500 text-[8px] text-white flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-sm font-semibold">Notifications</h2>
              <p className="text-[10px] text-muted-foreground">Activity & alerts center</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-[8px] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 gap-0.5"
                onClick={markAllRead}
              >
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-[8px] text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-0.5"
                onClick={clearAll}
              >
                <Trash2 className="h-3 w-3" />
                Clear all
              </Button>
            )}
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex gap-1 mb-2">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 relative ${
                  activeSection === section.id
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'bg-muted/50 text-muted-foreground hover:text-foreground border border-transparent'
                }`}
              >
                <Icon className="h-3 w-3" />
                {section.label}
                {section.badge !== undefined && (
                  <span className="h-3.5 min-w-3.5 px-1 rounded-full bg-red-500 text-[7px] text-white flex items-center justify-center font-bold">
                    {section.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Filter row (for notifications & timeline) */}
        {(activeSection === 'notifications' || activeSection === 'timeline') && (
          <div className="flex items-center gap-2">
            {/* Notification type filter (only for notifications) */}
            {activeSection === 'notifications' && (
              <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none flex-1">
                {FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setNotifFilter(opt.id)}
                    className={`px-2 py-0.5 rounded text-[9px] font-medium whitespace-nowrap transition-colors shrink-0 ${
                      notifFilter === opt.id
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'text-muted-foreground hover:text-foreground border border-transparent'
                    }`}
                  >
                    {opt.label}
                    {opt.count !== undefined && (
                      <span className="ml-0.5 text-[8px] opacity-60">({opt.count})</span>
                    )}
                  </button>
                ))}
              </div>
            )}
            {/* Date filter */}
            <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
              <SelectTrigger className="h-6 w-28 text-[9px] bg-card/50 shrink-0">
                <Filter className="h-2.5 w-2.5 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Separator className="shrink-0" />

      {/* Content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-3">
          {/* Section 1: Notifications */}
          {activeSection === 'notifications' && (
            <>
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Bell className="h-10 w-10 mb-3 opacity-30" />
                  <p className="text-xs font-medium mb-1">
                    {notifFilter === 'unread' ? 'All caught up!' : 'No notifications'}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60">
                    {notifFilter === 'unread'
                      ? 'You have no unread notifications'
                      : 'No notifications match your current filter'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredNotifications.map((notif, idx) => {
                    const config = NOTIFICATION_CONFIG[notif.type];
                    const NotifIcon = config.icon;

                    return (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        transition={{ delay: idx * 0.03 }}
                        className={`rounded-lg border p-3 transition-all group ${
                          notif.read
                            ? 'border-border/30 bg-card/30'
                            : `border-border/50 ${config.bgClass} ${config.borderClass}`
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          {/* Icon */}
                          <div className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${config.bgClass}`}>
                            <NotifIcon className={`h-3.5 w-3.5 ${config.colorClass}`} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className={`text-[10px] font-semibold ${notif.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                                {notif.title}
                              </span>
                              {!notif.read && (
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                              )}
                            </div>
                            <p className={`text-[9px] leading-relaxed ${notif.read ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
                              {notif.description}
                            </p>
                            <span className="text-[8px] text-muted-foreground/50 mt-1 block">
                              {formatTimeAgo(notif.timestamp)}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            {!notif.read && (
                              <button
                                onClick={() => markAsRead(notif.id)}
                                className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                                aria-label="Mark as read"
                              >
                                <Check className="h-3 w-3" />
                              </button>
                            )}
                            <button
                              onClick={() => dismissNotification(notif.id)}
                              className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                              aria-label="Dismiss"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Section 2: Activity Timeline */}
          {activeSection === 'timeline' && (
            <>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Activity Timeline</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-5 px-2 text-[8px] gap-1"
                >
                  <Download className="h-2.5 w-2.5" />
                  Export Activity
                </Button>
              </div>

              {filteredTimeline.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Clock className="h-10 w-10 mb-3 opacity-30" />
                  <p className="text-xs font-medium mb-1">No activity found</p>
                  <p className="text-[10px] text-muted-foreground/60">
                    No activity matches the selected date range
                  </p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[15px] top-3 bottom-3 w-px bg-border/40" />

                  <div className="space-y-0">
                    {filteredTimeline.map((item, idx) => {
                      const Icon = item.icon;

                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          className="relative flex items-start gap-3 py-2.5 group"
                        >
                          {/* Timeline dot */}
                          <div className={`relative z-10 h-[30px] w-[30px] rounded-full flex items-center justify-center shrink-0 bg-background border border-border/50 group-hover:border-border transition-colors`}>
                            <Icon className={`h-3.5 w-3.5 ${item.iconColor}`} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 pt-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-foreground">{item.action}</span>
                              {item.entityLink && (
                                <a
                                  href={item.entityLink}
                                  className="text-[9px] text-muted-foreground hover:text-emerald-400 transition-colors inline-flex items-center gap-0.5"
                                  onClick={(e) => e.preventDefault()}
                                >
                                  <ArrowUpRight className="h-2.5 w-2.5" />
                                  view
                                </a>
                              )}
                            </div>
                            <span className="text-[8px] text-muted-foreground/60 mt-0.5 block">
                              {formatTimeAgo(item.timestamp)}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Section 3: Quick Actions */}
          {activeSection === 'actions' && (
            <>
              <div className="flex items-center gap-1.5 mb-3">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">Quick Actions</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {QUICK_ACTIONS.map((action, idx) => {
                  const Icon = action.icon;

                  return (
                    <motion.button
                      key={action.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.04 }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex flex-col items-center justify-center gap-2 rounded-lg border p-4 transition-all ${action.color}`}
                      onClick={() => {
                        // Navigation would be handled by the parent
                      }}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-[10px] font-medium">{action.label}</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Additional context: summary stats */}
              <div className="mt-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Session Summary</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'Messages', value: '24', icon: MessageSquare, color: 'text-emerald-400' },
                    { label: 'Agents Run', value: '3', icon: Bot, color: 'text-amber-400' },
                    { label: 'MCP Servers', value: '2', icon: Plug, color: 'text-teal-400' },
                    { label: 'Specs', value: '5', icon: FileText, color: 'text-orange-400' },
                  ].map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <div
                        key={stat.label}
                        className="rounded-lg border border-border/50 bg-card/50 p-3 text-center"
                      >
                        <Icon className={`h-4 w-4 mx-auto mb-1 ${stat.color}`} />
                        <div className="text-lg font-bold text-foreground">{stat.value}</div>
                        <div className="text-[8px] text-muted-foreground">{stat.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      {/* Footer stats */}
      <Separator className="shrink-0" />
      <div className="shrink-0 px-4 py-2 flex items-center justify-between text-[10px] text-muted-foreground bg-card/30">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Bell className="h-2.5 w-2.5" />
            {notifications.length} notifications
          </span>
          {unreadCount > 0 && (
            <span className="flex items-center gap-1 text-amber-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              {unreadCount} unread
            </span>
          )}
        </div>
        <span className="flex items-center gap-1">
          <Clock className="h-2.5 w-2.5" />
          Last updated just now
        </span>
      </div>
    </div>
  );
}
