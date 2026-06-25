'use client';

export interface AuthUser {
    id: number | string;
    name: string;
    email: string;
    est_admin?: boolean;
    /**
     * Niveau d'abonnement courant (ex: "voyageur", "premium", null pour gratuit).
     * Aligné sur users.subscription_tier côté backend.
     */
    subscription_tier?: string | null;
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
    planning_mode?: 'full_ai' | 'semi_ai' | 'manual' | null;
    traveler_profile?: string | null;
    interests?: string[];
    pace?: string | null;
    food_preference?: string | null;
    diet?: string[];
    breakfast_included?: boolean | null;
    max_budget?: number | null;
    visited_cities?: string[];
    done_activities?: Record<string, string[]>;
    reminders_day_before?: boolean | null;
    reminders_morning?: boolean | null;
}

export interface ProfileAttributes {
    name: string;
    email: string;
    photo_url?: string | null;
    timezone?: string | null;
    preferences: UserPreferences;
}

export interface ProfileResource {
    id: number | string;
    type: 'profile';
    attributes: ProfileAttributes;
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
const AUTH_STORAGE_MODE = process.env.NEXT_PUBLIC_AUTH_STORAGE_MODE || 'session';

function getStorage(): Storage | null {
    if (typeof window === 'undefined') return null;
    // Phase 1 hardening: prefer sessionStorage to reduce token persistence surface.
    // Next phase should migrate to HttpOnly secure cookies issued by backend.
    return AUTH_STORAGE_MODE === 'local' ? window.localStorage : window.sessionStorage;
}

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

function handleUnauthorized(): void {
    clearSession();
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('triply-auth-changed'));
    }
}

async function parseJsonResponse<T>(response: Response, fallback: string): Promise<T> {
    const payload = (await response.json().catch(() => null)) as ApiErrorResponse | ApiSuccess<T> | null;

    if (!response.ok) {
        if (response.status === 401) {
            handleUnauthorized();
        }
        throw new Error(getErrorMessage(payload as ApiErrorResponse | null, fallback));
    }

    const successPayload = payload as ApiSuccess<T> | null;
    if (!successPayload?.success) {
        throw new Error(fallback);
    }

    return successPayload.data;
}

export function getStoredSession(): AuthSession | null {
    const storage = getStorage();
    if (!storage) return null;
    const raw = storage.getItem(AUTH_STORAGE_KEY);
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
    const storage = getStorage();
    if (!storage) return;
    storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
    const storage = getStorage();
    if (!storage) return;
    storage.removeItem(AUTH_STORAGE_KEY);
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
        if (response.status === 401) handleUnauthorized();
        const payload = (await response.json().catch(() => null)) as ApiErrorResponse | null;
        throw new Error(getErrorMessage(payload, 'Deconnexion impossible.'));
    }
}

export async function updateProfile(
    token: string,
    payload: { name?: string; photo_url?: string | null; timezone?: string | null },
): Promise<ProfileResource> {
    const response = await fetch(getApiUrl('/profile'), {
        method: 'PATCH',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    return parseJsonResponse<ProfileResource>(response, 'Mise a jour du profil impossible.');
}

export async function fetchProfile(token: string): Promise<ProfileResource> {
    const response = await fetch(getApiUrl('/profile'), {
        method: 'GET',
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });

    return parseJsonResponse<ProfileResource>(response, 'Impossible de charger le profil.');
}

export async function fetchPreferences(token: string): Promise<UserPreferences> {
    const profile = await fetchProfile(token);
    return profile.attributes?.preferences ?? {};
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
        if (response.status === 401) handleUnauthorized();
        const errorPayload = (await response.json().catch(() => null)) as ApiErrorResponse | null;
        throw new Error(getErrorMessage(errorPayload, 'Mise a jour des preferences impossible.'));
    }
}

async function postJson<T>(path: string, body: unknown, fallback: string): Promise<T> {
    const response = await fetch(getApiUrl(path), {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    return parseJsonResponse<T>(response, fallback);
}

function notifyAuthChanged(): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new Event('triply-auth-changed'));
}

/**
 * Wrapper objet « authClient » pour préserver l'API historique de la SPA Vite.
 * Sous le capot, réutilise les fonctions exportées ci-dessus et le storage de session.
 */
export const authClient = {
    getToken(): string | null {
        return getStoredSession()?.token ?? null;
    },
    setToken(token: string): void {
        const current = getStoredSession();
        saveSession({ token, user: current?.user ?? null });
        notifyAuthChanged();
    },
    clear(): void {
        clearSession();
        notifyAuthChanged();
    },
    async login(payload: { email: string; password: string; device_name?: string }): Promise<AuthUser> {
        const session = await login({
            email: payload.email,
            password: payload.password,
            deviceName: payload.device_name,
        });
        saveSession(session);
        notifyAuthChanged();
        return session.user as AuthUser;
    },
    async register(payload: {
        name: string;
        email: string;
        password: string;
        password_confirmation?: string;
        device_name?: string;
    }): Promise<AuthUser> {
        const session = await register({
            name: payload.name,
            email: payload.email,
            password: payload.password,
        });
        saveSession(session);
        notifyAuthChanged();
        return session.user as AuthUser;
    },
    async me(): Promise<AuthUser> {
        const token = this.getToken();
        if (!token) throw new Error('Session invalide.');
        const user = await me(token);
        const current = getStoredSession();
        if (current) {
            saveSession({ token: current.token, user });
        }
        return user;
    },
    /** Met à jour le user en cache local (ex. après activation abonnement). */
    patchUser(patch: Partial<AuthUser>): void {
        const current = getStoredSession();
        if (!current?.token || !current.user) return;
        saveSession({
            token: current.token,
            user: { ...current.user, ...patch },
        });
        notifyAuthChanged();
    },
    async logout(): Promise<void> {
        const token = this.getToken();
        try {
            if (token) {
                await logout(token);
            }
        } finally {
            this.clear();
        }
    },
    forgotPassword(payload: { email: string }) {
        return postJson<{ requested: boolean; email: string }>(
            '/auth/forgot-password',
            payload,
            'Demande de réinitialisation impossible.',
        );
    },
    resetPassword(payload: {
        email: string;
        token: string;
        password: string;
        password_confirmation: string;
    }) {
        return postJson<{ reset: boolean; email: string }>(
            '/auth/reset-password',
            payload,
            'Réinitialisation du mot de passe impossible.',
        );
    },
};