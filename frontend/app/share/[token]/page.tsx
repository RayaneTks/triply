import { Suspense } from 'react';

import { RecapVoyageView } from '@/src/features/recap/RecapVoyageView';

export const metadata = {
    title: 'Voyage partagé | Triply',
};

interface PublicSharePageProps {
    params: Promise<{ token: string }>;
}

export default async function PublicSharePage({ params }: PublicSharePageProps) {
    const { token } = await params;
    return (
        <main className="min-h-screen" style={{ background: 'var(--background)' }}>
            <Suspense fallback={null}>
                <RecapVoyageView publicShareToken={token} />
            </Suspense>
        </main>
    );
}
