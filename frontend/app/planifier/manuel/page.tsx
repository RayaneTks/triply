'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ManualCanvasView } from '@/src/features/modes/ManualCanvasView';
import { AppShell } from '@/src/components/layout/AppShell';
import { useAuthSession } from '@/src/hooks/useAuthSession';
import { PlannerManualUpsell } from '@/src/components/subscription/PlannerManualUpsell';
import { hasPlannerPaidSubscription } from '@/src/lib/subscription-access';

export default function PlanifierManuelPage() {
  const router = useRouter();
  const { currentUser, isLoading } = useAuthSession();
  const hasPaidPlanner = hasPlannerPaidSubscription(currentUser?.subscription_tier);

  useEffect(() => {
    if (isLoading) return;
    if (!currentUser) {
      router.replace('/connexion?returnTo=/planifier/manuel');
    }
  }, [currentUser, isLoading, router]);

  if (isLoading) {
    return (
      <AppShell showFooter={false}>
        <div className="mx-auto max-w-3xl px-6 py-16 text-center text-light-muted">
          Vérification de votre accès…
        </div>
      </AppShell>
    );
  }

  if (!currentUser) {
    return (
      <AppShell showFooter={false}>
        <div className="mx-auto max-w-3xl px-6 py-16 text-center text-light-muted">
          Redirection vers la connexion…
        </div>
      </AppShell>
    );
  }

  if (!hasPaidPlanner) {
    return (
      <AppShell showFooter={false}>
        <PlannerManualUpsell />
      </AppShell>
    );
  }

  return (
    <AppShell showFooter={false}>
      <ManualCanvasView />
    </AppShell>
  );
}
