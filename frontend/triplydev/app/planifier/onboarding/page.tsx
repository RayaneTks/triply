import { OnboardingView } from '@/src/features/onboarding/OnboardingView';
import { AppShell } from '@/src/components/layout/AppShell';

export const metadata = {
  title: 'Bienvenue | Triply',
};

export default function PlanifierOnboardingPage() {
  return (
    <AppShell>
      <OnboardingView />
    </AppShell>
  );
}
