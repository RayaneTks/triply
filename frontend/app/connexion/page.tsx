'use client';

import { useRouter } from 'next/navigation';
import { Login } from '@/src/components/Login/Login';
import { FloatingThemeToggle } from '@/src/components/layout/FloatingThemeToggle';

export default function ConnexionPage() {
  const router = useRouter();
  return (
    <>
      <FloatingThemeToggle />
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Login
          onLoginSuccess={() => router.push('/voyages')}
          onBack={() => router.push('/')}
        />
      </div>
    </>
  );
}
