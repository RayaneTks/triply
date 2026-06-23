'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Login } from '@/src/components/Login/Login';
import { FloatingThemeToggle } from '@/src/components/layout/FloatingThemeToggle';

function isSafeReturnTo(value: string | null): value is string {
  if (!value) return false;
  // Only allow same-origin relative paths to avoid open-redirect.
  return value.startsWith('/') && !value.startsWith('//');
}

function ConnexionInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawReturnTo = searchParams.get('returnTo');
  const returnTo = isSafeReturnTo(rawReturnTo) ? rawReturnTo : '/voyages';

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background px-4 py-8">
      <Login
        onLoginSuccess={() => router.push(returnTo)}
        onBack={() => router.push('/')}
      />
    </div>
  );
}

export default function ConnexionPage() {
  return (
    <>
      <FloatingThemeToggle />
      <Suspense fallback={null}>
        <ConnexionInner />
      </Suspense>
    </>
  );
}
