import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Map } from 'react-map-gl/mapbox';
import type { ViewState, MapRef } from 'react-map-gl/mapbox';
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

interface Coordinates {
    latitude: number;
    longitude: number;
}

interface Location {
    id: string;
    title: string;
    coordinates: Coordinates;
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

    locations?: Location[];
}

export const WorldMap: React.FC<MapProps> = ({
                                                 accessToken,
                                                 initialLatitude = 0,
                                                 initialLongitude = 0,
                                                 initialZoom = 1,
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
                                                 locations = [],
                                             }: MapProps) => {
    const mapRef = useRef<MapRef>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [cursor, setCursor] = useState<string>('');
    const [isMapLoaded, setIsMapLoaded] = useState(false);

    const [viewState, setViewState] = useState<ViewState>({
        longitude: initialLongitude,
        latitude: initialLatitude,
        zoom: initialZoom,
        bearing: 0,
        pitch: 0,
        padding: padding || { top: 0, bottom: 0, left: 0, right: 0 },
    });

    useEffect(() => {
        if (!isMapLoaded || !mapRef.current) return;

        if (locations.length === 0) {
            mapRef.current.flyTo({
                center: [0, 0],
                zoom: 1,
                duration: 4000,
                essential: true
            });
            return;
        }

        const lngs = locations.map(l => l.coordinates.longitude);
        const lats = locations.map(l => l.coordinates.latitude);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);

        mapRef.current.fitBounds(
            [
                [minLng, minLat],
                [maxLng, maxLat]
            ],
            {
                padding: { top: 100, bottom: 100, left: 100, right: 100 },
                duration: 3500,
                essential: true,
                maxZoom: 11
            }
        );
    }, [locations, isMapLoaded]);

    const handleMove = (evt: { viewState: ViewState }) => {
        const updatedViewState = {
            ...evt.viewState,
            padding: padding || evt.viewState.padding,
        };
        setViewState(updatedViewState);
        onMove?.(updatedViewState);
    };

    const handleClick = useCallback((e: MapMouseEvent) => {
        if (!onPoiClick || !mapRef.current) return;
        try {
            const features = mapRef.current.queryRenderedFeatures(e.point);
            if (features.length === 0) return;
            const poiFeature = features.find((f) => f.layer?.id && POI_LAYER_IDS.includes(f.layer.id)) ?? features[0];
            onPoiClick(
                { ...poiFeature } as MapboxPoiFeature,
                { lng: e.lngLat.lng, lat: e.lngLat.lat }
            );
        } catch {}
    }, [onPoiClick]);

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

    return (
        <div
            ref={containerRef}
            className={className}
            style={{ width, height, position: 'relative' }}
            onMouseLeave={() => { setCursor(''); onPoiLeave?.(); }}
        >
            <Map
                ref={mapRef}
                {...viewState}
                onMove={handleMove}
                onMouseMove={handleMouseMove}
                onClick={onPoiClick ? handleClick : undefined}
                onLoad={() => setIsMapLoaded(true)}
                cursor={cursor || 'grab'}
                style={{ width: '100%', height: '100%' }}
                mapStyle={mapStyle}
                mapboxAccessToken={accessToken}
                attributionControl={showAttribution}
            />
            {(!showLogo || !showAttribution) && (
                <style>{`
                    .mapboxgl-ctrl-logo, .mapboxgl-ctrl-attrib, .mapboxgl-ctrl-attrib-inner, 
                    a[href*="mapbox.com"], a[href*="openstreetmap.org"] { display: none !important; }
                `}</style>
            )}
        </div>
    );
};