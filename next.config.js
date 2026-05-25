/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },

  async headers() {
    return [
      {
        // Apply CSP to all routes
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Scripts: allow inline scripts (Next.js needs this) and from self
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              // Styles: allow inline styles (needed for Tailwind/Next.js)
              "style-src 'self' 'unsafe-inline'",
              // Images: allow from self, data URIs, and blob
              "img-src 'self' data: blob:",
              // Fonts: allow from self and data URIs
              "font-src 'self' data:",
              // Connections: allow to self
              "connect-src 'self'",
              // Frames: block object embedding
              "object-src 'none'",
              // Base URI: restrict to self
              "base-uri 'self'",
              // Form actions: only to self
              "form-action 'self'",
              // Frame ancestors: only self (prevents clickjacking)
              "frame-ancestors 'self'",
            ].join("; "),
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
