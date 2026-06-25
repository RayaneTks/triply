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

function backendApiBase(): string {
  return (process.env.BACKEND_API_BASE_URL || 'http://tri-api:80/api/v1').replace(/\/$/, '');
}

async function resolveAuthenticatedUser(
  req: NextRequest,
): Promise<{ id: number | string; email: string } | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const response = await fetch(`${backendApiBase()}/auth/me`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: authHeader,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  const body = await response.json().catch(() => null) as {
    success?: boolean;
    data?: { user?: { id?: number | string; email?: string } };
  } | null;

  const user = body?.data?.user;
  if (!user?.id || !user.email) {
    return null;
  }

  return { id: user.id, email: user.email };
}

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: 'STRIPE_UNAVAILABLE', message: 'Paiement temporairement indisponible.' },
      { status: 503 },
    );
  }

  const user = await resolveAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Connexion requise pour souscrire.' },
      { status: 401 },
    );
  }

  const stripe = new Stripe(secretKey);

  const { plan, billing } = await req.json() as { plan: PlanKey; billing: BillingKey };

  const planData = PLANS[plan]?.[billing];
  if (!planData) {
    return NextResponse.json({ error: 'Plan invalide' }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;
  const userId = String(user.id);

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: user.email,
    client_reference_id: userId,
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
    metadata: { plan, billing, user_id: userId },
    success_url: `${baseUrl}/tarifs/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}&billing=${billing}`,
    cancel_url:  `${baseUrl}/tarifs`,
  });

  return NextResponse.json({ url: session.url });
}
