export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { isDbAvailable, FALLBACK_SUBSCRIPTION } from '@/lib/db-fallback';

// ── Plan definitions ──────────────────────────────────────────────────────

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    tokenLimit: 100_000,
    models: 16,
    surfaces: 10,
    features: ['16 AI Models', '10 Surfaces', '100K tokens/month', 'Community support'],
  },
  pro: {
    name: 'Pro',
    price: 8,
    tokenLimit: 2_000_000,
    models: 30,
    surfaces: Infinity,
    features: [
      'All Free models + Premium',
      'GPT-4o, Claude Sonnet',
      '2M tokens/month',
      'Priority routing',
      'API access',
      'Custom personas',
      'Unlimited surfaces',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price: 49,
    tokenLimit: Infinity,
    models: Infinity,
    surfaces: Infinity,
    features: [
      'All Pro models',
      'Unlimited tokens',
      'Dedicated support',
      'Custom model hosting',
      'Team features',
      'SSO',
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;

// GET — current subscription
export async function GET(request: NextRequest) {
  try {
    const dbOk = await isDbAvailable();
    if (!dbOk) {
      const planInfo = PLANS.free;
      return NextResponse.json({
        subscription: {
          id: 'fallback',
          userId: 'default',
          plan: FALLBACK_SUBSCRIPTION.plan,
          status: FALLBACK_SUBSCRIPTION.status,
          currentPeriodStart: FALLBACK_SUBSCRIPTION.currentPeriodStart,
          currentPeriodEnd: FALLBACK_SUBSCRIPTION.currentPeriodEnd,
          cancelAtPeriodEnd: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        planInfo,
        plans: PLANS,
      });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default';

    const { db } = await import('@/lib/db');
    let subscription = await db.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      subscription = await db.subscription.create({
        data: {
          userId,
          plan: 'free',
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    const planInfo = PLANS[subscription.plan as PlanKey] || PLANS.free;

    return NextResponse.json({
      subscription,
      planInfo,
      plans: PLANS,
    });
  } catch (error) {
    console.error('Subscription GET error:', error);
    const planInfo = PLANS.free;
    return NextResponse.json({
      subscription: {
        id: 'fallback',
        userId: 'default',
        plan: FALLBACK_SUBSCRIPTION.plan,
        status: FALLBACK_SUBSCRIPTION.status,
        currentPeriodStart: FALLBACK_SUBSCRIPTION.currentPeriodStart,
        currentPeriodEnd: FALLBACK_SUBSCRIPTION.currentPeriodEnd,
        cancelAtPeriodEnd: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      planInfo,
      plans: PLANS,
    });
  }
}

// POST — create checkout / change plan (simulated)
export async function POST(request: NextRequest) {
  try {
    const dbOk = await isDbAvailable();
    if (!dbOk) {
      return NextResponse.json(
        { error: 'Database not available — cannot change plan on edge runtime' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { userId = 'default', plan } = body;

    if (!plan || !PLANS[plan as PlanKey]) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be free, pro, or enterprise.' },
        { status: 400 }
      );
    }

    const { db } = await import('@/lib/db');
    let subscription = await db.subscription.findUnique({ where: { userId } });

    if (!subscription) {
      subscription = await db.subscription.create({
        data: {
          userId,
          plan,
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    } else {
      subscription = await db.subscription.update({
        where: { userId },
        data: {
          plan,
          status: 'active',
          cancelAtPeriodEnd: false,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    const planInfo = PLANS[plan as PlanKey];

    return NextResponse.json({
      subscription,
      planInfo,
      message: `Plan changed to ${planInfo.name} successfully`,
    });
  } catch (error) {
    console.error('Subscription POST error:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

// PUT — update/cancel subscription
export async function PUT(request: NextRequest) {
  try {
    const dbOk = await isDbAvailable();
    if (!dbOk) {
      return NextResponse.json(
        { error: 'Database not available — cannot update subscription on edge runtime' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { userId = 'default', action } = body;

    const { db } = await import('@/lib/db');
    const subscription = await db.subscription.findUnique({ where: { userId } });
    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    if (action === 'cancel') {
      const updated = await db.subscription.update({
        where: { userId },
        data: {
          cancelAtPeriodEnd: true,
        },
      });
      return NextResponse.json({
        subscription: updated,
        message: 'Subscription will be canceled at the end of the current period',
      });
    }

    if (action === 'reactivate') {
      const updated = await db.subscription.update({
        where: { userId },
        data: {
          cancelAtPeriodEnd: false,
          status: 'active',
        },
      });
      return NextResponse.json({
        subscription: updated,
        message: 'Subscription reactivated',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use cancel or reactivate.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Subscription PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}
