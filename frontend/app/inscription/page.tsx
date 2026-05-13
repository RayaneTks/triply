import { Suspense } from 'react';
import { RegisterView } from '@/src/features/auth/RegisterView';
import { FloatingThemeToggle } from '@/src/components/layout/FloatingThemeToggle';

export const metadata = {
  title: 'Inscription | Triply',
};

export default function InscriptionPage() {
  return (
    <>
      <FloatingThemeToggle />
      <Suspense fallback={null}>
        <RegisterView />
      </Suspense>
    </>
  );
}
