import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// GET - List all chat folders
export async function GET() {
  try {
    const folders = await db.chatFolder.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { chats: true },
        },
      },
    });

    return NextResponse.json({ folders });
  } catch (error) {
    console.error('ChatFolders GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve chat folders' },
      { status: 500 }
    );
  }
}

// POST - Create folder
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, color, icon } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Folder name is required' },
        { status: 400 }
      );
    }

    // Get the next sort order
    const maxSortOrder = await db.chatFolder.aggregate({
      _max: { sortOrder: true },
    });
    const sortOrder = (maxSortOrder._max.sortOrder ?? -1) + 1;

    const folder = await db.chatFolder.create({
      data: {
        name,
        color: color || '#10b981',
        icon: icon || null,
        sortOrder,
      },
    });

    return NextResponse.json({ folder }, { status: 201 });
  } catch (error) {
    console.error('ChatFolders POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    );
  }
}

// PUT - Update folder
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { folderId, name, color, icon, sortOrder } = body;

    if (!folderId) {
      return NextResponse.json(
        { error: 'folderId is required' },
        { status: 400 }
      );
    }

    // Check if folder exists
    const existing = await db.chatFolder.findUnique({ where: { id: folderId } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Folder not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Prisma.ChatFolderUpdateInput = {};
    if (name !== undefined) updateData.name = name;
    if (color !== undefined) updateData.color = color;
    if (icon !== undefined) updateData.icon = icon;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    const folder = await db.chatFolder.update({
      where: { id: folderId },
      data: updateData,
    });

    return NextResponse.json({ folder });
  } catch (error) {
    console.error('ChatFolders PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update folder' },
      { status: 500 }
    );
  }
}

// DELETE - Delete folder (move chats to uncategorized)
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { folderId } = body;

    if (!folderId) {
      return NextResponse.json(
        { error: 'folderId is required' },
        { status: 400 }
      );
    }

    // Check if folder exists
    const existing = await db.chatFolder.findUnique({ where: { id: folderId } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Folder not found' },
        { status: 404 }
      );
    }

    // Move all chats in this folder to uncategorized (set folderId to null)
    await db.chat.updateMany({
      where: { folderId },
      data: { folderId: null },
    });

    // Delete the folder
    await db.chatFolder.delete({ where: { id: folderId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('ChatFolders DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete folder' },
      { status: 500 }
    );
  }
}
