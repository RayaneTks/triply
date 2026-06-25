'use client';

import { Suspense } from 'react';
import { LoginView } from '@/src/features/auth/LoginView';
import { FloatingThemeToggle } from '@/src/components/layout/FloatingThemeToggle';

export default function ConnexionPage() {
  return (
    <>
      <FloatingThemeToggle />
      <Suspense fallback={null}>
        <LoginView />
      </Suspense>
    </>
  );
}
