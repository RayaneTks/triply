import React, { useState, useRef, useCallback } from 'react';
import { Map } from 'react-map-gl/mapbox';
import type { ViewState } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl';
import type { MapMouseEvent } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

/** Couches du style Mapbox considérées comme POI / activités (restaurants, musées, etc.) */
const POI_LAYER_IDS = [
    'poi-label',
    'poi',
    'place-label',
    'place-village',
    'place-town',
    'place-city',
    'place-country',
    'poi-scalerank2',
    'poi-scalerank3',
    'poi-scalerank4',
];

export interface MapboxPoiFeature {
    id?: string | number;
    layer?: { id: string };
    source?: string;
    sourceLayer?: string;
    properties?: Record<string, unknown>;
    geometry?: GeoJSON.Geometry;
}

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
    /** Callback appelé quand on clique sur un POI (restaurant, musée, lieu) */
    onPoiClick?: (feature: MapboxPoiFeature, lngLat: { lng: number; lat: number }) => void;
    /** Callback appelé au survol d'un POI (pour afficher une modal d'avis) */
    onPoiHover?: (feature: MapboxPoiFeature, lngLat: { lng: number; lat: number }, point: { x: number; y: number }) => void;
    /** Callback appelé quand la souris quitte un POI */
    onPoiLeave?: () => void;
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
    onPoiClick,
    onPoiHover,
    onPoiLeave,
    showNavigationControls: _showNavigationControls = true,
    showGeolocateControl: _showGeolocateControl = false,
    showFullscreenControl: _showFullscreenControl = false,
    showAttribution = false,
    showLogo = false,
}: MapProps) => {
    const mapRef = useRef<MapRef>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [cursor, setCursor] = useState<string>('');
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

    const handleClick = useCallback(
        (e: MapMouseEvent) => {
            if (!onPoiClick || !mapRef.current) return;
            try {
                const features = mapRef.current.queryRenderedFeatures(e.point);
                if (features.length === 0) return;
                // Prioriser les couches POI / lieu
                const poiFeature = features.find((f) => f.layer?.id && POI_LAYER_IDS.includes(f.layer.id))
                    ?? features[0];
                const lngLat = e.lngLat;
                onPoiClick(
                    {
                        id: poiFeature.id,
                        layer: poiFeature.layer as { id: string },
                        source: poiFeature.source,
                        sourceLayer: poiFeature.sourceLayer,
                        properties: poiFeature.properties as Record<string, unknown>,
                        geometry: poiFeature.geometry,
                    },
                    { lng: lngLat.lng, lat: lngLat.lat }
                );
            } catch {
                // Style pas encore chargé ou erreur de requête
            }
        },
        [onPoiClick]
    );

    const handleMouseMove = useCallback((e: MapMouseEvent) => {
        if (!mapRef.current) return;
        try {
            const features = mapRef.current.queryRenderedFeatures(e.point);
            const poiFeature = features.find(
                (f) => f.layer?.id && POI_LAYER_IDS.includes(f.layer.id)
            );
            const isOverPoi = !!poiFeature;
            setCursor(isOverPoi ? 'pointer' : '');

            if (isOverPoi && onPoiHover) {
                const rect = containerRef.current?.getBoundingClientRect();
                const screenX = rect ? rect.left + e.point.x : e.point.x;
                const screenY = rect ? rect.top + e.point.y : e.point.y;
                onPoiHover(
                    {
                        id: poiFeature.id,
                        layer: poiFeature.layer as { id: string },
                        source: poiFeature.source,
                        sourceLayer: poiFeature.sourceLayer,
                        properties: poiFeature.properties as Record<string, unknown>,
                        geometry: poiFeature.geometry,
                    },
                    { lng: e.lngLat.lng, lat: e.lngLat.lat },
                    { x: screenX, y: screenY }
                );
            } else if (!isOverPoi && onPoiLeave) {
                onPoiLeave();
            }
        } catch {
            setCursor('');
            onPoiLeave?.();
        }
    }, [onPoiHover, onPoiLeave]);

    const handleMouseLeave = useCallback(() => {
        setCursor('');
        onPoiLeave?.();
    }, [onPoiLeave]);

    return (
        <div
            ref={containerRef}
            className={className}
            style={{ width, height, position: 'relative' }}
            onMouseLeave={handleMouseLeave}
        >
            <Map
                ref={mapRef}
                {...viewState}
                onMove={handleMove}
                onMouseMove={handleMouseMove}
                onClick={onPoiClick ? handleClick : undefined}
                cursor={cursor || 'grab'}
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

