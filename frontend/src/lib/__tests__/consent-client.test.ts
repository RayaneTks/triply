import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    getStoredConsent,
    saveConsent,
    CONSENT_STORAGE_KEY,
    CONSENT_VERSION,
} from '../consent-client';

function mockFetchOk() {
    return vi.fn(async () =>
        new Response(JSON.stringify({ success: true, data: { attributes: {} } }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        }),
    );
}

describe('consent-client', () => {
    let originalFetch: typeof fetch;

    beforeEach(() => {
        originalFetch = global.fetch;
        window.localStorage.clear();
    });

    afterEach(() => {
        global.fetch = originalFetch;
        vi.restoreAllMocks();
        window.localStorage.clear();
    });

    it('returns null when nothing stored (banner shows)', () => {
        expect(getStoredConsent()).toBeNull();
    });

    it('persists the choice locally and posts to /consent', async () => {
        const fetchMock = mockFetchOk();
        global.fetch = fetchMock;

        const record = await saveConsent({ analytics: true, marketing: false, functional: true });

        expect(record.analytics).toBe(true);
        expect(record.marketing).toBe(false);
        expect(record.functional).toBe(true); // toujours forcé à true
        expect(record.version).toBe(CONSENT_VERSION);

        // localStorage écrit → le bandeau ne réapparaît plus
        const stored = getStoredConsent();
        expect(stored).not.toBeNull();
        expect(stored?.analytics).toBe(true);

        // POST best-effort effectué
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [, init] = fetchMock.mock.calls[0];
        expect((init as RequestInit).method).toBe('POST');
    });

    it('keeps the local choice even if the backend call fails', async () => {
        global.fetch = vi.fn(async () => {
            throw new Error('offline');
        });

        const record = await saveConsent({ analytics: false, marketing: false, functional: true });

        expect(record.analytics).toBe(false);
        expect(getStoredConsent()?.decided_at).toBeTruthy();
    });

    it('ignores a stored choice from a previous consent version', () => {
        window.localStorage.setItem(
            CONSENT_STORAGE_KEY,
            JSON.stringify({ analytics: true, marketing: true, functional: true, version: '0.9' }),
        );
        expect(getStoredConsent()).toBeNull();
    });
});
