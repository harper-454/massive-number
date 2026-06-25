import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List all provider configs
export async function GET() {
  try {
    const providers = await db.providerConfig.findMany({
      orderBy: { priority: 'desc' },
    });

    // Parse models JSON and mask API keys for security
    const safeProviders = providers.map((provider) => ({
      ...provider,
      models: JSON.parse(provider.models),
      apiKey: maskApiKey(provider.apiKey),
    }));

    return NextResponse.json({ providers: safeProviders });
  } catch (error) {
    console.error('Providers list error:', error);
    return NextResponse.json(
      { error: 'Failed to list providers' },
      { status: 500 }
    );
  }
}

// POST - Add a new provider config
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, provider, apiKey, baseUrl, models, enabled = true, priority = 0 } = body;

    if (!name || !provider || !apiKey) {
      return NextResponse.json(
        { error: 'Name, provider, and API key are required' },
        { status: 400 }
      );
    }

    // Check for duplicate name
    const existing = await db.providerConfig.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Provider config with this name already exists' },
        { status: 409 }
      );
    }

    const providerConfig = await db.providerConfig.create({
      data: {
        name,
        provider,
        apiKey,
        baseUrl: baseUrl || null,
        models: JSON.stringify(models || []),
        enabled,
        priority,
      },
    });

    return NextResponse.json({
      ...providerConfig,
      models: JSON.parse(providerConfig.models),
      apiKey: maskApiKey(providerConfig.apiKey),
    }, { status: 201 });
  } catch (error) {
    console.error('Provider create error:', error);
    return NextResponse.json(
      { error: 'Failed to create provider config' },
      { status: 500 }
    );
  }
}

// PUT - Update a provider config
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, provider, apiKey, baseUrl, models, enabled, priority } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Provider config ID is required' },
        { status: 400 }
      );
    }

    const existing = await db.providerConfig.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Provider config not found' },
        { status: 404 }
      );
    }

    // If name is being changed, check for conflicts
    if (name && name !== existing.name) {
      const nameConflict = await db.providerConfig.findUnique({ where: { name } });
      if (nameConflict) {
        return NextResponse.json(
          { error: 'Provider config with this name already exists' },
          { status: 409 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (provider !== undefined) updateData.provider = provider;
    if (apiKey !== undefined) updateData.apiKey = apiKey;
    if (baseUrl !== undefined) updateData.baseUrl = baseUrl;
    if (models !== undefined) updateData.models = JSON.stringify(models);
    if (enabled !== undefined) updateData.enabled = enabled;
    if (priority !== undefined) updateData.priority = priority;

    const updated = await db.providerConfig.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      ...updated,
      models: JSON.parse(updated.models),
      apiKey: maskApiKey(updated.apiKey),
    });
  } catch (error) {
    console.error('Provider update error:', error);
    return NextResponse.json(
      { error: 'Failed to update provider config' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a provider config
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Provider config ID is required' },
        { status: 400 }
      );
    }

    const existing = await db.providerConfig.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Provider config not found' },
        { status: 404 }
      );
    }

    await db.providerConfig.delete({ where: { id } });

    return NextResponse.json({ message: 'Provider config deleted successfully', id });
  } catch (error) {
    console.error('Provider delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete provider config' },
      { status: 500 }
    );
  }
}

// Helper: Mask API key for security
function maskApiKey(key: string): string {
  if (!key || key.length <= 8) return '••••••••';
  return key.slice(0, 4) + '••••••••' + key.slice(-4);
}
