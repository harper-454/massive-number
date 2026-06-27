import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST — create donation checkout session (simulated Stripe)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amount, currency = 'usd', message } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Predefined amounts validation
    const validAmounts = [5, 10, 25, 50];
    const isCustom = !validAmounts.includes(amount);

    // Create donation record
    const donation = await db.donation.create({
      data: {
        userId: userId || null,
        amount,
        currency,
        message: message || null,
        stripeSessionId: `cs_sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      },
    });

    // In a real app, we'd create a Stripe checkout session here
    // For now, simulate a successful session
    return NextResponse.json({
      donation,
      checkoutUrl: `/donate/success?id=${donation.id}`,
      isCustom,
      message: 'Donation session created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Donate POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create donation session' },
      { status: 500 }
    );
  }
}

// GET — list donation history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const where = userId ? { userId } : {};
    const donations = await db.donation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);

    return NextResponse.json({
      donations,
      total: totalAmount,
      count: donations.length,
    });
  } catch (error) {
    console.error('Donate GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve donations' },
      { status: 500 }
    );
  }
}
