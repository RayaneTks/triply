import { ItineraryView } from '@/src/components/app/ItineraryView';
import { AppShell } from '@/src/components/layout/AppShell';

export const metadata = {
  title: 'Itinéraire | Triply',
};

export default function ItinerairePage() {
  return (
    <AppShell showFooter={false}>
      <ItineraryView />
    </AppShell>
  );
}
