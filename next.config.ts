import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output as standalone for Docker deployment
  output: 'standalone',
  
  // Enable static image imports for profile pictures, logos, etc.
  images: {
    domains: ['localhost'],
    // Add other domains as needed for production
  },
  
  // Environment variables available on the client side
  env: {
    SOCKET_SERVER_URL: process.env.SOCKET_SERVER_URL || 'http://localhost:3001',
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
