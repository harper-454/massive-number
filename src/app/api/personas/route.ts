export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Default personas — seeded only when DB is empty
const DEFAULT_PERSONAS = [
  {
    name: 'Planner',
    icon: '📋',
    description: 'Focuses on architecture, requirements, and breaking down tasks into structured plans',
    systemPrompt: 'You are a Planner persona. Focus on understanding requirements, designing architecture, and creating detailed implementation plans. Break complex tasks into clear, actionable steps. Consider edge cases and dependencies.',
    focus: 'Architecture & Planning',
    isPreset: true,
  },
  {
    name: 'Builder',
    icon: '🔨',
    description: 'Focuses on writing clean, efficient code and implementing features',
    systemPrompt: 'You are a Builder persona. Focus on writing clean, efficient, and well-typed code. Implement features following best practices and established patterns. Write production-ready code with proper error handling.',
    focus: 'Implementation & Coding',
    isPreset: true,
  },
  {
    name: 'Reviewer',
    icon: '🔍',
    description: 'Focuses on code review, quality assurance, and finding potential issues',
    systemPrompt: 'You are a Reviewer persona. Focus on code quality, security, performance, and maintainability. Identify potential bugs, security vulnerabilities, and performance bottlenecks. Suggest improvements with clear reasoning.',
    focus: 'Quality & Review',
    isPreset: true,
  },
  {
    name: 'Iterator',
    icon: '🔄',
    description: 'Focuses on refactoring, optimization, and iterative improvement',
    systemPrompt: 'You are an Iterator persona. Focus on refactoring code for clarity and efficiency. Optimize performance, reduce complexity, and improve code organization. Make incremental improvements that compound over time.',
    focus: 'Refactoring & Optimization',
    isPreset: true,
  },
];

// GET - List personas FROM DATABASE
export async function GET(request: NextRequest) {
  try {
    let personas = await db.persona.findMany({
      orderBy: { createdAt: 'asc' },
    });

    // Seed default personas if none exist
    if (personas.length === 0) {
      for (const p of DEFAULT_PERSONAS) {
        await db.persona.create({ data: p });
      }
      personas = await db.persona.findMany({
        orderBy: { createdAt: 'asc' },
      });
    }

    return NextResponse.json({
      personas,
      total: personas.length,
    });
  } catch (error) {
    console.error('Personas GET error:', error);
    return NextResponse.json(
      { error: 'Failed to list personas' },
      { status: 500 }
    );
  }
}

// POST - Create persona
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, icon, description, systemPrompt, focus } = body;

    if (!name || !systemPrompt) {
      return NextResponse.json(
        { error: 'Name and systemPrompt are required' },
        { status: 400 }
      );
    }

    const persona = await db.persona.create({
      data: {
        name,
        icon: icon || '🤖',
        description: description || null,
        systemPrompt,
        focus: focus || null,
        isPreset: false,
      },
    });

    // Log activity
    await db.activity.create({
      data: {
        action: 'persona_create',
        entity: 'Persona',
        entityId: persona.id,
        description: `Created persona: ${name}`,
        metadata: JSON.stringify({ name, focus }),
      },
    });

    return NextResponse.json({
      persona,
      message: 'Persona created',
    }, { status: 201 });
  } catch (error) {
    console.error('Personas POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create persona' },
      { status: 500 }
    );
  }
}

// PUT - Update persona
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { personaId, ...updates } = body;

    if (!personaId) {
      return NextResponse.json(
        { error: 'personaId is required' },
        { status: 400 }
      );
    }

    const existing = await db.persona.findUnique({
      where: { id: personaId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: `Persona '${personaId}' not found` },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = {};
    if (updates.name !== undefined) data.name = updates.name;
    if (updates.icon !== undefined) data.icon = updates.icon;
    if (updates.description !== undefined) data.description = updates.description;
    if (updates.systemPrompt !== undefined) data.systemPrompt = updates.systemPrompt;
    if (updates.focus !== undefined) data.focus = updates.focus;
    if (updates.enabled !== undefined) data.enabled = updates.enabled;

    const persona = await db.persona.update({
      where: { id: personaId },
      data,
    });

    return NextResponse.json({
      persona,
      message: 'Persona updated',
    });
  } catch (error) {
    console.error('Personas PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update persona' },
      { status: 500 }
    );
  }
}

// DELETE - Delete persona (only non-preset)
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { personaId } = body;

    if (!personaId) {
      return NextResponse.json(
        { error: 'personaId is required' },
        { status: 400 }
      );
    }

    const existing = await db.persona.findUnique({
      where: { id: personaId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: `Persona '${personaId}' not found` },
        { status: 404 }
      );
    }

    if (existing.isPreset) {
      return NextResponse.json(
        { error: 'Cannot delete preset personas. Disable them instead.' },
        { status: 403 }
      );
    }

    await db.persona.delete({
      where: { id: personaId },
    });

    return NextResponse.json({
      success: true,
      message: `Persona '${existing.name}' deleted`,
    });
  } catch (error) {
    console.error('Personas DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete persona' },
      { status: 500 }
    );
  }
}
