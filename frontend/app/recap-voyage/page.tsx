import { Suspense } from 'react';

import { AppShell } from '@/src/components/layout/AppShell';
import { RecapVoyageView } from '@/src/features/recap/RecapVoyageView';

export const metadata = {
    title: 'Récap voyage | Triply',
};

export default function RecapVoyagePage() {
    return (
        <AppShell>
            <Suspense fallback={null}>
                <RecapVoyageView />
            </Suspense>
        </AppShell>
    );
}
