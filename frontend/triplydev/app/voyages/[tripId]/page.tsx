import { TripDetailView } from '@/src/features/trips/TripDetailView';
import { AppShell } from '@/src/components/layout/AppShell';

export const metadata = {
  title: 'Détail du voyage | Triply',
};

export default function TripDetailPage() {
  return (
    <AppShell>
      <TripDetailView />
    </AppShell>
  );
}
