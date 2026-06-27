export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Default AI rules — seeded only when DB is empty
const DEFAULT_RULES = [
  {
    name: 'TypeScript Strict Mode',
    content: 'Always use strict TypeScript with proper types. Avoid any, use unknown when type is truly unknown. Define interfaces for all data structures.',
    isPreset: true,
  },
  {
    name: 'Error Handling',
    content: 'All async operations must be wrapped in try/catch. Provide meaningful error messages. Log errors with context. Never silently swallow errors.',
    isPreset: true,
  },
  {
    name: 'Database Operations',
    content: 'Use Prisma ORM for all database operations. Use transactions for multi-step operations. Always handle connection errors gracefully. Close connections properly.',
    isPreset: true,
  },
  {
    name: 'Security First',
    content: 'Never expose API keys or secrets in client-side code. Validate all user inputs. Use parameterized queries. Implement rate limiting on public endpoints.',
    isPreset: true,
  },
  {
    name: 'Code Style',
    content: 'Follow ES6+ import/export syntax. Use const over let. Prefer immutability. Use descriptive variable names. Keep functions small and focused.',
    isPreset: true,
  },
];

// GET - List AI rules FROM DATABASE
export async function GET(request: NextRequest) {
  try {
    let rules = await db.aiRule.findMany({
      orderBy: { createdAt: 'asc' },
    });

    // Seed default rules if none exist
    if (rules.length === 0) {
      for (const r of DEFAULT_RULES) {
        await db.aiRule.create({ data: r });
      }
      rules = await db.aiRule.findMany({
        orderBy: { createdAt: 'asc' },
      });
    }

    return NextResponse.json({
      rules,
      total: rules.length,
      enabled: rules.filter((r) => r.enabled).length,
    });
  } catch (error) {
    console.error('Rules GET error:', error);
    return NextResponse.json(
      { error: 'Failed to list AI rules' },
      { status: 500 }
    );
  }
}

// POST - Create AI rule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, content } = body;

    if (!name || !content) {
      return NextResponse.json(
        { error: 'Name and content are required' },
        { status: 400 }
      );
    }

    const rule = await db.aiRule.create({
      data: {
        name,
        content,
        isPreset: false,
      },
    });

    // Log activity
    await db.activity.create({
      data: {
        action: 'rule_create',
        entity: 'AiRule',
        entityId: rule.id,
        description: `Created AI rule: ${name}`,
        metadata: JSON.stringify({ name }),
      },
    });

    return NextResponse.json({
      rule,
      message: 'AI rule created',
    }, { status: 201 });
  } catch (error) {
    console.error('Rules POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create AI rule' },
      { status: 500 }
    );
  }
}

// PUT - Update AI rule
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { ruleId, enabled, content } = body;

    if (!ruleId) {
      return NextResponse.json(
        { error: 'ruleId is required' },
        { status: 400 }
      );
    }

    const existing = await db.aiRule.findUnique({
      where: { id: ruleId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: `Rule '${ruleId}' not found` },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = {};
    if (enabled !== undefined) data.enabled = enabled;
    if (content !== undefined) data.content = content;

    const rule = await db.aiRule.update({
      where: { id: ruleId },
      data,
    });

    return NextResponse.json({
      rule,
      message: 'AI rule updated',
    });
  } catch (error) {
    console.error('Rules PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update AI rule' },
      { status: 500 }
    );
  }
}

// DELETE - Delete AI rule (only non-preset)
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ruleId } = body;

    if (!ruleId) {
      return NextResponse.json(
        { error: 'ruleId is required' },
        { status: 400 }
      );
    }

    const existing = await db.aiRule.findUnique({
      where: { id: ruleId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: `Rule '${ruleId}' not found` },
        { status: 404 }
      );
    }

    if (existing.isPreset) {
      return NextResponse.json(
        { error: 'Cannot delete preset rules. Disable them instead.' },
        { status: 403 }
      );
    }

    await db.aiRule.delete({
      where: { id: ruleId },
    });

    return NextResponse.json({
      success: true,
      message: `Rule '${existing.name}' deleted`,
    });
  } catch (error) {
    console.error('Rules DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete AI rule' },
      { status: 500 }
    );
  }
}
