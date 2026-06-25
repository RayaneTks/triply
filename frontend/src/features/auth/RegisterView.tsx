'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check } from 'lucide-react';
import { authClient } from '@/src/lib/auth-client';
import { Button } from '@/src/components/Button/Button';
import { AuthPanelLayout } from '@/src/features/auth/AuthPanelLayout';

function isSafeReturnTo(value: string | null): value is string {
  if (!value) return false;
  return value.startsWith('/') && !value.startsWith('//');
}

export function RegisterView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnToRaw = searchParams.get('returnTo');
  const returnTo = isSafeReturnTo(returnToRaw) ? returnToRaw : '/planifier';
  const [success, setSuccess] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await authClient.register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inscription impossible.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <AuthPanelLayout
        centered
        title="Compte créé"
        subtitle="Bienvenue à bord. Ton espace Triply est prêt."
        footer={
          <>
            Tu préfères explorer d&apos;abord ?{' '}
            <Link href="/voyages" className="font-semibold text-brand hover:opacity-90">
              Voir mes voyages
            </Link>
          </>
        }
      >
        <div className="flex flex-col items-center gap-8 py-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/20 text-brand ring-1 ring-brand/30">
            <Check size={30} strokeWidth={2.5} />
          </div>
          <Button
            label={returnTo === '/planifier' ? 'Démarrer mon premier voyage' : 'Continuer'}
            onClick={() => router.push(returnTo)}
            variant="dark"
            tone="tone1"
            className="w-full max-w-sm"
          />
        </div>
      </AuthPanelLayout>
    );
  }

  return (
    <AuthPanelLayout
      title="Inscription"
      subtitle="Crée ton compte en quelques secondes pour enregistrer et partager tes itinéraires."
      footer={
        <>
          Déjà inscrit ?{' '}
          <Link href="/connexion" className="font-semibold text-brand hover:opacity-90">
            Se connecter
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-300" htmlFor="reg-name">
            Nom complet
          </label>
          <input
            id="reg-name"
            type="text"
            placeholder="Julien Martin"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-emerald-300/70 focus:ring-2 focus:ring-emerald-400/30"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-300" htmlFor="reg-email">
            Email
          </label>
          <input
            id="reg-email"
            type="email"
            placeholder="julien.martin@example.com"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-emerald-300/70 focus:ring-2 focus:ring-emerald-400/30"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-300" htmlFor="reg-password">
            Mot de passe
          </label>
          <input
            id="reg-password"
            type="password"
            placeholder="••••••••"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-emerald-300/70 focus:ring-2 focus:ring-emerald-400/30"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-300" htmlFor="reg-password2">
            Confirmer le mot de passe
          </label>
          <input
            id="reg-password2"
            type="password"
            placeholder="••••••••"
            required
            autoComplete="new-password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-emerald-300/70 focus:ring-2 focus:ring-emerald-400/30"
          />
        </div>

        {error && <p className="rounded-xl border border-rose-300/30 bg-rose-500/15 px-3 py-2 text-sm text-rose-100">{error}</p>}

        <div className="mt-2">
          <Button
            label={submitting ? 'Inscription...' : "Finaliser l'inscription"}
            type="submit"
            variant="dark"
            tone="tone1"
            className="w-full"
            loading={submitting}
            disabled={submitting}
          />
        </div>
      </form>
    </AuthPanelLayout>
  );
}
