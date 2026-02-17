'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RecapVoyageRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/voyages');
    }, [router]);
    return null;
}
