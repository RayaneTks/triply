/**
 * Base URL API Laravel : toujours `/api/v1` ou une URL absolue se terminant par `/api/v1`.
 * Garde-fou : valeurs invalides (ex. `api/v1` sans slash) → `/api/v1` pour éviter des URLs relatives cassées.
 */
function mustEndWithApiV1(base: string, fb: string): string {
    let b = base.trim();
    if (b === "") return fb;
    if (!/^https?:\/\//i.test(b) && !b.startsWith("/")) {
        b = `/${b}`;
    }
    if (!b.toLowerCase().endsWith("/api/v1")) {
        return fb;
    }
    return b;
}

function normalizeLaravelApiV1Base(raw: string | undefined, fallback = "/api/v1"): string {
    const fb = fallback.replace(/\/+$/, "") || "/api/v1";
    if (raw === undefined || raw === null) return mustEndWithApiV1(fb, fb);
    const trimmed = String(raw).trim();
    if (trimmed === "" || trimmed === "undefined" || trimmed === "null") return mustEndWithApiV1(fb, fb);
    const base = trimmed.replace(/\/+$/, "");
    const lower = base.toLowerCase();
    if (lower.endsWith("/api/v1")) return mustEndWithApiV1(base, fb);
    if (lower.endsWith("/api")) return mustEndWithApiV1(`${base}/v1`, fb);
    if (/^https?:\/\//i.test(base)) return mustEndWithApiV1(`${base}/api/v1`, fb);
    if (/^[\w.-]+:\d+$/i.test(base) || /^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(base)) {
        return mustEndWithApiV1(`http://${base}/api/v1`, fb);
    }
    if (base === "/api") return mustEndWithApiV1("/api/v1", fb);
    if (base === "/" || base === "") return mustEndWithApiV1(fb, fb);
    return mustEndWithApiV1(base, fb);
}

export function getTriplyApiBase(): string {
    return normalizeLaravelApiV1Base(process.env.NEXT_PUBLIC_BACKEND_API_URL);
}

/** Construit une URL vers un endpoint `v1` (ex. `/integrations/assistant`). */
export function apiV1(path: string): string {
    const base = getTriplyApiBase().replace(/\/+$/, "");
    let p = path.startsWith("/") ? path : `/${path}`;
    if (base.toLowerCase().endsWith("/api/v1") && p.toLowerCase().startsWith("/api/v1")) {
        p = p.replace(/^\/api\/v1/i, "") || "/";
    }
    return `${base}${p}`;
}
