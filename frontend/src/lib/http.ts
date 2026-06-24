/**
 * Client HTTP vers Laravel uniquement (proxy /api/v1).
 * Hérité de la SPA Vite, adapté pour Next.js (env vars NEXT_PUBLIC_*).
 */
import { authClient } from "./auth-client";
import { normalizeLaravelApiV1Base } from "./laravel-api-base";

const API_BASE: string = normalizeLaravelApiV1Base(
  process.env.NEXT_PUBLIC_BACKEND_API_URL as string | undefined,
);

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

export function extractErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (typeof b.message === "string") return b.message;
  if (typeof b.error === "string") return b.error;
  if (b.error && typeof b.error === "object") {
    const e = b.error as Record<string, unknown>;
    if (typeof e.message === "string") return e.message;
  }
  if (b.errors && typeof b.errors === "object") {
    if (Array.isArray(b.errors) && b.errors.length > 0) {
      const first = b.errors[0];
      if (first && typeof first === "object") {
        const o = first as Record<string, unknown>;
        if (typeof o.detail === "string") return o.detail;
        if (typeof o.title === "string") return o.title;
      }
    }
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

export interface BlobResult {
  blob: Blob;
  filename: string | null;
}

/** Parse le nom de fichier d'un header Content-Disposition (RFC 6266 + legacy). */
function parseContentDispositionFilename(header: string | null): string | null {
  if (!header) return null;
  const utf8 = header.match(/filename\*=(?:UTF-8'')?([^;]+)/i);
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1].replace(/["']/g, "").trim());
    } catch {
      /* ignore decode error, fall through */
    }
  }
  const ascii = header.match(/filename="?([^";]+)"?/i);
  return ascii?.[1]?.trim() ?? null;
}

/**
 * Variante binaire d'`apiFetch` pour les téléchargements (PDF, ICS).
 * Même logique d'auth Bearer, mais renvoie un Blob + le filename du header.
 */
export async function apiFetchBlob(path: string, opts: ApiFetchOptions = {}): Promise<BlobResult> {
  const { body, query, authenticated = true, headers, ...rest } = opts;

  const finalHeaders: Record<string, string> = {
    Accept: "application/octet-stream, application/pdf, text/calendar, */*",
    ...(headers as Record<string, string> | undefined),
  };

  if (body !== undefined && !(body instanceof FormData)) {
    finalHeaders["Content-Type"] ??= "application/json";
  }

  if (authenticated) {
    const token = authClient.getToken();
    if (token) finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  const init: RequestInit = { ...rest, headers: finalHeaders, credentials: "same-origin" };
  if (body !== undefined) {
    init.body = body instanceof FormData ? body : JSON.stringify(body);
  }

  const res = await fetch(buildUrl(path, query), init);

  if (!res.ok) {
    // Erreur : le corps est du JSON, pas du binaire — on le lit pour le message.
    let parsed: unknown = undefined;
    const text = await res.text().catch(() => "");
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }
    throw new ApiError(res.status, parsed, extractErrorMessage(parsed) ?? undefined);
  }

  return {
    blob: await res.blob(),
    filename: parseContentDispositionFilename(res.headers.get("Content-Disposition")),
  };
}

/** Déclenche le téléchargement navigateur d'un Blob. */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  if (typeof window === "undefined") return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Laisse le temps au navigateur de démarrer le download avant de révoquer.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
