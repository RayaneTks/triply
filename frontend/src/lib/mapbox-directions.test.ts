import { describe, expect, it } from 'vitest';
import {
    coordsNearlyEqual,
    defaultProfileForDistance,
    fetchMapboxLegRoute,
    haversineKm,
    straightLineGeometry,
} from './mapbox-directions';

describe('mapbox-directions', () => {
    it('haversineKm returns plausible distance', () => {
        const km = haversineKm(48.8566, 2.3522, 48.8738, 2.295);
        expect(km).toBeGreaterThan(4);
        expect(km).toBeLessThan(6);
    });

    it('defaultProfileForDistance picks walking for short legs', () => {
        expect(defaultProfileForDistance(0.5)).toBe('walking');
        expect(defaultProfileForDistance(5)).toBe('driving');
    });

    it('fetchMapboxLegRoute falls back to straight line without token', async () => {
        const a = { lng: 2.35, lat: 48.85 };
        const b = { lng: 2.36, lat: 48.86 };
        const result = await fetchMapboxLegRoute('', 'walking', a, b);
        expect(result.geometry?.type).toBe('LineString');
        expect(result.geometry?.coordinates.length).toBeGreaterThanOrEqual(2);
        expect(result.duration).toBeGreaterThan(0);
    });

    it('straightLineGeometry connects two points', () => {
        const geom = straightLineGeometry({ lng: 1, lat: 2 }, { lng: 3, lat: 4 });
        expect(geom.coordinates).toEqual([
            [1, 2],
            [3, 4],
        ]);
    });

    it('coordsNearlyEqual detects identical points', () => {
        expect(coordsNearlyEqual({ lng: 1, lat: 2 }, { lng: 1, lat: 2 })).toBe(true);
        expect(coordsNearlyEqual({ lng: 1, lat: 2 }, { lng: 2, lat: 3 })).toBe(false);
    });
});
