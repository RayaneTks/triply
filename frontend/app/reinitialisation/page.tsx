import { Suspense } from 'react';
import { ResetPasswordView } from '@/src/features/auth/ResetPasswordView';
import { FloatingThemeToggle } from '@/src/components/layout/FloatingThemeToggle';

export const metadata = {
  title: 'Réinitialisation du mot de passe | Triply',
};

export default function ReinitialisationPage() {
  return (
    <>
      <FloatingThemeToggle />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
        <ResetPasswordView />
      </Suspense>
    </>
  );
}
