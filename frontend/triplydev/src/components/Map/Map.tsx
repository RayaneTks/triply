'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Map, Source, Layer } from 'react-map-gl/mapbox';
import type { ViewState, MapRef } from 'react-map-gl/mapbox';
import type { Map as MapboxMap, MapMouseEvent } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const AIRPORTS_DATA_SOURCE = 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_10m_airports.geojson';

const IS_MAPBOX_STANDARD = (url: string) =>
    url.includes('mapbox/standard') || url.includes('mapbox/standard-satellite');

const POI_LAYER_IDS_CLASSIC = [
    'poi-label', 'poi', 'place-label', 'place-village', 'place-town', 'place-city', 'place-country'
];

type PoiFeatureInput = { id?: string | number; layer?: { id?: string }; source?: string; sourceLayer?: string; properties?: Record<string, unknown> | null; geometry?: GeoJSON.Geometry };

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

interface Coordinates { latitude: number; longitude: number; }

interface Location {
    id: string;
    title: string;
    coordinates: Coordinates;
    type?: string;
    zoom?: number;
}

export type RouteMapSegment = {
    id: string;
    profile: 'driving' | 'walking' | 'cycling';
    geometry: GeoJSON.LineString;
    durationSec: number;
};

export interface MapProps {
    accessToken: string;
    initialLatitude?: number;
    initialLongitude?: number;
    initialZoom?: number;
    mapStyle?: string;
    mapConfig?: { lightPreset?: 'day' | 'dusk' | 'dawn' | 'night'; theme?: 'default' | 'faded' | 'monochrome' };
    pitch?: number;
    bearing?: number;
    interactive?: boolean;
    autoRotateSpeed?: number;
    height?: string;
    width?: string;
    className?: string;
    onMove?: (viewState: ViewState) => void;
    padding?: { top?: number; bottom?: number; left?: number; right?: number };
    onPoiClick?: (feature: MapboxPoiFeature, lngLat: { lng: number; lat: number }) => void;
    onPoiHover?: (feature: MapboxPoiFeature, lngLat: { lng: number; lat: number }, point: { x: number; y: number }) => void;
    onPoiLeave?: () => void;
    onAirportSelect?: (iataCode: string, name: string, lat: number, lng: number) => void;
    showAttribution?: boolean;
    showLogo?: boolean;
    locations?: Location[];
    routeData?: Partial<Record<'driving' | 'walking' | 'cycling', { geometry: GeoJSON.LineString; duration: number; legs?: Array<{ duration: number; distance: number; geometry?: GeoJSON.LineString }>; }>>;
    routeSegments?: RouteMapSegment[];
}

export const WorldMap: React.FC<MapProps> = ({
    accessToken,
    initialLatitude = 46.6,
    initialLongitude = 1.8,
    initialZoom = 5,
    mapStyle = 'mapbox://styles/mapbox/standard',
    mapConfig = { lightPreset: 'night' },
    pitch = 45,
    bearing = 0,
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
    showAttribution = false,
    showLogo = false,
    locations = [],
    routeData = {},
    routeSegments = [],
}) => {
    const mapRef = useRef<MapRef>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [cursor, setCursor] = useState<string>('');
    const [hoveredRoute, setHoveredRoute] = useState<{ profile: string; duration: number; x: number; y: number } | null>(null);
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [isStyleReady, setIsStyleReady] = useState(false);

    const [viewState, setViewState] = useState<ViewState>({
        longitude: initialLongitude,
        latitude: initialLatitude,
        zoom: initialZoom,
        bearing: bearing,
        pitch: pitch,
        padding: padding || { top: 0, bottom: 0, left: 0, right: 0 },
    });

    // Auto-resize
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => mapRef.current?.getMap().resize());
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // Fly to locations
    useEffect(() => {
        if (!isMapLoaded || !mapRef.current || locations.length === 0) return;
        if (locations.length === 1) {
            mapRef.current.flyTo({
                center: [locations[0].coordinates.longitude, locations[0].coordinates.latitude],
                zoom: locations[0].zoom ?? 12,
                duration: 2000,
                essential: true
            });
        } else {
            const lngs = locations.map(l => l.coordinates.longitude);
            const lats = locations.map(l => l.coordinates.latitude);
            mapRef.current.fitBounds(
                [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
                { padding: 100, duration: 2000 }
            );
        }
    }, [locations, isMapLoaded]);

    const handleMouseMove = useCallback((e: MapMouseEvent) => {
        if (!mapRef.current) return;
        const features = mapRef.current.queryRenderedFeatures(e.point);
        const poi = pickPoiFeature(features);
        const isAirport = features.some(f => f.layer?.id === 'airports-layer');
        
        setCursor(poi || isAirport ? 'pointer' : '');
        
        if (poi && onPoiHover) {
            const rect = containerRef.current?.getBoundingClientRect();
            onPoiHover(poi as MapboxPoiFeature, e.lngLat, { 
                x: (rect?.left || 0) + e.point.x, 
                y: (rect?.top || 0) + e.point.y 
            });
        } else {
            onPoiLeave?.();
        }
    }, [onPoiHover, onPoiLeave]);

    const handleClick = useCallback((e: MapMouseEvent) => {
        if (!mapRef.current) return;
        const features = mapRef.current.queryRenderedFeatures(e.point);
        
        const airport = features.find(f => f.layer?.id === 'airports-layer');
        if (airport && onAirportSelect) {
            const coords = (airport.geometry as { coordinates?: unknown } | undefined)?.coordinates;
            if (Array.isArray(coords) && coords.length >= 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
                const [lng, lat] = coords as [number, number];
                onAirportSelect(airport.properties?.iata_code, airport.properties?.name, lat, lng);
            }
            return;
        }

        const poi = pickPoiFeature(features);
        if (poi && onPoiClick) {
            onPoiClick(poi as MapboxPoiFeature, e.lngLat);
        }
    }, [onPoiClick, onAirportSelect]);

    const locationsGeoJson = React.useMemo(() => ({
        type: 'FeatureCollection',
        features: locations.map(loc => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [loc.coordinates.longitude, loc.coordinates.latitude] },
            properties: { id: loc.id, title: loc.title, type: loc.type || 'hotel' }
        }))
    }), [locations]);

    const routeColors: Record<string, string> = { driving: '#06b6d4', walking: '#f97316', cycling: '#84cc16' };

    return (
        <div ref={containerRef} className={`relative w-full h-full overflow-hidden ${className}`}>
            <Map
                ref={mapRef}
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                onMouseMove={handleMouseMove}
                onClick={handleClick}
                onLoad={() => { setIsMapLoaded(true); setIsStyleReady(true); }}
                mapStyle={mapStyle}
                mapboxAccessToken={accessToken}
                cursor={cursor || 'grab'}
                attributionControl={showAttribution}
                fog={{ range: [0.5, 10], color: '#020617', 'high-color': '#0f172a', 'space-color': '#000000', 'star-intensity': 0.5 }}
                terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
                {...(IS_MAPBOX_STANDARD(mapStyle) && {
                    config: { basemap: { lightPreset: mapConfig.lightPreset, theme: mapConfig.theme || 'default' } }
                })}
            >
                <Source id="mapbox-dem" type="raster-dem" url="mapbox://mapbox.mapbox-terrain-dem-v1" tileSize={512} maxzoom={14} />

                {isMapLoaded && isStyleReady && (
                    <>
                        {/* Airports */}
                        <Source id="airports-source" type="geojson" data={AIRPORTS_DATA_SOURCE}>
                            <Layer id="airports-layer" type="circle" paint={{
                                'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 3, 6, 8],
                                'circle-color': '#ef4444',
                                'circle-stroke-width': 2,
                                'circle-stroke-color': '#ffffff',
                                'circle-blur': 0.2
                            }} />
                        </Source>

                        {/* User Locations */}
                        <Source
                            id="locations-source"
                            type="geojson"
                            data={locationsGeoJson as unknown as GeoJSON.FeatureCollection}
                        >
                            <Layer id="locations-itinerary-glow" type="circle" filter={['==', ['get', 'type'], 'itinerary-activity']} paint={{
                                'circle-radius': 12,
                                'circle-color': '#06b6d4',
                                'circle-opacity': 0.2,
                                'circle-blur': 1
                            }} />
                            <Layer id="locations-itinerary-circles" type="circle" filter={['==', ['get', 'type'], 'itinerary-activity']} paint={{
                                'circle-radius': 6,
                                'circle-color': '#06b6d4',
                                'circle-stroke-width': 2,
                                'circle-stroke-color': '#ffffff'
                            }} />
                            <Layer id="locations-labels" type="symbol" layout={{
                                'text-field': ['get', 'title'],
                                'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                                'text-size': 11,
                                'text-offset': [0, 1.5],
                                'text-anchor': 'top'
                            }} paint={{
                                'text-color': '#ffffff',
                                'text-halo-color': '#020617',
                                'text-halo-width': 2
                            }} />
                        </Source>

                        {/* Routes */}
                        {routeSegments.map((seg, idx) => (
                            <Source key={idx} id={`route-seg-${idx}`} type="geojson" data={{ type: 'Feature', geometry: seg.geometry, properties: {} }}>
                                <Layer id={`route-layer-${idx}`} type="line" layout={{ 'line-join': 'round', 'line-cap': 'round' }} paint={{
                                    'line-color': routeColors[seg.profile] || '#06b6d4',
                                    'line-width': 4,
                                    'line-opacity': 0.8,
                                    'line-dasharray': seg.profile === 'walking' ? [1, 2] : [1, 0]
                                }} />
                            </Source>
                        ))}
                    </>
                )}
            </Map>

            {/* Float Info Panel */}
            {routeSegments.length > 0 && (
                <div className="absolute bottom-6 left-6 z-10 rounded-2xl border border-white/10 bg-[#020617]/80 p-4 shadow-2xl backdrop-blur-xl">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Itinéraire Actif</div>
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold text-white font-chillax">
                                {Math.round(routeSegments.reduce((acc, s) => acc + s.durationSec, 0) / 60)} min
                            </span>
                            <span className="text-[10px] text-cyan-400 font-medium">Temps de trajet total</span>
                        </div>
                        <div className="h-8 w-px bg-white/10" />
                        <div className="flex gap-2">
                            {Array.from(new Set(routeSegments.map(s => s.profile))).map(p => (
                                <div key={p} className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400" title={p}>
                                    {p === 'driving' && '🚗'}
                                    {p === 'walking' && '🚶'}
                                    {p === 'cycling' && '🚲'}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .mapboxgl-ctrl-logo, .mapboxgl-ctrl-attrib { display: none !important; }
            `}</style>
        </div>
    );
};
