import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type PlanKey = 'voyageur' | 'pilote';
type BillingKey = 'monthly' | 'annual';

const PLANS: Record<PlanKey, Record<BillingKey, { amount: number; interval: 'month' | 'year'; name: string }>> = {
  voyageur: {
    monthly: { amount: 1200, interval: 'month', name: 'Triply Voyageur — Mensuel' },
    annual:  { amount: 10800, interval: 'year',  name: 'Triply Voyageur — Annuel' },
  },
  pilote: {
    monthly: { amount: 2400, interval: 'month', name: 'Triply Pilote — Mensuel' },
    annual:  { amount: 22800, interval: 'year',  name: 'Triply Pilote — Annuel' },
  },
};

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: 'STRIPE_UNAVAILABLE', message: 'Paiement temporairement indisponible.' },
      { status: 503 },
    );
  }
  const stripe = new Stripe(secretKey);

  const { plan, billing } = await req.json() as { plan: PlanKey; billing: BillingKey };

  const planData = PLANS[plan]?.[billing];
  if (!planData) {
    return NextResponse.json({ error: 'Plan invalide' }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'eur',
          product_data: { name: planData.name },
          unit_amount: planData.amount,
          recurring: { interval: planData.interval },
        },
      },
    ],
    metadata: { plan, billing },
    success_url: `${baseUrl}/tarifs/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}&billing=${billing}`,
    cancel_url:  `${baseUrl}/tarifs`,
  });

  return NextResponse.json({ url: session.url });
}
