import React, { useState, useRef, useCallback, useEffect } from 'react';
// AJOUT : Import de Source et Layer
import { Map, Source, Layer } from 'react-map-gl/mapbox';
import type { ViewState, MapRef } from 'react-map-gl/mapbox';
import type { Map as MapboxMap, MapMouseEvent } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

/** Id de la couche fill-extrusion pour les bâtiments 3D (uniquement pour styles classiques) */
const LAYER_3D_BUILDINGS_ID = 'add-3d-buildings';

const AIRPORTS_DATA_SOURCE = 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_10m_airports.geojson';

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

type PoiFeatureInput = { id?: string | number; layer?: { id?: string }; source?: string; sourceLayer?: string; properties?: Record<string, unknown> | null; geometry?: GeoJSON.Geometry };

/** Retourne la feature POI la plus pertinente (classic ou Standard) */
function pickPoiFeature<T extends PoiFeatureInput>(features: T[]): T | undefined {
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
    type?: string;
    zoom?: number;
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
    /** Callback appelé quand on clique sur un aéroport */
    onAirportSelect?: (iataCode: string, name: string, lat: number, lng: number) => void;
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
    /** Routes par profil (voiture, vélo, à pied) avec géométrie et durée en secondes */
    routeData?: Partial<Record<'driving' | 'walking' | 'cycling', { geometry: GeoJSON.LineString; duration: number }>>;
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
                                                 onAirportSelect,
                                                 showNavigationControls: _showNavigationControls = true,
                                                 showGeolocateControl: _showGeolocateControl = false,
                                                 showFullscreenControl: _showFullscreenControl = false,
                                                 showAttribution = false,
                                                 showLogo = false,
                                                 locations = [],
                                                 routeData = {},
                                             }: MapProps) => {
    const mapRef = useRef<MapRef>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const mapStyleRef = useRef(mapStyle);
    mapStyleRef.current = mapStyle;
    const [cursor, setCursor] = useState<string>('');
    const [hoveredRoute, setHoveredRoute] = useState<{ profile: string; duration: number; x: number; y: number } | null>(null);
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [isStyleReady, setIsStyleReady] = useState(false);

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

    // Redimensionner la carte quand le conteneur change (ex: sidebar ouverte/fermée)
    useEffect(() => {
        const container = containerRef.current;
        const map = mapRef.current?.getMap();
        if (!container || !map || !isMapLoaded) return;

        const resizeMap = () => {
            requestAnimationFrame(() => {
                try {
                    map.resize();
                } catch {
                    // Ignorer si la carte n'est pas encore prête
                }
            });
        };

        const ro = new ResizeObserver(resizeMap);
        ro.observe(container);

        return () => ro.disconnect();
    }, [isMapLoaded]);

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

    const prevLocationsRef = useRef<typeof locations>([]);

    // Dans src/components/Map/Map.tsx

    useEffect(() => {
        if (!isMapLoaded || !mapRef.current) return;

        if (locations.length === 0) {
            prevLocationsRef.current = locations;
            mapRef.current.flyTo({
                center: [0, 0],
                zoom: 1,
                duration: 4000,
                essential: true
            });
            return;
        }

        // --- AJUSTEMENT FONCTIONNEL ICI ---

        // Cas 1 : Une seule destination (ex: réponse Assistant "France" ou "Paris")
        // On respecte strictement le zoom défini par l'IA/Backend
        if (locations.length === 1) {
            const loc = locations[0];

            // On utilise flyTo au lieu de fitBounds pour contrôler le niveau de zoom précis
            mapRef.current.flyTo({
                center: [loc.coordinates.longitude, loc.coordinates.latitude],
                zoom: loc.zoom ?? 11, // Utilise le zoom du backend (5 ou 12), sinon 11 par défaut
                duration: 2000,
                essential: true
            });

            prevLocationsRef.current = locations;
            return;
        }

        // Cas 2 : Plusieurs points (ex: Hôtels chargés)
        // On garde la logique fitBounds pour englober tous les points
        const lngs = locations.map(l => l.coordinates.longitude);
        const lats = locations.map(l => l.coordinates.latitude);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);

        const isRefresh = prevLocationsRef.current.length > 0 && locations.length > prevLocationsRef.current.length;
        prevLocationsRef.current = locations;

        mapRef.current.fitBounds(
            [
                [minLng, minLat],
                [maxLng, maxLat]
            ],
            {
                padding: { top: 100, bottom: 100, left: 100, right: 100 },
                duration: isRefresh ? 800 : 2000,
                essential: true,
                maxZoom: 13 // On peut augmenter un peu le maxZoom autorisé quand on affiche des hôtels
            }
        );
    }, [locations, isMapLoaded]);

    const add3DBuildingsLayer = useCallback((map: MapboxMap, currentMapStyle: string) => {
        if (IS_MAPBOX_STANDARD(currentMapStyle)) return;
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
        if (!mapRef.current) return;

        try {
            const features = mapRef.current.queryRenderedFeatures(e.point);

            // 1. GESTION CLIC AÉROPORT (Prioritaire)
            const airportFeature = features.find(f => f.layer?.id === 'airports-layer');
            if (airportFeature && onAirportSelect) {
                const iata = airportFeature.properties?.iata_code;
                const name = airportFeature.properties?.name;

                // AJOUT : Récupération des coordonnées géographiques
                // Dans un GeoJSON Point, coordinates est un tableau [lng, lat]
                const geometry = airportFeature.geometry as any; // Cast rapide car on sait que c'est un Point
                const [lng, lat] = geometry.coordinates;

                if (iata) {
                    // On passe lat/lng au parent
                    onAirportSelect(iata, name || 'Aéroport', lat, lng);
                    return;
                }
            }

            // 2. GESTION CLIC POI (Classique)
            if (onPoiClick) {
                const poiFeature = pickPoiFeature(features);
                if (!poiFeature) return;

                // On s'assure que ce n'est pas l'aéroport qu'on a cliqué par erreur comme POI
                if (poiFeature.layer?.id === 'airports-layer') return;

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
            }
        } catch {}
    }, [onPoiClick, onAirportSelect]);

    const routeProfileLabels: Record<string, string> = { driving: 'Voiture', walking: 'À pied', cycling: 'Vélo' };

    const handleMouseMove = useCallback((e: MapMouseEvent) => {
        if (!mapRef.current) return;
        try {
            const features = mapRef.current.queryRenderedFeatures(e.point);
            const rect = containerRef.current?.getBoundingClientRect();
            const screenX = rect ? rect.left + e.point.x : e.point.x;
            const screenY = rect ? rect.top + e.point.y : e.point.y;

            // Check survol route (priorité haute pour le tooltip)
            const routeLayerId = features.find((f) =>
                f.layer?.id?.startsWith('route-layer-')
            )?.layer?.id;
            if (routeLayerId && routeData) {
                const profile = routeLayerId.replace('route-layer-', '') as 'driving' | 'walking' | 'cycling';
                const route = routeData[profile];
                if (route) {
                    setHoveredRoute({
                        profile: routeProfileLabels[profile] ?? profile,
                        duration: route.duration,
                        x: screenX,
                        y: screenY,
                    });
                    setCursor('pointer');
                    onPoiLeave?.();
                    return;
                }
            }
            setHoveredRoute(null);

            // Check si survol aéroport
            const isOverAirport = features.some(f => f.layer?.id === 'airports-layer');

            const poiFeature = pickPoiFeature(features);
            const isOverPoi = !!poiFeature;

            // Priorité curseur : Aéroport > POI
            setCursor(isOverAirport || isOverPoi ? 'pointer' : '');

            // Si on survole un aéroport, on n'affiche pas la popup du POI pour éviter la confusion
            if (isOverAirport) {
                onPoiLeave?.();
                return;
            }

            if (isOverPoi && onPoiHover) {
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
            setHoveredRoute(null);
            onPoiLeave?.();
        }
    }, [onPoiHover, onPoiLeave, routeData]);

    const locationsGeoJson = React.useMemo(() => {
        if (!locations || locations.length === 0) return null;
        return {
            type: 'FeatureCollection',
            features: locations.map(loc => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [loc.coordinates.longitude, loc.coordinates.latitude]
                },
                properties: {
                    id: loc.id,
                    title: loc.title,
                    type: loc.type || 'hotel'
                }
            }))
        };
    }, [locations]);

    return (
        <div
            ref={containerRef}
            className={className}
            style={{ width, height, position: 'relative' }}
            onMouseLeave={() => { setCursor(''); setHoveredRoute(null); onPoiLeave?.(); }}
        >
            <Map
                ref={mapRef}
                {...(autoRotateSpeed != null ? (({ bearing: _b, ...v }) => v)(viewState) : viewState)}
                {...(autoRotateSpeed == null && typeof bearing === 'number' ? { bearing } : {})}
                {...(typeof pitch === 'number' ? { pitch } : {})}
                onMove={handleMove}
                onMouseMove={handleMouseMove}
                onClick={handleClick} // Utilise handleClick qui gère Aéroports + POI
                onLoad={() => {
                    setIsMapLoaded(true);
                    const map = mapRef.current?.getMap();
                    if (!map) return;

                    // Marquer le style comme prêt uniquement quand mapbox le signale
                    const checkStyleReady = () => {
                        try {
                            if (map.isStyleLoaded()) {
                                setIsStyleReady(true);
                            }
                        } catch {
                            // ignore
                        }
                    };
                    checkStyleReady();
                    map.on('styledata', checkStyleReady);

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
                interactiveLayerIds={
                    onPoiClick || Object.keys(routeData || {}).length > 0
                        ? undefined
                        : ['airports-layer']
                }
                {...(mapConfig && IS_MAPBOX_STANDARD(mapStyle) && {
                    config: {
                        basemap: Object.fromEntries(
                            Object.entries(mapConfig).filter(([, v]) => v != null)
                        ) as { lightPreset?: string; theme?: string },
                    },
                })}
            >
                {isMapLoaded && isStyleReady && (
                    <Source id="airports-source" type="geojson" data={AIRPORTS_DATA_SOURCE}>
                        <Layer
                            id="airports-layer"
                            type="circle"
                            paint={{
                                'circle-radius': [
                                    'interpolate', ['linear'], ['zoom'],
                                    2, 2,
                                    6, 6
                                ],
                                'circle-color': '#ff4d4d',
                                'circle-stroke-width': 1,
                                'circle-stroke-color': '#ffffff',
                                'circle-opacity': 0.8
                            }}
                        />
                        <Layer
                            id="airports-labels"
                            type="symbol"
                            layout={{
                                'text-field': ['get', 'iata_code'],
                                'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                                'text-size': 10,
                                'text-offset': [0, 1.2],
                                'text-anchor': 'top',
                                'visibility': 'visible'
                            }}
                            paint={{
                                'text-color': '#ffffff'
                            }}
                            minzoom={4}
                        />
                    </Source>
                )}
                {isMapLoaded && isStyleReady && locationsGeoJson && (
                    <Source id="locations-source" type="geojson" data={locationsGeoJson as any}>
                        <Layer
                            id="locations-layer-labels"
                            type="symbol"
                            layout={{
                                'text-field': ['get', 'title'],
                                'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                                'text-size': 11,
                                'text-offset': [0, 1.3],
                                'text-anchor': 'top',
                            }}
                            paint={{
                                'text-color': '#3b82f6',
                                'text-halo-color': '#ffffff',
                                'text-halo-width': 2
                            }}
                            minzoom={11}
                        />
                    </Source>
                )}
                {isMapLoaded && isStyleReady && routeData && Object.entries(routeData).map(([profile, { geometry }]) => {
                    const colors: Record<string, string> = {
                        driving: '#f97316',
                        walking: '#22d3ee',
                        cycling: '#84cc16',
                    };
                    return (
                        <Source
                            key={`route-${profile}`}
                            id={`route-source-${profile}`}
                            type="geojson"
                            data={{
                                type: 'Feature',
                                geometry,
                                properties: {},
                            }}
                        >
                            <Layer
                                id={`route-layer-${profile}`}
                                type="line"
                                layout={{
                                    'line-join': 'round',
                                    'line-cap': 'round',
                                }}
                                paint={{
                                    'line-color': colors[profile] ?? '#22d3ee',
                                    'line-width': 5,
                                    'line-opacity': 0.85,
                                }}
                            />
                        </Source>
                    );
                })}
            </Map>

            {routeData && Object.keys(routeData).length > 0 && (
                <div className="absolute bottom-4 left-4 z-10 rounded-full border border-white/15 bg-slate-900/95 px-4 py-2 shadow-lg backdrop-blur-md">
                    <span className="flex items-center gap-2 text-[13px] font-medium text-slate-100">
                        <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{
                                backgroundColor:
                                    Object.keys(routeData)[0] === 'driving'
                                        ? '#f97316'
                                        : Object.keys(routeData)[0] === 'cycling'
                                          ? '#84cc16'
                                          : '#22d3ee',
                            }}
                        />
                        {routeProfileLabels[Object.keys(routeData)[0]] ?? Object.keys(routeData)[0]} · {Object.values(routeData)[0] && `${Math.round(Object.values(routeData)[0].duration / 60)} min`}
                    </span>
                </div>
            )}
            {hoveredRoute && (
                <div
                    className="pointer-events-none fixed z-[1000] rounded-full border border-white/20 bg-slate-900/95 px-4 py-2 text-[13px] font-medium text-slate-100 shadow-xl backdrop-blur-md"
                    style={{
                        left: hoveredRoute.x + 14,
                        top: hoveredRoute.y + 14,
                    }}
                >
                    {hoveredRoute.profile} · {Math.round(hoveredRoute.duration / 60)} min
                </div>
            )}

            {(!showLogo || !showAttribution) && (
                <style>{`
                    .mapboxgl-ctrl-logo, .mapboxgl-ctrl-attrib, .mapboxgl-ctrl-attrib-inner, 
                    a[href*="mapbox.com"], a[href*="openstreetmap.org"] { display: none !important; }
                `}</style>
            )}
        </div>
    );
};