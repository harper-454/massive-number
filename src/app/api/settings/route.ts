import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Default settings for a new user
const DEFAULT_SETTINGS = {
  theme: 'dark',
  defaultModel: 'auto',
  agentAutoApprove: false,
  voiceEnabled: false,
  costOptimization: true,
  webGrounding: true,
};

// GET - Return user settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default';

    let settings = await db.userSettings.findUnique({
      where: { userId },
    });

    // Create default settings if none exist
    if (!settings) {
      // Ensure user exists
      const existingUser = await db.user.findUnique({ where: { id: userId } });
      if (!existingUser) {
        await db.user.create({
          data: {
            id: userId,
            email: `${userId}@massive-number.ai`,
            name: userId === 'default' ? 'Default User' : userId,
          },
        });
      }

      settings = await db.userSettings.create({
        data: {
          userId,
          ...DEFAULT_SETTINGS,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve settings' },
      { status: 500 }
    );
  }
}

// PUT - Update user settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId = 'default', ...updates } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Allowed fields for update
    const allowedFields = [
      'theme',
      'defaultModel',
      'agentAutoApprove',
      'voiceEnabled',
      'costOptimization',
      'webGrounding',
    ];

    const filteredUpdates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    // Check if settings exist, create if not
    let settings = await db.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      // Ensure user exists
      const existingUser = await db.user.findUnique({ where: { id: userId } });
      if (!existingUser) {
        await db.user.create({
          data: {
            id: userId,
            email: `${userId}@massive-number.ai`,
            name: userId === 'default' ? 'Default User' : userId,
          },
        });
      }

      settings = await db.userSettings.create({
        data: {
          userId,
          ...DEFAULT_SETTINGS,
          ...filteredUpdates,
        },
      });
    } else {
      settings = await db.userSettings.update({
        where: { userId },
        data: filteredUpdates,
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
