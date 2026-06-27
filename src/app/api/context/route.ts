export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List codebase context FROM DATABASE, optionally include knowledge
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'knowledge' for knowledge base

    if (type === 'knowledge') {
      const knowledge = await db.knowledge.findMany({
        orderBy: { updatedAt: 'desc' },
      });

      return NextResponse.json({
        knowledge,
        total: knowledge.length,
      });
    }

    // Default: return codebase context
    const contexts = await db.codebaseContext.findMany({
      orderBy: { lastIndexedAt: 'desc' },
    });

    return NextResponse.json({
      contexts,
      total: contexts.length,
    });
  } catch (error) {
    console.error('Context GET error:', error);
    return NextResponse.json(
      { error: 'Failed to list context' },
      { status: 500 }
    );
  }
}

// POST - Add file to context or knowledge
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const type = body.type; // 'knowledge' for knowledge base

    if (type === 'knowledge') {
      const { topic, content } = body;

      if (!topic || !content) {
        return NextResponse.json(
          { error: 'Topic and content are required for knowledge entries' },
          { status: 400 }
        );
      }

      // Upsert — update if topic already exists
      const knowledge = await db.knowledge.upsert({
        where: { topic },
        update: { content },
        create: { topic, content },
      });

      return NextResponse.json({
        knowledge,
        message: 'Knowledge entry saved',
      }, { status: 201 });
    }

    // Default: add file to codebase context
    const { filePath, language, relevance } = body;

    if (!filePath) {
      return NextResponse.json(
        { error: 'filePath is required' },
        { status: 400 }
      );
    }

    const context = await db.codebaseContext.create({
      data: {
        filePath,
        language: language || null,
        relevance: relevance || 0,
        lastIndexedAt: new Date(),
      },
    });

    return NextResponse.json({
      context,
      message: 'File added to context',
    }, { status: 201 });
  } catch (error) {
    console.error('Context POST error:', error);
    return NextResponse.json(
      { error: 'Failed to add context entry' },
      { status: 500 }
    );
  }
}

// DELETE - Remove from context
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, type } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    if (type === 'knowledge') {
      const existing = await db.knowledge.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json(
          { error: `Knowledge entry '${id}' not found` },
          { status: 404 }
        );
      }
      await db.knowledge.delete({ where: { id } });
      return NextResponse.json({
        success: true,
        message: 'Knowledge entry deleted',
      });
    }

    // Default: delete codebase context
    const existing = await db.codebaseContext.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: `Context entry '${id}' not found` },
        { status: 404 }
      );
    }
    await db.codebaseContext.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'Context entry deleted',
    });
  } catch (error) {
    console.error('Context DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete context entry' },
      { status: 500 }
    );
  }
}
