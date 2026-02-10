import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Map } from 'react-map-gl/mapbox';
import type { ViewState, MapRef } from 'react-map-gl/mapbox';
import type { Map as MapboxMap, MapMouseEvent } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

/** Id de la couche fill-extrusion pour les bâtiments 3D (uniquement pour styles classiques) */
const LAYER_3D_BUILDINGS_ID = 'add-3d-buildings';

/** Styles classiques pour lesquels on ajoute la couche bâtiments 3D. Mapbox Standard a des bâtiments 3D intégrés. */
const STYLES_WITH_3D_BUILDINGS = [
    'mapbox://styles/mapbox/light-v11',
    'mapbox://styles/mapbox/dark-v11',
    'mapbox://styles/mapbox/streets-v12',
];

/** Styles Mapbox Standard (bâtiments 3D intégrés, pas besoin de couche custom) */
const IS_MAPBOX_STANDARD = (url: string) =>
    url.includes('mapbox/standard') || url.includes('mapbox/standard-satellite');

/** Couches du style Mapbox classique considérées comme POI / lieux */
const POI_LAYER_IDS_CLASSIC = [
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

/** Retourne la feature POI la plus pertinente (classic ou Standard) */
function pickPoiFeature(features: Array<{ layer?: { id?: string }; properties?: Record<string, unknown> }>): typeof features[0] | undefined {
    if (!features.length) return undefined;
    const byLayer = features.find((f) => f.layer?.id && POI_LAYER_IDS_CLASSIC.includes(f.layer.id));
    if (byLayer) return byLayer;
    const withName = features.find((f) => f.properties?.name || f.properties?.name_en);
    return withName ?? features[0];
}

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
    /** Style de la carte (par défaut: 'mapbox://styles/mapbox/standard') */
    mapStyle?: string;
    /** Config pour Mapbox Standard (lightPreset, theme, etc.). Appliqué via setConfigProperty. */
    mapConfig?: { lightPreset?: 'day' | 'dusk' | 'dawn' | 'night'; theme?: 'default' | 'faded' | 'monochrome' };
    /** Inclinaison de la carte (0 = 2D, 60 = 3D). Contrôlée par le parent si fourni. */
    pitch?: number;
    /** Orientation de la carte en degrés (0-360). Contrôlée par le parent si fourni. */
    bearing?: number;
    /** Désactive zoom, pan, rotation (carte non interactive). */
    interactive?: boolean;
    /** Vitesse de rotation auto en degrés/seconde (animation fluide, sans passer par React). */
    autoRotateSpeed?: number;
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
                                                 mapStyle = 'mapbox://styles/mapbox/standard',
                                                 mapConfig,
                                                 pitch,
                                                 bearing,
                                                 interactive = true,
                                                 autoRotateSpeed,
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
    const mapStyleRef = useRef(mapStyle);
    mapStyleRef.current = mapStyle;
    const [cursor, setCursor] = useState<string>('');
    const [isMapLoaded, setIsMapLoaded] = useState(false);

    const [viewState, setViewState] = useState<ViewState>({
        longitude: initialLongitude,
        latitude: initialLatitude,
        zoom: initialZoom,
        bearing: bearing ?? 0,
        pitch: pitch ?? 0,
        padding: padding || { top: 0, bottom: 0, left: 0, right: 0 },
    });

    useEffect(() => {
        if (typeof bearing !== 'number' || !isMapLoaded || !mapRef.current) return;
        if (autoRotateSpeed != null) return;
        mapRef.current.getMap().setBearing(bearing);
        if (interactive) setViewState((prev) => ({ ...prev, bearing }));
    }, [bearing, isMapLoaded, interactive, autoRotateSpeed]);

    useEffect(() => {
        if (autoRotateSpeed == null || !isMapLoaded || !mapRef.current) return;
        const map = mapRef.current.getMap();
        const start = performance.now();
        let rafId: number;
        const tick = () => {
            const elapsed = (performance.now() - start) / 1000;
            map.setBearing((elapsed * autoRotateSpeed) % 360);
            rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId);
    }, [autoRotateSpeed, isMapLoaded]);

    useEffect(() => {
        if (!isMapLoaded || !mapRef.current) return;
        const map = mapRef.current.getMap();
        if (!interactive) {
            map.scrollZoom.disable();
            map.dragPan.disable();
            map.dragRotate.disable();
            map.doubleClickZoom.disable();
            map.touchZoomRotate.disable();
        }
        return () => {
            if (interactive) return;
            map.scrollZoom.enable();
            map.dragPan.enable();
            map.dragRotate.enable();
            map.doubleClickZoom.enable();
            map.touchZoomRotate.enable();
        };
    }, [interactive, isMapLoaded]);

    useEffect(() => {
        if (typeof pitch !== 'number' || !isMapLoaded || !mapRef.current) return;
        mapRef.current.getMap().setPitch(pitch);
        if (interactive) setViewState((prev) => ({ ...prev, pitch }));
    }, [pitch, isMapLoaded, interactive]);

    useEffect(() => {
        if (!isMapLoaded || !mapRef.current || !mapConfig) return;
        const map = mapRef.current.getMap();
        if (typeof (map as { setConfigProperty?: unknown }).setConfigProperty !== 'function') return;
        if (!IS_MAPBOX_STANDARD(mapStyle)) return;
        try {
            if (mapConfig.lightPreset) {
                (map as { setConfigProperty: (id: string, prop: string, value: unknown) => void }).setConfigProperty('basemap', 'lightPreset', mapConfig.lightPreset);
            }
            if (mapConfig.theme) {
                (map as { setConfigProperty: (id: string, prop: string, value: unknown) => void }).setConfigProperty('basemap', 'theme', mapConfig.theme);
            }
        } catch {
            // Style non-Standard ou config non supportée
        }
    }, [mapConfig, mapStyle, isMapLoaded]);

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

    const add3DBuildingsLayer = useCallback((map: MapboxMap, currentMapStyle: string) => {
        if (IS_MAPBOX_STANDARD(currentMapStyle)) return; // Standard a des bâtiments 3D intégrés
        if (!STYLES_WITH_3D_BUILDINGS.some((s) => currentMapStyle.includes(s))) return;
        try {
            if (map.getLayer(LAYER_3D_BUILDINGS_ID)) return;
            const style = map.getStyle();
            if (!style.sources?.composite) return;
            const layers = style.layers ?? [];
            const labelLayerId = layers.find(
                (layer) => layer.type === 'symbol' && (layer as { layout?: { 'text-field'?: unknown } }).layout?.['text-field']
            )?.id;
            map.addLayer(
                {
                    id: LAYER_3D_BUILDINGS_ID,
                    source: 'composite',
                    'source-layer': 'building',
                    filter: ['==', 'extrude', 'true'],
                    type: 'fill-extrusion',
                    minzoom: 14,
                    paint: {
                        'fill-extrusion-color': currentMapStyle.includes('dark') ? 'rgba(180, 180, 180, 0.9)' : 'rgba(200, 200, 200, 0.85)',
                        'fill-extrusion-height': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            14,
                            0,
                            14.05,
                            ['get', 'height'],
                        ],
                        'fill-extrusion-base': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            14,
                            0,
                            14.05,
                            ['get', 'min_height'],
                        ],
                        'fill-extrusion-opacity': 0.85,
                    },
                },
                labelLayerId ?? undefined
            );
        } catch {
            // Style sans source composite (ex. satellite) — ignorer
        }
    }, []);

    const handleMove = (evt: { viewState: ViewState }) => {
        const updatedViewState = {
            ...evt.viewState,
            padding: padding || evt.viewState.padding,
        };
        if (interactive) setViewState(updatedViewState);
        onMove?.(updatedViewState);
    };

    const handleClick = useCallback((e: MapMouseEvent) => {
        if (!onPoiClick || !mapRef.current) return;
        try {
            const features = mapRef.current.queryRenderedFeatures(e.point);
            const poiFeature = pickPoiFeature(features);
            if (!poiFeature) return;
            onPoiClick(
                {
                    id: poiFeature.id,
                    layer: poiFeature.layer as { id: string },
                    source: poiFeature.source,
                    sourceLayer: poiFeature.sourceLayer,
                    properties: poiFeature.properties as Record<string, unknown>,
                    geometry: poiFeature.geometry,
                },
                { lng: e.lngLat.lng, lat: e.lngLat.lat }
            );
        } catch {}
    }, [onPoiClick]);

    const handleMouseMove = useCallback((e: MapMouseEvent) => {
        if (!mapRef.current) return;
        try {
            const features = mapRef.current.queryRenderedFeatures(e.point);
            const poiFeature = pickPoiFeature(features);
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
                {...(autoRotateSpeed != null ? (({ bearing: _b, ...v }) => v)(viewState) : viewState)}
                {...(autoRotateSpeed == null && typeof bearing === 'number' ? { bearing } : {})}
                {...(typeof pitch === 'number' ? { pitch } : {})}
                onMove={handleMove}
                onMouseMove={handleMouseMove}
                onClick={onPoiClick ? handleClick : undefined}
                onLoad={() => {
                    setIsMapLoaded(true);
                    const map = mapRef.current?.getMap();
                    if (!map) return;
                    if (!IS_MAPBOX_STANDARD(mapStyleRef.current)) {
                        add3DBuildingsLayer(map, mapStyleRef.current);
                        map.on('style.load', () => add3DBuildingsLayer(map, mapStyleRef.current));
                    }
                }}
                cursor={interactive ? (cursor || 'grab') : 'default'}
                style={{ width: '100%', height: '100%' }}
                mapStyle={mapStyle}
                mapboxAccessToken={accessToken}
                attributionControl={showAttribution}
                {...(mapConfig && IS_MAPBOX_STANDARD(mapStyle) && {
                    config: {
                        basemap: Object.fromEntries(
                            Object.entries(mapConfig).filter(([, v]) => v != null)
                        ) as { lightPreset?: string; theme?: string },
                    },
                })}
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