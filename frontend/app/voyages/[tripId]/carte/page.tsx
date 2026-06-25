import { TripMapView } from '@/src/features/trips/TripMapView';
import { AppShell } from '@/src/components/layout/AppShell';

export const metadata = {
    title: 'Carte interactive | Triply',
};

export default function TripMapPage() {
    return (
        <AppShell>
            <TripMapView />
        </AppShell>
    );
}
