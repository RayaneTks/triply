'use client';

import { apiFetch } from './http';

export const CONSENT_VERSION = '1.0';
export const CONSENT_STORAGE_KEY = 'triply-consent-v1';

export interface ConsentChoices {
    analytics: boolean;
    marketing: boolean;
    functional: boolean;
}

export interface ConsentRecord extends ConsentChoices {
    version: string;
    /** Horodatage local d'enregistrement du choix (ISO). */
    decided_at: string;
}

interface ConsentResource {
    attributes: ConsentChoices & { version: string };
}

/** Lit le choix de consentement stocké localement (gate d'affichage du bandeau). */
export function getStoredConsent(): ConsentRecord | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Partial<ConsentRecord> | null;
        if (!parsed || parsed.version !== CONSENT_VERSION) return null;
        return {
            analytics: Boolean(parsed.analytics),
            marketing: Boolean(parsed.marketing),
            functional: parsed.functional !== false,
            version: CONSENT_VERSION,
            decided_at: typeof parsed.decided_at === 'string' ? parsed.decided_at : new Date().toISOString(),
        };
    } catch {
        return null;
    }
}

function persistLocal(choices: ConsentChoices): ConsentRecord {
    const record: ConsentRecord = {
        ...choices,
        functional: true,
        version: CONSENT_VERSION,
        decided_at: new Date().toISOString(),
    };
    if (typeof window !== 'undefined') {
        try {
            window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
        } catch {
            /* quota / mode privé : le bandeau réapparaîtra, sans casser le flux */
        }
    }
    return record;
}

/**
 * Enregistre le consentement : localStorage en priorité (gate immédiat), puis
 * best-effort vers le backend (/consent). L'échec réseau ne bloque pas l'UX —
 * le choix local fait foi pour l'affichage du bandeau.
 */
export async function saveConsent(choices: ConsentChoices): Promise<ConsentRecord> {
    const record = persistLocal(choices);
    try {
        await apiFetch<ConsentResource>('/consent', {
            method: 'POST',
            authenticated: true,
            body: {
                analytics: choices.analytics,
                marketing: choices.marketing,
                functional: true,
                version: CONSENT_VERSION,
            },
        });
    } catch {
        /* offline ou anonyme sans session : on garde le choix local */
    }
    return record;
}
