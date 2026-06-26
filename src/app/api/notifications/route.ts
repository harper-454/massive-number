import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List notifications FROM DATABASE
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const unreadOnly = searchParams.get('unread') === 'true';

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (unreadOnly) where.read = false;

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      notifications,
      total: notifications.length,
      unread: notifications.filter((n) => !n.read).length,
    });
  } catch (error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json(
      { error: 'Failed to list notifications' },
      { status: 500 }
    );
  }
}

// POST - Create notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, title, description, actionUrl } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const notification = await db.notification.create({
      data: {
        type: type || 'info',
        title,
        description: description || null,
        actionUrl: actionUrl || null,
      },
    });

    return NextResponse.json({
      notification,
      message: 'Notification created',
    }, { status: 201 });
  } catch (error) {
    console.error('Notifications POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

// PUT - Mark notification as read
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId, read } = body;

    if (!notificationId) {
      return NextResponse.json(
        { error: 'notificationId is required' },
        { status: 400 }
      );
    }

    const existing = await db.notification.findUnique({
      where: { id: notificationId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: `Notification '${notificationId}' not found` },
        { status: 404 }
      );
    }

    const notification = await db.notification.update({
      where: { id: notificationId },
      data: { read: read !== undefined ? read : true },
    });

    return NextResponse.json({
      notification,
      message: `Notification marked as ${notification.read ? 'read' : 'unread'}`,
    });
  } catch (error) {
    console.error('Notifications PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

// DELETE - Delete one or clear all
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId } = body;

    if (notificationId) {
      // Delete specific notification
      const existing = await db.notification.findUnique({
        where: { id: notificationId },
      });

      if (!existing) {
        return NextResponse.json(
          { error: `Notification '${notificationId}' not found` },
          { status: 404 }
        );
      }

      await db.notification.delete({
        where: { id: notificationId },
      });

      return NextResponse.json({
        success: true,
        message: 'Notification deleted',
      });
    }

    // Clear all notifications
    const result = await db.notification.deleteMany();

    return NextResponse.json({
      success: true,
      message: `Cleared ${result.count} notifications`,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error('Notifications DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete notifications' },
      { status: 500 }
    );
  }
}
