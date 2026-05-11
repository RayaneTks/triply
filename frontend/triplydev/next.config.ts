import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
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
