'use client';

export interface AuthUser {
    id: number | string;
    name: string;
    email: string;
    email_verified_at?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface AuthSession {
    token: string;
    user: AuthUser | null;
}

export interface UserPreferences {
    environments?: string[];
    traveler_profile?: string | null;
    interests?: string[];
    pace?: string | null;
    food_preference?: string | null;
    diet?: string[];
    breakfast_included?: boolean | null;
    max_budget?: number | null;
    visited_cities?: string[];
}

interface ApiSuccess<T> {
    success: boolean;
    data: T;
    meta?: Record<string, unknown>;
}

interface ApiErrorResponse {
    success?: boolean;
    message?: string;
    error?: {
        code?: string;
        message?: string;
        details?: Record<string, string[]>;
    };
}

const AUTH_STORAGE_KEY = 'triply_auth_session';
const API_BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_API_URL || '/api/v1').replace(/\/$/, '');

function getApiUrl(path: string): string {
    return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

function getFirstErrorDetail(details?: Record<string, string[]>): string | null {
    if (!details) {
        return null;
    }

    for (const messages of Object.values(details)) {
        if (Array.isArray(messages) && messages.length > 0 && typeof messages[0] === 'string' && messages[0].trim() !== '') {
            return messages[0];
        }
    }

    return null;
}

function getErrorMessage(payload: ApiErrorResponse | null, fallback: string): string {
    const detailMessage = getFirstErrorDetail(payload?.error?.details);
    return detailMessage || payload?.error?.message || payload?.message || fallback;
}

async function parseJsonResponse<T>(response: Response, fallback: string): Promise<T> {
    const payload = (await response.json().catch(() => null)) as ApiErrorResponse | ApiSuccess<T> | null;

    if (!response.ok) {
        throw new Error(getErrorMessage(payload as ApiErrorResponse | null, fallback));
    }

    const successPayload = payload as ApiSuccess<T> | null;
    if (!successPayload?.success) {
        throw new Error(fallback);
    }

    return successPayload.data;
}

export function getStoredSession(): AuthSession | null {
    if (typeof window === 'undefined') {
        return null;
    }

    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw) as AuthSession;
    } catch {
        return null;
    }
}

export function saveSession(session: AuthSession): void {
    if (typeof window === 'undefined') {
        return;
    }

    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
    if (typeof window === 'undefined') {
        return;
    }

    window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export async function login(payload: { email: string; password: string; deviceName?: string }): Promise<AuthSession> {
    const response = await fetch(getApiUrl('/auth/login'), {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: payload.email,
            password: payload.password,
            device_name: payload.deviceName || 'triply-web',
        }),
    });

    const data = await parseJsonResponse<{ user: AuthUser; token: string }>(response, 'Connexion impossible.');
    return { token: data.token, user: data.user };
}

export async function register(payload: { name: string; email: string; password: string }): Promise<AuthSession> {
    const response = await fetch(getApiUrl('/auth/register'), {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const data = await parseJsonResponse<{ user: AuthUser; token: string }>(response, 'Inscription impossible.');
    return { token: data.token, user: data.user };
}

export async function me(token: string): Promise<AuthUser> {
    const response = await fetch(getApiUrl('/auth/me'), {
        method: 'GET',
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });

    const data = await parseJsonResponse<{ user: AuthUser }>(response, 'Session invalide.');
    return data.user;
}

export async function logout(token: string): Promise<void> {
    const response = await fetch(getApiUrl('/auth/logout'), {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as ApiErrorResponse | null;
        throw new Error(getErrorMessage(payload, 'Deconnexion impossible.'));
    }
}

export async function updateProfile(token: string, payload: { name?: string }): Promise<void> {
    const response = await fetch(getApiUrl('/profile'), {
        method: 'PATCH',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as ApiErrorResponse | null;
        throw new Error(getErrorMessage(errorPayload, 'Mise a jour du profil impossible.'));
    }
}

export async function fetchPreferences(token: string): Promise<UserPreferences> {
    const response = await fetch(getApiUrl('/profile'), {
        method: 'GET',
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });

    const data = await parseJsonResponse<{ attributes: { preferences: UserPreferences } }>(
        response,
        'Impossible de charger les preferences.',
    );

    return data.attributes?.preferences ?? {};
}

export async function updatePreferences(token: string, payload: UserPreferences): Promise<void> {
    const response = await fetch(getApiUrl('/profile/preferences'), {
        method: 'PATCH',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as ApiErrorResponse | null;
        throw new Error(getErrorMessage(errorPayload, 'Mise a jour des preferences impossible.'));
    }
}