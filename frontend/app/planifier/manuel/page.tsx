'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ManualCanvasView } from '@/src/features/modes/ManualCanvasView';
import { AppShell } from '@/src/components/layout/AppShell';
import { useAuthSession } from '@/src/hooks/useAuthSession';

export const metadata = {
  title: 'Mode manuel | Triply',
};

export default function PlanifierManuelPage() {
  const router = useRouter();
  const { currentUser, isLoading } = useAuthSession();
  const hasVoyageurSub = currentUser?.subscription_tier === 'voyageur';

  useEffect(() => {
    if (isLoading) return;
    if (!currentUser) {
      router.replace('/connexion?returnTo=/planifier/manuel');
      return;
    }
    if (!hasVoyageurSub) {
      router.replace('/tarifs');
    }
  }, [currentUser, hasVoyageurSub, isLoading, router]);

  if (isLoading || !currentUser || !hasVoyageurSub) {
    return (
      <AppShell showFooter={false}>
        <div className="max-w-3xl mx-auto px-6 py-16 text-center text-light-muted">
          Vérification de votre accès…
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell showFooter={false}>
      <ManualCanvasView />
    </AppShell>
  );
}
