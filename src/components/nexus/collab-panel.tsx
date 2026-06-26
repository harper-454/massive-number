'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Users,
  Share2,
  Copy,
  Check,
  MousePointer2,
  MessageSquare,
  Send,
  Circle,
  UserPlus,
  Eye,
  Clock,
  FileCode,
  GitBranch,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ───────────────────────────────────────────────────────────────

type CollaboratorStatus = 'online' | 'away' | 'offline';

interface Collaborator {
  id: string;
  name: string;
  initials: string;
  color: string;
  status: CollaboratorStatus;
  currentFile?: string;
  cursorLine?: number;
}

interface ActivityItem {
  id: string;
  userId: string;
  action: string;
  target: string;
  time: string;
}

interface ChatMessage {
  id: string;
  userId: string;
  message: string;
  time: string;
  isSelf: boolean;
}

// ── Data ────────────────────────────────────────────────────────────────

// ── Component ───────────────────────────────────────────────────────────

export function CollabPanel() {
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [activeTab, setActiveTab] = useState<'activity' | 'chat'>('activity');
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/collab').then(r => r.json()),
      fetch('/api/activity').then(r => r.json()),
    ])
      .then(([collabData, activityData]) => {
        setCollaborators((collabData.collaborators || []).map((c: { id: string; name: string; avatar: string; status: 'online' | 'away' | 'offline'; cursor: { file: string; line: number } | null; color: string }) => ({
          id: c.id,
          name: c.name,
          initials: c.avatar,
          color: `bg-${c.color?.replace('#', '') || 'emerald-500'}`,
          status: c.status,
          currentFile: c.cursor?.file,
          cursorLine: c.cursor?.line,
        })));
        setActivities((activityData.activities || []).map((a: { id: string; action: string; target: string; timestamp: string }) => ({
          id: a.id,
          userId: '',
          action: a.action,
          target: a.target,
          time: new Date(a.timestamp).toLocaleTimeString(),
        })));
        if (collabData.meta?.onlineCount !== undefined) {
          // Use meta data if needed
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleCopyLink = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareSession = useCallback(() => {
    fetch('/api/collab', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'share-link' }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.shareLink) setShareLink(data.shareLink);
      })
      .catch(() => {});
  }, []);

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      userId: 'me',
      message: chatInput.trim(),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      isSelf: true,
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput('');
  };

  const onlineCount = collaborators.filter((c) => c.status === 'online').length;
  const activeEditors = collaborators.filter((c) => c.status === 'online' && c.currentFile);

  const getCollaborator = (id: string) => collaborators.find((c) => c.id === id);

  const STATUS_DOT: Record<CollaboratorStatus, string> = {
    online: 'bg-emerald-400',
    away: 'bg-amber-400',
    offline: 'bg-zinc-500',
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-teal-500/15 flex items-center justify-center">
              <Users className="h-4 w-4 text-teal-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Collaboration</h2>
              <p className="text-[10px] text-muted-foreground">{onlineCount} online now</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-[9px] gap-1"
            onClick={handleCopyLink}
          >
            {copied ? (
              <Check className="h-3 w-3 text-emerald-400" />
            ) : (
              <Share2 className="h-3 w-3" />
            )}
            {copied ? 'Copied!' : 'Share Session'}
          </Button>
        </div>

        {/* Share link */}
        <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30 mb-3">
          <span className="text-[9px] text-muted-foreground truncate flex-1 font-mono">
            {shareLink}
          </span>
          <button onClick={handleCopyLink} className="shrink-0">
            {copied ? (
              <Check className="h-3 w-3 text-emerald-400" />
            ) : (
              <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            )}
          </button>
        </div>
      </div>

      <Separator className="shrink-0" />

      {/* Active collaborators */}
      <div className="shrink-0 px-4 py-2">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Active Collaborators
        </span>
      </div>
      <div className="shrink-0 px-3 pb-2">
        <div className="space-y-1">
          {collaborators.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Users className="h-6 w-6 mx-auto mb-2 opacity-30" />
              <p className="text-[10px]">No collaborators. Share your session to invite others.</p>
            </div>
          ) : null}
          {collaborators.filter((c) => c.status !== 'offline').map((collab) => (
            <div
              key={collab.id}
              className="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/30 transition-colors"
            >
              <div className="relative shrink-0">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className={`${collab.color} text-[8px] text-white font-medium`}>
                    {collab.initials}
                  </AvatarFallback>
                </Avatar>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-background ${STATUS_DOT[collab.status]}`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-medium">{collab.name}</span>
                  {collab.id === 'me' && (
                    <Badge variant="secondary" className="text-[7px] h-3 px-1">
                      You
                    </Badge>
                  )}
                </div>
                {collab.currentFile && (
                  <span className="text-[8px] text-muted-foreground flex items-center gap-1">
                    <FileCode className="h-2 w-2" />
                    {collab.currentFile}
                    {collab.cursorLine && `:${collab.cursorLine}`}
                  </span>
                )}
              </div>
              {collab.status === 'away' && (
                <Badge variant="outline" className="text-[7px] h-3.5 px-1 text-amber-400 border-amber-500/30">
                  Away
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>

      <Separator className="shrink-0" />

      {/* Live cursors */}
      {activeEditors.length > 0 && (
        <>
          <div className="shrink-0 px-4 py-2">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <MousePointer2 className="h-2.5 w-2.5" />
              Live Cursors
            </span>
          </div>
          <div className="shrink-0 px-3 pb-2">
            <div className="space-y-1">
              {activeEditors.filter((c) => c.id !== 'me').map((collab) => (
                <div key={collab.id} className="flex items-center gap-2 p-1.5 rounded-md bg-muted/20">
                  <Avatar className="h-4 w-4">
                    <AvatarFallback className={`${collab.color} text-[6px] text-white`}>
                      {collab.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[9px]">{collab.name}</span>
                  <Eye className="h-2.5 w-2.5 text-muted-foreground ml-auto" />
                  <span className="text-[8px] text-muted-foreground font-mono">
                    {collab.currentFile}:{collab.cursorLine}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <Separator className="shrink-0" />
        </>
      )}

      {/* Tab toggle */}
      <div className="shrink-0 flex border-b border-border/30">
        <button
          onClick={() => setActiveTab('activity')}
          className={`flex-1 px-4 py-2 text-[10px] font-medium transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'activity'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Clock className="h-3 w-3" />
          Activity
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 px-4 py-2 text-[10px] font-medium transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'chat'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <MessageSquare className="h-3 w-3" />
          Team Chat
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0">
        {activeTab === 'activity' ? (
          <ScrollArea className="h-full">
            <div className="p-3 space-y-2">
              {activities.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <p className="text-[10px]">No activity yet</p>
                </div>
              ) : null}
              {activities.map((item, i) => {
                const user = getCollaborator(item.userId);
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/20 transition-colors"
                  >
                    <Avatar className="h-5 w-5 shrink-0 mt-0.5">
                      <AvatarFallback className={`${user?.color} text-[7px] text-white`}>
                        {user?.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px]">
                        <span className="font-medium">{user?.name}</span>{' '}
                        <span className="text-muted-foreground">{item.action}</span>{' '}
                        <span className="font-mono text-amber-400">{item.target}</span>
                      </p>
                      <span className="text-[8px] text-muted-foreground">{item.time}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col h-full">
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-3 space-y-3">
                {chatMessages.map((msg, i) => {
                  const user = getCollaborator(msg.userId);
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`flex gap-2 ${msg.isSelf ? 'flex-row-reverse' : ''}`}
                    >
                      <Avatar className="h-5 w-5 shrink-0 mt-0.5">
                        <AvatarFallback className={`${user?.color} text-[7px] text-white`}>
                          {user?.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`max-w-[80%] ${msg.isSelf ? 'text-right' : ''}`}>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {!msg.isSelf && (
                            <span className="text-[9px] font-medium">{user?.name}</span>
                          )}
                          <span className="text-[7px] text-muted-foreground">{msg.time}</span>
                        </div>
                        <div
                          className={`inline-block px-2.5 py-1.5 rounded-lg text-[10px] ${
                            msg.isSelf
                              ? 'bg-emerald-500/15 text-emerald-200'
                              : 'bg-muted/50 text-foreground'
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
            </ScrollArea>
            <div className="shrink-0 p-2 border-t border-border/30">
              <div className="flex gap-1.5">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  className="h-7 text-[10px] bg-card/50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendChat();
                    }
                  }}
                />
                <Button
                  size="sm"
                  className="h-7 w-7 px-0 shrink-0"
                  onClick={handleSendChat}
                  disabled={!chatInput.trim()}
                >
                  <Send className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
