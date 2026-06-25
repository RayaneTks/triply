import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { exportTripPdf, exportTripIcs } from '../trip-export-client';

function mockBlobResponse(mime: string, filename: string) {
    // Réponse factice : undici/jsdom ne sait pas construire `new Response(Blob)`
    // (Blob jsdom sans `.stream()`). On simule l'interface utilisée par apiFetchBlob.
    const blob = new Blob(['%PDF-1.4 fake'], { type: mime });
    const headers = new Headers({
        'Content-Type': mime,
        'Content-Disposition': `attachment; filename="${filename}"`,
    });
    return vi.fn(async () => ({
        ok: true,
        status: 200,
        headers,
        blob: async () => blob,
    } as unknown as Response));
}

describe('trip-export-client', () => {
    let originalFetch: typeof fetch;
    let clickSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        originalFetch = global.fetch;
        // jsdom n'implémente pas createObjectURL : on le stub.
        (URL as unknown as { createObjectURL: () => string }).createObjectURL = vi.fn(() => 'blob:fake');
        (URL as unknown as { revokeObjectURL: () => void }).revokeObjectURL = vi.fn();
        clickSpy = vi.fn();
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(clickSpy);
    });

    afterEach(() => {
        global.fetch = originalFetch;
        vi.restoreAllMocks();
    });

    it('POSTs the PDF export route and triggers a download', async () => {
        const fetchMock = mockBlobResponse('application/pdf', 'voyage.pdf');
        global.fetch = fetchMock;

        await exportTripPdf('42');

        const [url, init] = fetchMock.mock.calls[0];
        expect(String(url)).toContain('/trips/42/export/pdf');
        expect((init as RequestInit).method).toBe('POST');
        expect(clickSpy).toHaveBeenCalledTimes(1);
    });

    it('POSTs the ICS export route', async () => {
        const fetchMock = mockBlobResponse('text/calendar', 'voyage.ics');
        global.fetch = fetchMock;

        await exportTripIcs('7');

        const [url] = fetchMock.mock.calls[0];
        expect(String(url)).toContain('/trips/7/export/ics');
        expect(clickSpy).toHaveBeenCalledTimes(1);
    });

    it('throws a readable error when the backend returns an error envelope', async () => {
        global.fetch = vi.fn(async () =>
            new Response(JSON.stringify({ error: { message: 'Voyage introuvable.' } }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            }),
        );

        await expect(exportTripPdf('999')).rejects.toThrow('Voyage introuvable.');
    });
});
