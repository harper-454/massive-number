export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Return collaborators FROM DATABASE
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const include = searchParams.get('include'); // 'collaborators', 'sessions', or null for all

    const response: Record<string, unknown> = {};

    if (!include || include === 'collaborators') {
      const collaborators = await db.collaborator.findMany({
        orderBy: { updatedAt: 'desc' },
      });

      response.collaborators = collaborators.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        avatar: c.avatar || c.name.split(' ').map((n) => n[0]).join('').toUpperCase(),
        status: c.status,
        cursor: c.cursorFile ? { file: c.cursorFile, line: c.cursorLine || 0 } : null,
        color: c.color,
        sessionId: c.sessionId,
        lastActive: c.updatedAt,
      }));
    }

    if (!include || include === 'sessions') {
      // Group collaborators by sessionId
      const collaborators = await db.collaborator.findMany();
      const sessionMap = new Map<string, typeof collaborators>();

      for (const c of collaborators) {
        if (c.sessionId) {
          if (!sessionMap.has(c.sessionId)) {
            sessionMap.set(c.sessionId, []);
          }
          sessionMap.get(c.sessionId)!.push(c);
        }
      }

      response.sessions = Array.from(sessionMap.entries()).map(([sessionId, participants]) => ({
        id: sessionId,
        name: `Session ${sessionId.slice(0, 8)}`,
        participants: participants.map((p) => p.id),
        participantCount: participants.length,
        activeFile: participants[0]?.cursorFile || null,
        isActive: true,
        createdAt: participants[0]?.createdAt,
      }));
    }

    const allCollaborators = await db.collaborator.findMany();
    response.meta = {
      onlineCount: allCollaborators.filter((c) => c.status === 'online').length,
      totalCollaborators: allCollaborators.length,
      activeSessions: new Set(allCollaborators.filter((c) => c.sessionId).map((c) => c.sessionId)).size,
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

// POST - Add collaborator or create session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, name, email, sessionId } = body;

    if (action === 'invite' || action === 'add') {
      if (!name) {
        return NextResponse.json(
          { error: 'Name is required for adding a collaborator' },
          { status: 400 }
        );
      }

      const collaborator = await db.collaborator.create({
        data: {
          name,
          email: email || null,
          status: 'offline',
          color: `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`,
          sessionId: sessionId || null,
        },
      });

      // Log activity
      await db.activity.create({
        data: {
          action: 'collab_invite',
          entity: 'Collaborator',
          entityId: collaborator.id,
          description: `Invited collaborator: ${name}`,
          metadata: JSON.stringify({ email, sessionId }),
        },
      });

      return NextResponse.json({
        success: true,
        message: `Collaborator "${name}" added successfully`,
        collaborator: {
          id: collaborator.id,
          name: collaborator.name,
          email: collaborator.email,
          status: collaborator.status,
          color: collaborator.color,
          sessionId: collaborator.sessionId,
        },
      }, { status: 201 });
    }

    if (action === 'create-session') {
      if (!sessionId) {
        return NextResponse.json(
          { error: 'sessionId is required for create-session action' },
          { status: 400 }
        );
      }

      // sessionId is just stored on collaborators — create one by adding a placeholder
      return NextResponse.json({
        success: true,
        message: `Session created`,
        sessionId,
      }, { status: 201 });
    }

    if (action === 'update-cursor') {
      const { collaboratorId, file, line } = body;
      if (!collaboratorId || !file) {
        return NextResponse.json(
          { error: 'collaboratorId and file are required for update-cursor action' },
          { status: 400 }
        );
      }

      const updated = await db.collaborator.update({
        where: { id: collaboratorId },
        data: {
          cursorFile: file,
          cursorLine: line || null,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        cursor: { file, line },
      });
    }

    return NextResponse.json(
      { error: `Unknown action: ${action}. Supported: invite, add, create-session, update-cursor` },
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

// DELETE - Remove collaborator
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { collaboratorId } = body;

    if (!collaboratorId) {
      return NextResponse.json(
        { error: 'collaboratorId is required' },
        { status: 400 }
      );
    }

    const collaborator = await db.collaborator.findUnique({
      where: { id: collaboratorId },
    });

    if (!collaborator) {
      return NextResponse.json(
        { error: `Collaborator '${collaboratorId}' not found` },
        { status: 404 }
      );
    }

    await db.collaborator.delete({
      where: { id: collaboratorId },
    });

    // Log activity
    await db.activity.create({
      data: {
        action: 'collab_remove',
        entity: 'Collaborator',
        entityId: collaboratorId,
        description: `Removed collaborator: ${collaborator.name}`,
        metadata: JSON.stringify({ name: collaborator.name }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Collaborator '${collaborator.name}' removed`,
    });
  } catch (error) {
    console.error('Collab DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to remove collaborator' },
      { status: 500 }
    );
  }
}
