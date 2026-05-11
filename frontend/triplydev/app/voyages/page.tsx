import { TripsListView } from '@/src/components/app/TripsListView';
import { AppShell } from '@/src/components/layout/AppShell';

export const metadata = {
  title: 'Mes voyages | Triply',
};

export default function VoyagesPage() {
  return (
    <AppShell>
      <TripsListView />
    </AppShell>
  );
}
