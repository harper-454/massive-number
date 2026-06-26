import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// GET - List library items with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || undefined;
    const category = searchParams.get('category') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || '';
    const userId = searchParams.get('userId') || 'default';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build where clause
    const where: Prisma.LibraryItemWhereInput = {
      userId,
    };

    if (type) where.type = type;
    if (category) where.category = category;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Get items and total
    const [items, total] = await Promise.all([
      db.libraryItem.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.libraryItem.count({ where }),
    ]);

    // Get stats by type
    const byTypeRaw = await db.libraryItem.groupBy({
      by: ['type'],
      where: { userId },
      _count: { type: true },
    });
    const byType: Record<string, number> = {};
    for (const row of byTypeRaw) {
      byType[row.type] = row._count.type;
    }

    // Get stats by category
    const byCategoryRaw = await db.libraryItem.groupBy({
      by: ['category'],
      where: { userId },
      _count: { category: true },
    });
    const byCategory: Record<string, number> = {};
    for (const row of byCategoryRaw) {
      byCategory[row.category] = row._count.category;
    }

    // Parse JSON fields for response
    const parsedItems = items.map((item) => ({
      ...item,
      tags: JSON.parse(item.tags),
      config: JSON.parse(item.config),
    }));

    return NextResponse.json({
      items: parsedItems,
      total,
      byType,
      byCategory,
    });
  } catch (error) {
    console.error('Library GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve library items' },
      { status: 500 }
    );
  }
}

// POST - Create library item or fork
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if this is a fork action
    if (body.action === 'fork') {
      const { id } = body;

      if (!id) {
        return NextResponse.json(
          { error: 'Item ID is required for fork' },
          { status: 400 }
        );
      }

      const original = await db.libraryItem.findUnique({ where: { id } });
      if (!original) {
        return NextResponse.json(
          { error: 'Original item not found' },
          { status: 404 }
        );
      }

      // Create a copy with parentId = original id
      const forkedItem = await db.libraryItem.create({
        data: {
          name: `${original.name} (fork)`,
          description: original.description,
          type: original.type,
          category: original.category,
          tags: original.tags,
          thumbnail: original.thumbnail,
          code: original.code,
          config: original.config,
          status: 'draft',
          version: '1.0.0',
          isPublic: false,
          parentId: original.id,
          userId: original.userId,
          projectId: original.projectId,
        },
      });

      // Increment fork count on original
      await db.libraryItem.update({
        where: { id: original.id },
        data: { forks: { increment: 1 } },
      });

      return NextResponse.json({
        item: {
          ...forkedItem,
          tags: JSON.parse(forkedItem.tags),
          config: JSON.parse(forkedItem.config),
        },
      }, { status: 201 });
    }

    // Regular create
    const { name, description, type, category, tags, code, config, thumbnail } = body;

    if (!name || !type || !category) {
      return NextResponse.json(
        { error: 'name, type, and category are required' },
        { status: 400 }
      );
    }

    const item = await db.libraryItem.create({
      data: {
        name,
        description: description || null,
        type,
        category,
        tags: JSON.stringify(tags || []),
        code: code || '',
        config: JSON.stringify(config || {}),
        thumbnail: thumbnail || null,
      },
    });

    return NextResponse.json({
      item: {
        ...item,
        tags: JSON.parse(item.tags),
        config: JSON.parse(item.config),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Library POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create library item' },
      { status: 500 }
    );
  }
}

// PUT - Update library item
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, type, category, tags, code, config, status, isPublic } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    // Check if item exists
    const existing = await db.libraryItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Prisma.LibraryItemUpdateInput = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = JSON.stringify(tags);
    if (code !== undefined) updateData.code = code;
    if (config !== undefined) updateData.config = JSON.stringify(config);
    if (status !== undefined) updateData.status = status;
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    const item = await db.libraryItem.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      item: {
        ...item,
        tags: JSON.parse(item.tags),
        config: JSON.parse(item.config),
      },
    });
  } catch (error) {
    console.error('Library PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update library item' },
      { status: 500 }
    );
  }
}

// DELETE - Delete library item
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    // Check if item exists
    const existing = await db.libraryItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    await db.libraryItem.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Library DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete library item' },
      { status: 500 }
    );
  }
}
