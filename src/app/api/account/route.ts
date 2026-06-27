export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Return current user account info from DB
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default';

    let account = await db.account.findUnique({
      where: { userId },
    });

    // If no account exists, create one with defaults
    if (!account) {
      account = await db.account.create({
        data: {
          userId,
          displayName: userId === 'default' ? 'Developer' : userId,
          email: `${userId}@massive-number.ai`,
          role: 'user',
          plan: 'free',
          status: 'active',
          lastLoginAt: new Date(),
          loginCount: 1,
        },
      });
    } else {
      // Update last login
      await db.account.update({
        where: { userId },
        data: {
          lastLoginAt: new Date(),
          loginCount: { increment: 1 },
        },
      });
      account = await db.account.findUnique({ where: { userId } });
    }

    return NextResponse.json({ account });
  } catch (error) {
    console.error('Account GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve account' },
      { status: 500 }
    );
  }
}

// PUT - Update account info
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId = 'default', ...updates } = body;

    // Allowed fields for update
    const allowedFields = [
      'displayName',
      'email',
      'avatarUrl',
      'bio',
      'plan',
      'preferences',
    ];

    const filteredUpdates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    // Serialize preferences if it's an object
    if (filteredUpdates.preferences && typeof filteredUpdates.preferences === 'object') {
      filteredUpdates.preferences = JSON.stringify(filteredUpdates.preferences);
    }

    // Check if account exists
    const existing = await db.account.findUnique({ where: { userId } });

    if (!existing) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    const account = await db.account.update({
      where: { userId },
      data: filteredUpdates,
    });

    return NextResponse.json({ account });
  } catch (error) {
    console.error('Account PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update account' },
      { status: 500 }
    );
  }
}

// POST - Create/register account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { displayName, email, avatarUrl, bio } = body;

    if (!displayName || !email) {
      return NextResponse.json(
        { error: 'displayName and email are required' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await db.account.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    const userId = `user_${Date.now()}`;
    const account = await db.account.create({
      data: {
        userId,
        displayName,
        email,
        avatarUrl: avatarUrl || null,
        bio: bio || null,
        role: 'user',
        plan: 'free',
        status: 'active',
        lastLoginAt: new Date(),
        loginCount: 1,
      },
    });

    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    console.error('Account POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
