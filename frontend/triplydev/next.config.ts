import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Mode standalone : Next produit dans .next/standalone/ un serveur autonome contenant
  // uniquement les dépendances réellement utilisées. L'image runtime passe de ~2 GB à
  // ~150-300 MB sans node_modules complet à embarquer.
  output: "standalone",
  turbopack: {
    root: __dirname,
  },
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
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "pics.avs.io", pathname: "/**" },
    ],
  },
};

export default nextConfig;
