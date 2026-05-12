import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { listTrips, getTrip, createTrip, deleteTrip } from '../trips-client';

function mockFetch(response: { ok: boolean; status?: number; body: unknown }) {
  const status = response.status ?? (response.ok ? 200 : 400);
  // 204/205 reject body per fetch spec — return null
  const noBody = status === 204 || status === 205;
  return vi.fn(async () =>
    new Response(noBody ? null : JSON.stringify(response.body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

describe('trips-client', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('listTrips', () => {
    it('returns the items array on success', async () => {
      global.fetch = mockFetch({
        ok: true,
        body: { success: true, data: { items: [{ id: '1', title: 'A' }, { id: '2', title: 'B' }] } },
      });

      const trips = await listTrips('token');

      expect(trips).toHaveLength(2);
      expect(trips[0].id).toBe('1');
    });

    it('returns empty array when no items', async () => {
      global.fetch = mockFetch({ ok: true, body: { success: true, data: {} } });

      const trips = await listTrips('token');

      expect(trips).toEqual([]);
    });

    it('throws on API error', async () => {
      global.fetch = mockFetch({
        ok: false,
        status: 401,
        body: { error: { message: 'Token expiré' } },
      });

      await expect(listTrips('bad-token')).rejects.toThrow('Token expiré');
    });
  });

  describe('getTrip', () => {
    it('returns trip data on success', async () => {
      global.fetch = mockFetch({
        ok: true,
        body: { success: true, data: { id: '42', title: 'My Trip' } },
      });

      const trip = await getTrip('token', '42');

      expect(trip.id).toBe('42');
      expect(trip.title).toBe('My Trip');
    });

    it('throws on 404', async () => {
      global.fetch = mockFetch({
        ok: false,
        status: 404,
        body: { error: { message: 'Trip not found' } },
      });

      await expect(getTrip('token', '99')).rejects.toThrow('Trip not found');
    });
  });

  describe('createTrip', () => {
    it('posts payload and returns created trip', async () => {
      const fetchMock = mockFetch({
        ok: true,
        status: 201,
        body: { success: true, data: { id: '7', title: 'New' } },
      });
      global.fetch = fetchMock;

      const trip = await createTrip('tok', {
        title: 'New',
        destination: 'Paris',
        start_date: '2026-06-01',
        end_date: '2026-06-05',
      });

      expect(trip.id).toBe('7');
      const call = fetchMock.mock.calls[0];
      expect((call[1] as RequestInit).method).toBe('POST');
    });
  });

  describe('deleteTrip', () => {
    it('resolves silently on 204', async () => {
      global.fetch = mockFetch({ ok: true, status: 204, body: {} });

      await expect(deleteTrip('tok', '1')).resolves.toBeUndefined();
    });
  });
});
