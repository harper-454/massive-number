import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ── GET — List feature suggestions ───────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const source = searchParams.get('source');

    const where: Record<string, string> = {};
    if (category) where.category = category;
    if (status) where.status = status;
    if (source) where.source = source;

    const suggestions = await db.featureSuggestion.findMany({
      where,
      orderBy: [{ votes: 'desc' }, { priority: 'desc' }, { createdAt: 'desc' }],
    });

    const summary = {
      total: suggestions.length,
      suggested: suggestions.filter(s => s.status === 'suggested').length,
      planned: suggestions.filter(s => s.status === 'planned').length,
      implemented: suggestions.filter(s => s.status === 'implemented').length,
      rejected: suggestions.filter(s => s.status === 'rejected').length,
      byCategory: {
        ui: suggestions.filter(s => s.category === 'ui').length,
        performance: suggestions.filter(s => s.category === 'performance').length,
        feature: suggestions.filter(s => s.category === 'feature').length,
        integration: suggestions.filter(s => s.category === 'integration').length,
        model: suggestions.filter(s => s.category === 'model').length,
      },
    };

    return NextResponse.json({ suggestions, summary });
  } catch (error) {
    console.error('Failed to fetch suggestions:', error);
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 });
  }
}

// ── POST — Add a new suggestion ──────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { source, title, description, category, priority } = body;

    if (!title || !description) {
      return NextResponse.json({ error: 'title and description are required' }, { status: 400 });
    }

    const suggestion = await db.featureSuggestion.create({
      data: {
        source: source || 'user-feedback',
        title,
        description,
        category: category || 'feature',
        priority: priority ?? 0,
        status: 'suggested',
      },
    });

    return NextResponse.json(suggestion, { status: 201 });
  } catch (error) {
    console.error('Failed to create suggestion:', error);
    return NextResponse.json({ error: 'Failed to create suggestion' }, { status: 500 });
  }
}

// ── PUT — Vote for a suggestion or mark as implemented ───────────────────

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, action } = body;

    if (!id) {
      return NextResponse.json({ error: 'Suggestion id is required' }, { status: 400 });
    }

    const suggestion = await db.featureSuggestion.findUnique({ where: { id } });
    if (!suggestion) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
    }

    if (action === 'vote') {
      const updated = await db.featureSuggestion.update({
        where: { id },
        data: { votes: suggestion.votes + 1, updatedAt: new Date() },
      });
      return NextResponse.json(updated);
    }

    if (action === 'implement') {
      const updated = await db.featureSuggestion.update({
        where: { id },
        data: { status: 'implemented', implementedAt: new Date(), updatedAt: new Date() },
      });
      return NextResponse.json(updated);
    }

    if (action === 'plan') {
      const updated = await db.featureSuggestion.update({
        where: { id },
        data: { status: 'planned', updatedAt: new Date() },
      });
      return NextResponse.json(updated);
    }

    if (action === 'reject') {
      const updated = await db.featureSuggestion.update({
        where: { id },
        data: { status: 'rejected', updatedAt: new Date() },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: 'Invalid action. Use: vote, implement, plan, or reject' }, { status: 400 });
  } catch (error) {
    console.error('Failed to update suggestion:', error);
    return NextResponse.json({ error: 'Failed to update suggestion' }, { status: 500 });
  }
}
