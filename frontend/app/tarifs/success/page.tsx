'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { authClient } from '../../../src/lib/auth-client';

function CheckoutSuccessInner() {
  const params = useSearchParams();
  const sessionId = params.get('session_id');
  const plan = params.get('plan');
  const billing = params.get('billing');
  // If any of the required params is missing, skip the confirm call and render success directly.
  const shouldConfirm = Boolean(sessionId && plan && billing);
  const [state, setState] = useState<'pending' | 'ok' | 'error'>(shouldConfirm ? 'pending' : 'ok');
  const [tier, setTier] = useState<string | null>(null);

  useEffect(() => {
    if (!shouldConfirm) return;
    const token = authClient.getToken();
    if (!token) {
      return;
    }

    fetch('/api/v1/subscriptions/confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ session_id: sessionId, plan, billing }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error('confirm failed');
        return r.json();
      })
      .then((body) => {
        setTier(body?.data?.tier ?? plan);
        setState('ok');
        // Force le rafraîchissement de useAuthSession dans l'app.
        window.dispatchEvent(new CustomEvent('triply-auth-changed'));
      })
      .catch(() => setState('error'));
  }, [shouldConfirm, sessionId, plan, billing]);

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
            Votre paiement a été reçu par Stripe, mais la confirmation côté Triply a échoué.
            Contactez-nous à <a className="text-brand underline" href="mailto:support@triply.ovh">support@triply.ovh</a> pour activer votre tier manuellement.
          </p>
          <Link href="/profil" className="inline-block bg-brand text-white px-8 py-4 rounded-xl font-bold hover:bg-brand-hover transition-colors">
            Voir mon profil
          </Link>
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
