/**
 * Normalise la base d’appel à l’API Laravel : toutes les routes métier sont sous `/api/v1`.
 * - URL absolue sans chemin → ajoute `/api/v1`
 * - `host:port` ou `127.0.0.1:8000` sans schéma → `http://…/api/v1`
 * - Chemins relatifs : `api/v1` ou `/api` → `/api/v1`
 * Garde-fou : si la valeur finale ne se termine pas par `/api/v1`, on retombe sur `/api/v1` (évite `/connexion/auth/login`).
 */
export function normalizeLaravelApiV1Base(raw: string | undefined, fallback = "/api/v1"): string {
  const fb = fallback.replace(/\/+$/, "") || "/api/v1";

  if (raw === undefined || raw === null) {
    return mustEndWithApiV1(fb, fb);
  }

  const trimmed = String(raw).trim();
  if (trimmed === "" || trimmed === "undefined" || trimmed === "null") {
    return mustEndWithApiV1(fb, fb);
  }

  let base = trimmed.replace(/\/+$/, "");
  const lower = base.toLowerCase();

  if (lower.endsWith("/api/v1")) {
    return mustEndWithApiV1(base, fb);
  }
  if (lower.endsWith("/api")) {
    return mustEndWithApiV1(`${base}/v1`, fb);
  }

  if (/^https?:\/\//i.test(base)) {
    return mustEndWithApiV1(`${base}/api/v1`, fb);
  }

  if (/^[\w.-]+:\d+$/i.test(base) || /^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(base)) {
    return mustEndWithApiV1(`http://${base}/api/v1`, fb);
  }

  if (base === "/api") {
    return mustEndWithApiV1("/api/v1", fb);
  }
  if (base === "/" || base === "") {
    return mustEndWithApiV1(fb, fb);
  }

  return mustEndWithApiV1(base, fb);
}

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
