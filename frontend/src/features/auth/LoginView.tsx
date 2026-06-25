'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@/src/lib/auth-client';
import { Button } from '@/src/components/Button/Button';
import { AuthPanelLayout } from '@/src/features/auth/AuthPanelLayout';

function isSafeReturnTo(value: string | null): value is string {
  if (!value) return false;
  return value.startsWith('/') && !value.startsWith('//');
}

export function LoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnToRaw = searchParams.get('returnTo');
  const returnTo = isSafeReturnTo(returnToRaw) ? returnToRaw : '/voyages';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setError(null);
    setSubmitting(true);
    try {
      await authClient.login({ email, password });
      router.push(returnTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion impossible.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthPanelLayout
      title="Connexion"
      subtitle="Retrouve tes voyages, ton planning et ton copilote en un instant."
      footer={
        <>
          Nouveau sur Triply ?{' '}
          <Link href="/inscription" className="font-semibold text-brand hover:opacity-90">
            Créer un compte
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-300" htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-emerald-300/70 focus:ring-2 focus:ring-emerald-400/30"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-300" htmlFor="login-password">
            Mot de passe
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-emerald-300/70 focus:ring-2 focus:ring-emerald-400/30"
          />
        </div>

        {error && <p className="rounded-xl border border-rose-300/30 bg-rose-500/15 px-3 py-2 text-sm text-rose-100">{error}</p>}

        <div className="mt-2">
          <Button
            label={submitting ? 'Connexion...' : 'Se connecter'}
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
