import { NextRequest, NextResponse } from 'next/server';

// Simulated collaborators
interface Collaborator {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'away' | 'offline';
  cursor: { file: string; line: number } | null;
  color: string;
}

interface SharedSession {
  id: string;
  name: string;
  createdBy: string;
  participants: string[];
  activeFile: string;
  createdAt: string;
  expiresAt: string;
}

const collaborators: Collaborator[] = [
  { id: "user-1", name: "Alex Chen", avatar: "AC", status: "online", cursor: { file: "chat-panel.tsx", line: 42 }, color: "#10b981" },
  { id: "user-2", name: "Sam Rivera", avatar: "SR", status: "away", cursor: null, color: "#f59e0b" },
  { id: "user-3", name: "Jordan Lee", avatar: "JL", status: "online", cursor: { file: "api/route.ts", line: 15 }, color: "#8b5cf6" },
];

const sharedSessions: SharedSession[] = [
  {
    id: "session-1",
    name: "MCP Integration Sprint",
    createdBy: "user-1",
    participants: ["user-1", "user-2"],
    activeFile: "src/app/api/mcp/route.ts",
    createdAt: "2026-06-26T10:00:00Z",
    expiresAt: "2026-06-26T18:00:00Z",
  },
  {
    id: "session-2",
    name: "Voice Code Review",
    createdBy: "user-3",
    participants: ["user-3"],
    activeFile: "src/app/api/voice/route.ts",
    createdAt: "2026-06-26T09:30:00Z",
    expiresAt: "2026-06-26T12:00:00Z",
  },
];

// Track active invites
const activeInvites: Array<{
  id: string;
  sessionId: string;
  invitedBy: string;
  email: string;
  role: string;
  createdAt: string;
}> = [];

// GET - List active collaborators and shared sessions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const include = searchParams.get('include'); // 'collaborators', 'sessions', 'invites', or null for all

    const response: Record<string, unknown> = {};

    if (!include || include === 'collaborators') {
      response.collaborators = collaborators.map((c) => ({
        ...c,
        lastActive: c.status === 'online' ? 'Just now' : c.status === 'away' ? '5 min ago' : '2 hours ago',
      }));
    }

    if (!include || include === 'sessions') {
      response.sessions = sharedSessions.map((s) => ({
        ...s,
        participantCount: s.participants.length,
        isActive: new Date(s.expiresAt) > new Date(),
      }));
    }

    if (!include || include === 'invites') {
      response.invites = activeInvites;
    }

    response.meta = {
      onlineCount: collaborators.filter((c) => c.status === 'online').length,
      totalCollaborators: collaborators.length,
      activeSessions: sharedSessions.filter((s) => new Date(s.expiresAt) > new Date()).length,
      pendingInvites: activeInvites.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Collab GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get collaboration data' },
      { status: 500 }
    );
  }
}

// POST - Create a sharing link / invite collaborator
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sessionId, email, role, name, sessionName } = body;

    if (action === 'invite') {
      // Invite a collaborator by email
      if (!email) {
        return NextResponse.json(
          { error: 'Email is required for invite action' },
          { status: 400 }
        );
      }

      const inviteId = `invite-${Date.now()}`;
      const invite = {
        id: inviteId,
        sessionId: sessionId || 'session-1',
        invitedBy: 'current-user',
        email,
        role: role || 'editor',
        createdAt: new Date().toISOString(),
      };

      activeInvites.push(invite);

      return NextResponse.json({
        success: true,
        message: `Invitation sent to ${email}`,
        invite,
        shareLink: `https://massive-number.dev/collab/${inviteId}`,
      }, { status: 201 });
    }

    if (action === 'create-session') {
      // Create a new shared session
      if (!sessionName) {
        return NextResponse.json(
          { error: 'Session name is required for create-session action' },
          { status: 400 }
        );
      }

      const newSession: SharedSession = {
        id: `session-${Date.now()}`,
        name: sessionName,
        createdBy: 'current-user',
        participants: ['current-user'],
        activeFile: 'src/app/page.tsx',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      };

      sharedSessions.push(newSession);

      return NextResponse.json({
        success: true,
        message: `Session "${sessionName}" created`,
        session: newSession,
      }, { status: 201 });
    }

    if (action === 'share-link') {
      // Generate a sharing link for current session
      const shareId = `share-${Date.now()}`;
      return NextResponse.json({
        success: true,
        shareLink: `https://massive-number.dev/share/${shareId}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        permissions: role || 'view',
      });
    }

    if (action === 'update-cursor') {
      // Update collaborator cursor position
      const { userId, file, line } = body;
      if (!userId || !file || !line) {
        return NextResponse.json(
          { error: 'userId, file, and line are required for update-cursor action' },
          { status: 400 }
        );
      }
      const collaborator = collaborators.find((c) => c.id === userId);
      if (collaborator) {
        collaborator.cursor = { file, line };
      }
      return NextResponse.json({
        success: true,
        cursor: { file, line },
      });
    }

    return NextResponse.json(
      { error: `Unknown action: ${action}. Supported: invite, create-session, share-link, update-cursor` },
      { status: 400 }
    );
  } catch (error) {
    console.error('Collab POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process collaboration action' },
      { status: 500 }
    );
  }
}

// DELETE - Remove collaborator or session
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, id } = body;

    if (!type || !id) {
      return NextResponse.json(
        { error: 'type (collaborator|session|invite) and id are required' },
        { status: 400 }
      );
    }

    if (type === 'collaborator') {
      const idx = collaborators.findIndex((c) => c.id === id);
      if (idx === -1) {
        return NextResponse.json(
          { error: `Collaborator '${id}' not found` },
          { status: 404 }
        );
      }
      const removed = collaborators.splice(idx, 1)[0];
      return NextResponse.json({
        success: true,
        message: `Collaborator '${removed.name}' removed`,
        removed,
      });
    }

    if (type === 'session') {
      const idx = sharedSessions.findIndex((s) => s.id === id);
      if (idx === -1) {
        return NextResponse.json(
          { error: `Session '${id}' not found` },
          { status: 404 }
        );
      }
      const removed = sharedSessions.splice(idx, 1)[0];
      return NextResponse.json({
        success: true,
        message: `Session '${removed.name}' removed`,
        removed,
      });
    }

    if (type === 'invite') {
      const idx = activeInvites.findIndex((i) => i.id === id);
      if (idx === -1) {
        return NextResponse.json(
          { error: `Invite '${id}' not found` },
          { status: 404 }
        );
      }
      const removed = activeInvites.splice(idx, 1)[0];
      return NextResponse.json({
        success: true,
        message: `Invite to '${removed.email}' revoked`,
        removed,
      });
    }

    return NextResponse.json(
      { error: `Unknown type: ${type}. Supported: collaborator, session, invite` },
      { status: 400 }
    );
  } catch (error) {
    console.error('Collab DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to remove collaboration resource' },
      { status: 500 }
    );
  }
}
