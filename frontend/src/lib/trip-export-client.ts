'use client';

import { apiFetchBlob, triggerBlobDownload } from './http';

/**
 * Exports tangibles d'un voyage. Le backend (TripExportController) renvoie un
 * binaire avec Content-Disposition: attachment. On déclenche le download côté
 * navigateur en réutilisant le filename serveur, avec un repli local.
 */

function downloadTripExport(
    tripId: string,
    kind: 'pdf' | 'ics',
    fallbackName: string,
): Promise<void> {
    return apiFetchBlob(`/trips/${tripId}/export/${kind}`, {
        method: 'POST',
        body: {
            locale: 'fr-FR',
            timezone: typeof Intl !== 'undefined'
                ? Intl.DateTimeFormat().resolvedOptions().timeZone
                : undefined,
        },
    }).then(({ blob, filename }) => {
        triggerBlobDownload(blob, filename || fallbackName);
    });
}

export function exportTripPdf(tripId: string): Promise<void> {
    return downloadTripExport(tripId, 'pdf', `voyage-${tripId}.pdf`);
}

export function exportTripIcs(tripId: string): Promise<void> {
    return downloadTripExport(tripId, 'ics', `voyage-${tripId}.ics`);
}
