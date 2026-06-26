import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// GET - List all chat histories with pagination, search, and filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default';
    const search = searchParams.get('search') || '';
    const folderId = searchParams.get('folderId') || undefined;
    const model = searchParams.get('model') || undefined;
    const dateRange = searchParams.get('dateRange') || 'all'; // today, week, month, all
    const pinnedOnly = searchParams.get('pinned') === 'true';
    const archivedOnly = searchParams.get('archived') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const sortByParam = searchParams.get('sortBy') || 'updatedAt'; // updatedAt, createdAt, messageCount
    const sortBy = sortByParam === 'createdAt' ? 'createdAt' : sortByParam === 'messageCount' ? 'messageCount' : 'updatedAt';

    // Build where clause
    const where: Prisma.ChatWhereInput = {
      userId,
    };

    // Archived filter: default shows non-archived, archivedOnly shows archived
    if (archivedOnly) {
      where.archived = true;
    } else if (!pinnedOnly) {
      // Show non-archived by default unless specifically filtering for archived
      // When pinnedOnly, show pinned regardless of archive status
      where.archived = false;
    }

    if (folderId) {
      where.folderId = folderId === 'uncategorized' ? null : folderId;
    }

    if (model) {
      where.model = model;
    }

    if (pinnedOnly) {
      where.pinned = true;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { messages: { some: { content: { contains: search } } } },
      ];
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }
      where.updatedAt = { gte: startDate };
    }

    // Get chats and total count
    const [chats, total] = await Promise.all([
      db.chat.findMany({
        where,
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 3, // Get first few messages for preview
          },
          folder: true,
          _count: {
            select: { messages: true },
          },
        },
        orderBy: [
          { pinned: 'desc' },
          ...(sortBy === 'messageCount'
            ? []
            : [{ [sortBy]: 'desc' as const }]),
        ],
        take: limit,
        skip: offset,
      }),
      db.chat.count({ where }),
    ]);

    // Get folders
    const folders = await db.chatFolder.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { chats: { where: { userId, archived: false } } },
        },
      },
    });

    // Sort by messageCount in JS if needed
    let sortedChats = chats;
    if (sortBy === 'messageCount') {
      sortedChats = [...chats].sort((a, b) => b._count.messages - a._count.messages);
    }

    return NextResponse.json({
      chats: sortedChats.map((chat) => ({
        id: chat.id,
        title: chat.title,
        model: chat.model,
        mode: chat.mode,
        persona: chat.persona,
        folderId: chat.folderId,
        folder: chat.folder ? { id: chat.folder.id, name: chat.folder.name, color: chat.folder.color } : null,
        pinned: chat.pinned,
        archived: chat.archived,
        messageCount: chat._count.messages,
        preview: chat.messages[0]?.content?.slice(0, 200) || null,
        previewMessages: chat.messages.slice(0, 3).map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content.slice(0, 150),
          createdAt: m.createdAt,
        })),
        projectId: chat.projectId,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      })),
      folders,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('History GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve chat history' },
      { status: 500 }
    );
  }
}

// PUT - Update chat (rename, move to folder, pin/archive)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { chatId, title, folderId, pinned, archived } = body;

    if (!chatId) {
      return NextResponse.json(
        { error: 'chatId is required' },
        { status: 400 }
      );
    }

    // Check if chat exists
    const existing = await db.chat.findUnique({ where: { id: chatId } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Prisma.ChatUpdateInput = {};
    if (title !== undefined) updateData.title = title;
    if (folderId !== undefined) updateData.folder = folderId ? { connect: { id: folderId } } : { disconnect: true };
    if (pinned !== undefined) updateData.pinned = pinned;
    if (archived !== undefined) updateData.archived = archived;

    const chat = await db.chat.update({
      where: { id: chatId },
      data: updateData,
      include: {
        folder: true,
        _count: { select: { messages: true } },
      },
    });

    return NextResponse.json({ chat });
  } catch (error) {
    console.error('History PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update chat' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a chat and all its messages
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { chatId } = body;

    if (!chatId) {
      return NextResponse.json(
        { error: 'chatId is required' },
        { status: 400 }
      );
    }

    // Check if chat exists
    const existing = await db.chat.findUnique({ where: { id: chatId } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }

    // Delete chat (cascades to messages)
    await db.chat.delete({ where: { id: chatId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('History DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete chat' },
      { status: 500 }
    );
  }
}
