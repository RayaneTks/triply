import React, { useState } from 'react';
import { Map } from 'react-map-gl/mapbox';
import type { ViewState } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

export interface MapProps {
    /** Token d'accès API (requis) */
    accessToken: string;
    /** Latitude initiale */
    initialLatitude?: number;
    /** Longitude initiale */
    initialLongitude?: number;
    /** Niveau de zoom initial */
    initialZoom?: number;
    /** Style de la carte (par défaut: 'mapbox://styles/mapbox/streets-v12') */
    mapStyle?: string;
    /** Hauteur de la carte */
    height?: string;
    /** Largeur de la carte */
    width?: string;
    /** Classe CSS personnalisée */
    className?: string;
    /** Callback appelé lors du changement de vue */
    onMove?: (viewState: ViewState) => void;
    /** Padding pour décaler le centre visuel de la carte */
    padding?: { top?: number; bottom?: number; left?: number; right?: number };
    /** Afficher les contrôles de navigation */
    showNavigationControls?: boolean;
    /** Afficher le contrôle de géolocalisation */
    showGeolocateControl?: boolean;
    /** Afficher le contrôle de plein écran */
    showFullscreenControl?: boolean;
    /** Afficher les attributions Mapbox */
    showAttribution?: boolean;
    /** Afficher le logo Mapbox */
    showLogo?: boolean;
}

export const WorldMap: React.FC<MapProps> = ({
    accessToken,
    initialLatitude = 46.6034,
    initialLongitude = 1.8883,
    initialZoom = 2,
    mapStyle = 'mapbox://styles/mapbox/streets-v12',
    height = '100%',
    width = '100%',
    className = '',
    onMove,
    padding,
    showNavigationControls: _showNavigationControls = true,
    showGeolocateControl: _showGeolocateControl = false,
    showFullscreenControl: _showFullscreenControl = false,
    showAttribution = false,
    showLogo = false,
}: MapProps) => {
    const [viewState, setViewState] = useState<ViewState>({
        longitude: initialLongitude,
        latitude: initialLatitude,
        zoom: initialZoom,
        bearing: 0,
        pitch: 0,
        padding: padding || { top: 0, bottom: 0, left: 0, right: 0 },
    });

    const handleMove = (evt: { viewState: ViewState }) => {
        // Préserver le padding personnalisé lors des mouvements
        const updatedViewState = {
            ...evt.viewState,
            padding: padding || evt.viewState.padding,
        };
        setViewState(updatedViewState);
        onMove?.(updatedViewState);
    };

    return (
        <div className={className} style={{ width, height, position: 'relative' }}>
            <Map
                {...viewState}
                onMove={handleMove}
                style={{ width: '100%', height: '100%' }}
                mapStyle={mapStyle}
                mapboxAccessToken={accessToken}
                attributionControl={showAttribution}
            />
            {(!showLogo || !showAttribution) && (
                <style>{`
                    .mapboxgl-ctrl-logo {
                        display: none !important;
                    }
                    .mapboxgl-ctrl-attrib {
                        display: none !important;
                    }
                    .mapboxgl-ctrl-attrib-inner {
                        display: none !important;
                    }
                    a[href*="mapbox.com"] {
                        display: none !important;
                    }
                    a[href*="openstreetmap.org"] {
                        display: none !important;
                    }
                `}</style>
            )}
        </div>
    );
};

