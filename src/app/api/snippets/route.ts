import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List snippets FROM DATABASE
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language');
    const favorite = searchParams.get('favorite') === 'true';

    const where: Record<string, unknown> = {};
    if (language) where.language = language;
    if (favorite) where.favorite = true;

    const snippets = await db.snippet.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      snippets,
      total: snippets.length,
      languages: [...new Set(snippets.map((s) => s.language))],
    });
  } catch (error) {
    console.error('Snippets GET error:', error);
    return NextResponse.json(
      { error: 'Failed to list snippets' },
      { status: 500 }
    );
  }
}

// POST - Create snippet
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, language, description, code } = body;

    if (!name || !language || !code) {
      return NextResponse.json(
        { error: 'Name, language, and code are required' },
        { status: 400 }
      );
    }

    const snippet = await db.snippet.create({
      data: {
        name,
        language,
        description: description || null,
        code,
        isPreset: false,
      },
    });

    // Log activity
    await db.activity.create({
      data: {
        action: 'snippet_create',
        entity: 'Snippet',
        entityId: snippet.id,
        description: `Created snippet: ${name} (${language})`,
        metadata: JSON.stringify({ name, language }),
      },
    });

    return NextResponse.json({
      snippet,
      message: 'Snippet created',
    }, { status: 201 });
  } catch (error) {
    console.error('Snippets POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create snippet' },
      { status: 500 }
    );
  }
}

// PUT - Update snippet
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { snippetId, ...updates } = body;

    if (!snippetId) {
      return NextResponse.json(
        { error: 'snippetId is required' },
        { status: 400 }
      );
    }

    const existing = await db.snippet.findUnique({
      where: { id: snippetId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: `Snippet '${snippetId}' not found` },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = {};
    if (updates.name !== undefined) data.name = updates.name;
    if (updates.language !== undefined) data.language = updates.language;
    if (updates.description !== undefined) data.description = updates.description;
    if (updates.code !== undefined) data.code = updates.code;
    if (updates.favorite !== undefined) data.favorite = updates.favorite;

    const snippet = await db.snippet.update({
      where: { id: snippetId },
      data,
    });

    return NextResponse.json({
      snippet,
      message: 'Snippet updated',
    });
  } catch (error) {
    console.error('Snippets PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update snippet' },
      { status: 500 }
    );
  }
}

// DELETE - Delete snippet
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { snippetId } = body;

    if (!snippetId) {
      return NextResponse.json(
        { error: 'snippetId is required' },
        { status: 400 }
      );
    }

    const existing = await db.snippet.findUnique({
      where: { id: snippetId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: `Snippet '${snippetId}' not found` },
        { status: 404 }
      );
    }

    await db.snippet.delete({
      where: { id: snippetId },
    });

    return NextResponse.json({
      success: true,
      message: `Snippet '${existing.name}' deleted`,
    });
  } catch (error) {
    console.error('Snippets DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete snippet' },
      { status: 500 }
    );
  }
}
