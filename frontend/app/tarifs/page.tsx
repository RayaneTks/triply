import { PricingView } from '@/src/features/pricing/PricingView';
import { AppShell } from '@/src/components/layout/AppShell';

export const metadata = {
  title: 'Tarifs | Triply',
};

export default function TarifsPage() {
  return (
    <AppShell>
      <PricingView />
    </AppShell>
  );
}
