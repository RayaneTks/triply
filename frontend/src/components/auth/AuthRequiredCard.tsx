'use client';

import Link from 'next/link';

interface AuthRequiredCardProps {
  title: string;
  description: string;
  loginHref?: string;
  signupHref?: string;
  loginLabel?: string;
  signupLabel?: string;
}

export function AuthRequiredCard({
  title,
  description,
  loginHref = '/connexion',
  signupHref = '/inscription',
  loginLabel = 'Se connecter',
  signupLabel = "S'inscrire",
}: AuthRequiredCardProps) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="rounded-3xl border border-light-border bg-card p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-light-foreground">{title}</h1>
        <p className="mt-3 text-sm text-light-muted">{description}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href={loginHref} className="btn-primary px-6 py-2.5 text-sm">
            {loginLabel}
          </Link>
          <Link href={signupHref} className="btn-secondary px-6 py-2.5 text-sm">
            {signupLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
