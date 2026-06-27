export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { isDbAvailable } from '@/lib/db-fallback';

// Helper: mask API key
function maskKey(key: string): string {
  if (!key || key.length <= 8) return '••••••••';
  return key.slice(0, 4) + '••••••••' + key.slice(-4);
}

// GET — list API keys (masked)
export async function GET(request: NextRequest) {
  try {
    const dbOk = await isDbAvailable();
    if (!dbOk) {
      return NextResponse.json({ keys: [] });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default';

    const { db } = await import('@/lib/db');
    const keys = await db.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const safeKeys = keys.map((k) => ({
      ...k,
      key: maskKey(k.key),
      models: JSON.parse(k.models),
    }));

    return NextResponse.json({ keys: safeKeys });
  } catch (error) {
    console.error('API Keys GET error:', error);
    return NextResponse.json({ keys: [] });
  }
}

// POST — add API key
export async function POST(request: NextRequest) {
  try {
    const dbOk = await isDbAvailable();
    if (!dbOk) {
      return NextResponse.json(
        { error: 'Database not available — cannot add API keys on edge runtime' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { userId = 'default', provider, label, key, baseUrl, models, isLocal } = body;

    if (!provider || !key) {
      return NextResponse.json(
        { error: 'Provider and key are required' },
        { status: 400 }
      );
    }

    const validProviders = ['openai', 'anthropic', 'google', 'deepseek', 'custom', 'lmstudio', 'ollama'];
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { error: `Invalid provider. Must be one of: ${validProviders.join(', ')}` },
        { status: 400 }
      );
    }

    const { db } = await import('@/lib/db');
    const apiKey = await db.apiKey.create({
      data: {
        userId,
        provider,
        label: label || null,
        key,
        baseUrl: baseUrl || null,
        models: JSON.stringify(models || []),
        enabled: true,
        isLocal: isLocal || false,
      },
    });

    return NextResponse.json({
      ...apiKey,
      key: maskKey(apiKey.key),
      models: JSON.parse(apiKey.models),
    }, { status: 201 });
  } catch (error) {
    console.error('API Key POST error:', error);
    return NextResponse.json(
      { error: 'Failed to add API key' },
      { status: 500 }
    );
  }
}

// PUT — update API key (enable/disable, update label, test)
export async function PUT(request: NextRequest) {
  try {
    const dbOk = await isDbAvailable();
    if (!dbOk) {
      return NextResponse.json(
        { error: 'Database not available — cannot update API keys on edge runtime' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { id, enabled, label, baseUrl, models } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'API key ID is required' },
        { status: 400 }
      );
    }

    const { db } = await import('@/lib/db');
    const existing = await db.apiKey.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (enabled !== undefined) updateData.enabled = enabled;
    if (label !== undefined) updateData.label = label;
    if (baseUrl !== undefined) updateData.baseUrl = baseUrl;
    if (models !== undefined) updateData.models = JSON.stringify(models);

    // If this is a test request, update lastUsedAt
    if (body.test) {
      updateData.lastUsedAt = new Date();
    }

    const updated = await db.apiKey.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      ...updated,
      key: maskKey(updated.key),
      models: JSON.parse(updated.models),
    });
  } catch (error) {
    console.error('API Key PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update API key' },
      { status: 500 }
    );
  }
}

// DELETE — remove API key
export async function DELETE(request: NextRequest) {
  try {
    const dbOk = await isDbAvailable();
    if (!dbOk) {
      return NextResponse.json(
        { error: 'Database not available — cannot delete API keys on edge runtime' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'API key ID is required' },
        { status: 400 }
      );
    }

    const { db } = await import('@/lib/db');
    const existing = await db.apiKey.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    await db.apiKey.delete({ where: { id } });

    return NextResponse.json({ message: 'API key deleted successfully', id });
  } catch (error) {
    console.error('API Key DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    );
  }
}
