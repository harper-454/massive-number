import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PLANS, type PlanKey } from '@/app/api/subscription/route';

// GET — token usage stats for current period
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default';
    const period = searchParams.get('period') || new Date().toISOString().slice(0, 7); // "2024-01"

    // Get subscription to find token limit
    let subscription = await db.subscription.findUnique({ where: { userId } });
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

    // Get usage for the requested period
    const usageRecords = await db.tokenUsage.findMany({
      where: { userId, period },
      orderBy: { totalTokens: 'desc' },
    });

    // Aggregate totals
    const totals = usageRecords.reduce(
      (acc, r) => ({
        inputTokens: acc.inputTokens + r.inputTokens,
        outputTokens: acc.outputTokens + r.outputTokens,
        totalTokens: acc.totalTokens + r.totalTokens,
        cost: acc.cost + r.cost,
      }),
      { inputTokens: 0, outputTokens: 0, totalTokens: 0, cost: 0 }
    );

    // Group by provider
    const byProvider: Record<string, { totalTokens: number; cost: number; count: number }> = {};
    for (const r of usageRecords) {
      if (!byProvider[r.provider]) {
        byProvider[r.provider] = { totalTokens: 0, cost: 0, count: 0 };
      }
      byProvider[r.provider].totalTokens += r.totalTokens;
      byProvider[r.provider].cost += r.cost;
      byProvider[r.provider].count += 1;
    }

    // Group by model
    const byModel: Record<string, { totalTokens: number; cost: number; provider: string }> = {};
    for (const r of usageRecords) {
      if (!byModel[r.model]) {
        byModel[r.model] = { totalTokens: 0, cost: 0, provider: r.provider };
      }
      byModel[r.model].totalTokens += r.totalTokens;
      byModel[r.model].cost += r.cost;
    }

    // Get last 6 months for chart
    const monthlyUsage = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const p = d.toISOString().slice(0, 7);
      const records = await db.tokenUsage.findMany({ where: { userId, period: p } });
      const monthTotal = records.reduce((acc, r) => acc + r.totalTokens, 0);
      const monthCost = records.reduce((acc, r) => acc + r.cost, 0);
      monthlyUsage.push({ period: p, totalTokens: monthTotal, cost: monthCost });
    }

    // Calculate usage percentage
    const tokenLimit = planInfo.tokenLimit;
    const usagePercent = tokenLimit === Infinity ? 0 : Math.min(100, (totals.totalTokens / tokenLimit) * 100);

    return NextResponse.json({
      period,
      totals,
      byProvider,
      byModel,
      monthlyUsage,
      tokenLimit,
      usagePercent,
      plan: subscription.plan,
      records: usageRecords,
    });
  } catch (error) {
    console.error('Usage GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve usage stats' },
      { status: 500 }
    );
  }
}
