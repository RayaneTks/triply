'use client';

import React, { useEffect, useRef, useState } from 'react';
import { WorldMap } from '@/src/components/Map/Map';
import { Login } from '@/src/components/Login/Login';
import { MEDIA_MIN_LG, useMediaQuery } from '@/src/hooks/useMediaQuery';
import type { AuthUser } from '@/src/lib/auth-client';

interface LoginWithMapBackgroundProps {
    mapboxToken: string;
    onLoginSuccess: (user: AuthUser, isNewUser?: boolean) => void;
    onBack: () => void;
}

export function LoginWithMapBackground({
    mapboxToken,
    onLoginSuccess,
    onBack,
}: LoginWithMapBackgroundProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [padding, setPadding] = useState({ left: 600, top: 400, right: 0, bottom: 0 });
    const isDesktop = useMediaQuery(MEDIA_MIN_LG);

    useEffect(() => {
        if (!isDesktop) return;
        const element = containerRef.current;
        if (!element) return;

        const update = () => {
            const { width, height } = element.getBoundingClientRect();
            setPadding({ left: width * 0.55, top: height * 0.5, right: 0, bottom: 0 });
        };

        update();
        const resizeObserver = new ResizeObserver(update);
        resizeObserver.observe(element);
        return () => resizeObserver.disconnect();
    }, [isDesktop]);

    return (
        <div ref={containerRef} className="relative min-h-dvh overflow-hidden bg-[var(--background)]">
            <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.16),transparent_24%),linear-gradient(180deg,#fcf9f4_0%,#f3ece1_100%)]" />

            {isDesktop ? (
                <div className="absolute inset-0 z-0">
                    <WorldMap
                        accessToken={mapboxToken}
                        initialLatitude={20}
                        initialLongitude={0}
                        initialZoom={1.2}
                        mapStyle="mapbox://styles/mapbox/standard"
                        mapConfig={{ lightPreset: 'dusk' }}
                        pitch={48}
                        interactive={false}
                        autoRotateSpeed={4.5}
                        padding={padding}
                        height="100%"
                        width="100%"
                        className="h-full w-full"
                    />
                </div>
            ) : null}

            <div className="absolute inset-0 z-10 bg-white/25 backdrop-blur-[2px]" />

            <div className="relative z-20 min-h-dvh">
                <Login onLoginSuccess={onLoginSuccess} onBack={onBack} />
            </div>
        </div>
    );
}
