/**
 * Client HTTP vers Laravel uniquement (proxy /api/v1). Aucune clé OpenAI / Amadeus / Google côté navigateur
 * hormis le jeton Mapbox (VITE_MAPBOX_TOKEN) utilisé par le composant Map.
 */
import { authClient } from "./auth-client";
import { normalizeLaravelApiV1Base } from "./laravel-api-base";

const API_BASE: string = normalizeLaravelApiV1Base(import.meta.env.VITE_API_BASE_URL as string | undefined);

/** Base API résolue (utile en debug). */
export function getApiBaseUrl(): string {
  return API_BASE;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    message?: string,
  ) {
    super(message ?? `API ${status}`);
    this.name = "ApiError";
  }
}

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  authenticated?: boolean;
}

export interface ApiSuccessEnvelope<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

function buildUrl(path: string, query?: ApiFetchOptions["query"]): string {
  let cleanPath = path.startsWith("/") ? path : `/${path}`;
  const base = API_BASE.replace(/\/+$/, "");
  const baseLower = base.toLowerCase();
  // Évite /api/v1/api/v1/... si un appelant passe déjà le préfixe complet
  if (baseLower.endsWith("/api/v1") && cleanPath.toLowerCase().startsWith("/api/v1")) {
    cleanPath = cleanPath.replace(/^\/api\/v1/i, "") || "/";
  }
  const url = `${base}${cleanPath}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

function extractErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (typeof b.message === "string") return b.message;
  if (typeof b.error === "string") return b.error;
  if (b.error && typeof b.error === "object") {
    const e = b.error as Record<string, unknown>;
    if (typeof e.message === "string") return e.message;
  }
  if (b.errors && typeof b.errors === "object") {
    const first = Object.values(b.errors as Record<string, unknown>)[0];
    if (Array.isArray(first) && typeof first[0] === "string") return first[0];
  }
  return null;
}

export async function apiFetch<T = unknown>(path: string, opts: ApiFetchOptions = {}): Promise<T> {
  const { body, query, authenticated = true, headers, ...rest } = opts;

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(headers as Record<string, string> | undefined),
  };

  if (body !== undefined && !(body instanceof FormData)) {
    finalHeaders["Content-Type"] ??= "application/json";
  }

  if (authenticated) {
    const token = authClient.getToken();
    if (token) finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  const init: RequestInit = {
    ...rest,
    headers: finalHeaders,
    credentials: "same-origin",
  };
  if (body !== undefined) {
    init.body = body instanceof FormData ? body : JSON.stringify(body);
  }

  const res = await fetch(buildUrl(path, query), init);
  const text = await res.text();
  let parsed: unknown = undefined;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, parsed, extractErrorMessage(parsed) ?? undefined);
  }
  return parsed as T;
}

export { extractErrorMessage };
