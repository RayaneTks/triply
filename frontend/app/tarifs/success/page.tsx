'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { authClient } from '../../../src/lib/auth-client';

const CONFIRM_MAX_ATTEMPTS = 4;
const CONFIRM_RETRY_MS = 2000;

async function confirmSubscription(
  sessionId: string,
  plan: string,
  billing: string,
  token: string,
): Promise<{ tier: string; billing: string }> {
  const response = await fetch('/api/v1/subscriptions/confirm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ session_id: sessionId, plan, billing }),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const code = body?.error?.code as string | undefined;
    const backendMessage = body?.error?.message || code || 'confirm failed';
    const err = new Error(backendMessage) as Error & { code?: string; retryable?: boolean };
    err.code = code;
    err.retryable = code === 'PAYMENT_NOT_COMPLETED';
    throw err;
  }

  return {
    tier: body?.data?.tier ?? plan,
    billing: body?.data?.billing ?? billing,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function CheckoutSuccessInner() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get('session_id');
  const plan = params.get('plan');
  const billing = params.get('billing');
  const shouldConfirm = Boolean(sessionId && plan && billing);
  const [state, setState] = useState<'pending' | 'ok' | 'error'>(shouldConfirm ? 'pending' : 'ok');
  const [tier, setTier] = useState<string | null>(null);
  const confirmStarted = useRef(false);

  useEffect(() => {
    if (!shouldConfirm || confirmStarted.current) return;
    confirmStarted.current = true;

    const token = authClient.getToken();
    if (!token) {
      const returnTo = `/tarifs/success?${params.toString()}`;
      router.replace(`/connexion?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }

    let cancelled = false;

    (async () => {
      for (let attempt = 1; attempt <= CONFIRM_MAX_ATTEMPTS; attempt += 1) {
        try {
          const result = await confirmSubscription(sessionId!, plan!, billing!, token);
          if (cancelled) return;

          setTier(result.tier);
          setState('ok');
          authClient.patchUser({ subscription_tier: result.tier });
          try {
            await authClient.me();
          } catch {
            // Le patch local suffit pour débloquer l'UI ; /me resynchronisera plus tard.
          }
          window.dispatchEvent(new CustomEvent('triply-auth-changed'));
          return;
        } catch (err: unknown) {
          const retryable = (err as { retryable?: boolean }).retryable === true;
          if (retryable && attempt < CONFIRM_MAX_ATTEMPTS) {
            await sleep(CONFIRM_RETRY_MS);
            continue;
          }
          if (cancelled) return;
          console.error('Subscription confirmation failed', err);
          setState('error');
          return;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [shouldConfirm, sessionId, plan, billing, params, router]);

  if (state === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md flex flex-col items-center gap-4">
          <Loader2 size={48} className="text-brand animate-spin" />
          <p className="text-light-muted font-bold">Confirmation de votre abonnement…</p>
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <AlertTriangle size={48} className="text-amber-500 mx-auto mb-6" />
          <h1 className="text-2xl font-display font-bold mb-4">Paiement effectué</h1>
          <p className="text-light-muted mb-6">
            Votre paiement a bien été reçu, mais l’activation de votre abonnement n’a pas abouti.
            Rechargez cette page dans quelques instants, ou écrivez-nous à{' '}
            <a className="text-brand underline" href="mailto:support@triply.ovh">support@triply.ovh</a>.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-block bg-brand text-white px-8 py-4 rounded-xl font-bold hover:bg-brand-hover transition-colors"
            >
              Réessayer l’activation
            </button>
            <Link href="/profil" className="inline-block border border-slate-200 px-8 py-4 rounded-xl font-bold hover:bg-slate-50 transition-colors">
              Voir mon profil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <CheckCircle size={64} className="text-emerald-500 mx-auto mb-6" />
        <h1 className="text-3xl font-display font-bold mb-4">Abonnement activé !</h1>
        <p className="text-light-muted mb-8">
          Merci pour votre confiance. {tier ? `Votre offre Triply ${tier} est maintenant active.` : 'Votre abonnement Triply est maintenant actif.'}
        </p>
        <Link
          href="/planifier"
          className="inline-block bg-brand text-white px-8 py-4 rounded-xl font-bold hover:bg-brand-hover transition-colors"
        >
          Commencer à planifier
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center px-6">
        <Loader2 size={48} className="text-brand animate-spin" />
      </div>
    }>
      <CheckoutSuccessInner />
    </Suspense>
  );
}
