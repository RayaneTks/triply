import { ModeSelectionView } from '@/src/features/modes/ModeSelectionView';
import { AppShell } from '@/src/components/layout/AppShell';

export const metadata = {
  title: 'Planifier votre voyage | Triply',
};

export default function PlanifierPage() {
  return (
    <AppShell>
      <ModeSelectionView />
    </AppShell>
  );
}
