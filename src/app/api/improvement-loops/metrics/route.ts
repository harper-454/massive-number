import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ── GET — Get app metrics ────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build where clause
    const where = category ? { category } : {};

    // Get latest metrics
    const metrics = await db.appMetric.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
      take: limit,
    });

    // Get metrics summary by category
    const categories = ['performance', 'usage', 'error', 'latency', 'satisfaction'];
    const categoryStats: Record<string, { count: number; latest: typeof metrics[0] | null }> = {};

    for (const cat of categories) {
      const catMetrics = metrics.filter(m => m.category === cat);
      categoryStats[cat] = {
        count: catMetrics.length,
        latest: catMetrics[0] || null,
      };
    }

    // Compute health score (weighted combination of key metrics)
    const performanceScore = metrics.find(m => m.name === 'Performance Score')?.value ?? 85;
    const errorRate = metrics.find(m => m.name === 'Error Rate')?.value ?? 5;
    const satisfaction = metrics.find(m => m.name === 'User Satisfaction')?.value ?? 4.0;
    const availability = metrics.find(m => m.name === 'Model Availability')?.value ?? 95;

    const healthScore = Math.round(
      performanceScore * 0.3 +
      (100 - errorRate * 10) * 0.2 +
      (satisfaction * 20) * 0.3 +
      availability * 0.2
    );

    // Get trend data (last 7 entries per key metric)
    const keyMetricNames = [
      'Performance Score',
      'Average Response Time',
      'Error Rate',
      'Model Availability',
      'User Satisfaction',
      'Improvement Rate',
    ];

    const trends: Record<string, { values: number[]; timestamps: string[] }> = {};
    for (const name of keyMetricNames) {
      const entries = await db.appMetric.findMany({
        where: { name },
        orderBy: { recordedAt: 'desc' },
        take: 7,
      });
      trends[name] = {
        values: entries.map(e => e.value).reverse(),
        timestamps: entries.map(e => e.recordedAt.toISOString()).reverse(),
      };
    }

    return NextResponse.json({
      metrics,
      summary: {
        totalMetrics: metrics.length,
        categories: categoryStats,
        healthScore: Math.min(100, Math.max(0, healthScore)),
      },
      trends,
    });
  } catch (error) {
    console.error('Failed to fetch metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}
