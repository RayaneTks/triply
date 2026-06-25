import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

// Chemin absolu fiable pour Turbopack (Docker + dev local).
// __dirname peut être ignoré ou résolu en /ROOT/... par Turbopack (Next 16),
// ce qui fait inférer /app/frontend/app au lieu de /app/frontend.
const frontendRoot = path.dirname(fileURLToPath(import.meta.url));

const isProd = process.env.NODE_ENV === 'production';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'geolocation=(), camera=(), microphone=()' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  ...(isProd ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }] : []),
];

const nextConfig: NextConfig = {
  devIndicators: false,
  // Mode standalone : Next produit dans .next/standalone/ un serveur autonome contenant
  // uniquement les dépendances réellement utilisées. L'image runtime passe de ~2 GB à
  // ~150-300 MB sans node_modules complet à embarquer.
  output: "standalone",
  turbopack: {
    root: frontendRoot,
  },
  outputFileTracingRoot: frontendRoot,
  async rewrites() {
    const backendProxyTarget = (
      process.env.BACKEND_PROXY_TARGET
      || process.env.BACKEND_API_BASE_URL?.replace(/\/api\/v1\/?$/, '')
      || 'http://tri-api'
    ).replace(/\/$/, '');

    return {
      fallback: [
        {
          source: '/api/v1/:path*',
          destination: `${backendProxyTarget}/api/v1/:path*`,
        },
      ],
    };
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "pics.avs.io", pathname: "/**" },
      { protocol: "https", hostname: "api.mapbox.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
