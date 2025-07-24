import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static image imports for profile pictures, logos, etc.
  images: {
    domains: ['localhost', '3.111.198.202'],
  },
  
  // Environment variables available on the client side
  env: {
    SOCKET_SERVER_URL: process.env.SOCKET_SERVER_URL || 'http://localhost:4001',
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4001',
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4000',
    REMOTE_SERVER_URL: process.env.REMOTE_SERVER_URL || 'http://3.111.198.202',
    API_AUTH_DISABLED: process.env.API_AUTH_DISABLED || 'true',
    WEB_AUTH_ENABLED: process.env.WEB_AUTH_ENABLED || 'true',
  },

  // Optional: Add headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
