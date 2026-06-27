export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List activity FROM DATABASE
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const entity = searchParams.get('entity');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = {};
    if (action) where.action = action;
    if (entity) where.entity = entity;

    const activities = await db.activity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      activities: activities.map((a) => ({
        id: a.id,
        action: a.action,
        entity: a.entity,
        entityId: a.entityId,
        description: a.description,
        metadata: JSON.parse(a.metadata),
        createdAt: a.createdAt,
      })),
      total: activities.length,
    });
  } catch (error) {
    console.error('Activity GET error:', error);
    return NextResponse.json(
      { error: 'Failed to list activity' },
      { status: 500 }
    );
  }
}

// POST - Log activity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, entity, entityId, description, metadata } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    const activity = await db.activity.create({
      data: {
        action,
        entity: entity || null,
        entityId: entityId || null,
        description: description || null,
        metadata: JSON.stringify(metadata || {}),
      },
    });

    return NextResponse.json({
      activity: {
        id: activity.id,
        action: activity.action,
        entity: activity.entity,
        entityId: activity.entityId,
        description: activity.description,
        metadata: JSON.parse(activity.metadata),
        createdAt: activity.createdAt,
      },
      message: 'Activity logged',
    }, { status: 201 });
  } catch (error) {
    console.error('Activity POST error:', error);
    return NextResponse.json(
      { error: 'Failed to log activity' },
      { status: 500 }
    );
  }
}
