import { Suspense } from 'react';
import { Wizard } from '@/src/components/planner/Wizard';
import { AppShell } from '@/src/components/layout/AppShell';

export const metadata = {
  title: 'Création de voyage | Triply',
};

export default function PlanifierWizardPage() {
  return (
    <AppShell showFooter={false} showBottomNav={false} contentClassName="overflow-hidden">
      <Suspense fallback={null}>
        <Wizard />
      </Suspense>
    </AppShell>
  );
}
