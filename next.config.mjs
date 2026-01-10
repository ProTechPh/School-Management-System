/** @type {import('next').NextConfig} */
const nextConfig = {
  // API route body size limit (prevent DoS)
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
  
  images: {
    unoptimized: false, // OPTIMIZATION: Enable image optimization
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  
  /**
   * 安全响应头配置
   * Security headers configuration for all responses
   * https://nextjs.org/docs/advanced-features/security-headers
   */
  async headers() {
    return [
      {
        // 应用于所有路由
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            // SECURITY: Allow geolocation for QR check-in feature, camera for QR scanning
            value: 'camera=(self), microphone=(), geolocation=(self)',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // SECURITY: Removed 'unsafe-eval' and 'unsafe-inline' for better XSS protection
              // Note: This may require testing - some features might need adjustment
              "script-src 'self' https://vercel.live https://va.vercel-scripts.com",
              // Style-src still needs unsafe-inline for CSS-in-JS libraries (Tailwind, etc.)
              // Consider using nonces in the future for better security
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vercel.live",
              "frame-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; ')
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      },
    ]
  },
}

export default nextConfig