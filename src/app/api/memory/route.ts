import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List memories FROM DATABASE (with optional category filter)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const where: Record<string, unknown> = {};
    if (category) where.category = category;

    const memories = await db.memory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      memories,
      total: memories.length,
      categories: [...new Set(memories.map((m) => m.category))],
    });
  } catch (error) {
    console.error('Memory GET error:', error);
    return NextResponse.json(
      { error: 'Failed to list memories' },
      { status: 500 }
    );
  }
}

// POST - Create memory
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, content, source } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const memory = await db.memory.create({
      data: {
        category: category || 'preference',
        content,
        source: source || null,
      },
    });

    // Log activity
    await db.activity.create({
      data: {
        action: 'memory_create',
        entity: 'Memory',
        entityId: memory.id,
        description: `Created memory in category: ${memory.category}`,
        metadata: JSON.stringify({ category: memory.category }),
      },
    });

    return NextResponse.json({
      memory,
      message: 'Memory created',
    }, { status: 201 });
  } catch (error) {
    console.error('Memory POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create memory' },
      { status: 500 }
    );
  }
}

// DELETE - Delete memory
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { memoryId } = body;

    if (!memoryId) {
      return NextResponse.json(
        { error: 'memoryId is required' },
        { status: 400 }
      );
    }

    const existing = await db.memory.findUnique({
      where: { id: memoryId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: `Memory '${memoryId}' not found` },
        { status: 404 }
      );
    }

    await db.memory.delete({
      where: { id: memoryId },
    });

    return NextResponse.json({
      success: true,
      message: 'Memory deleted',
    });
  } catch (error) {
    console.error('Memory DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete memory' },
      { status: 500 }
    );
  }
}
