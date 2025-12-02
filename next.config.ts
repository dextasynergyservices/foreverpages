import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig = {
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ["gsap", "lucide-react"],
    // Next.js 15 - Turbopack is stable, no longer experimental
  },

  // Faster refreshes in development
  reactStrictMode: true,

  // Redirect HTTP to HTTPS in production
  async redirects() {
    return [
      {
        source: "/((?!api/).*)", // Redirect all non-API routes
        has: [
          {
            type: "header",
            key: "x-forwarded-proto",
            value: "http",
          },
        ],
        destination: "https://:host:port:path*",
        permanent: true,
      },
    ];
  },

  // Security headers and CORS
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com https://www.recaptcha.net https:",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "media-src 'self' https://res.cloudinary.com blob:",
              // Allow websocket schemes (ws/wss) and required origins. In dev this
              // enables ws://localhost:8080; in production wss will be permitted.
              "connect-src 'self' ws: wss: https://www.google.com https://www.gstatic.com https://www.recaptcha.net https:",
              "frame-src https://www.google.com https://www.recaptcha.net https:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
      {
        // CORS headers for API routes
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value:
              process.env.NODE_ENV === "production"
                ? process.env.ALLOWED_ORIGINS || "https://yourdomain.com"
                : "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
          {
            key: "Access-Control-Max-Age",
            value: "86400", // 24 hours
          },
        ],
      },
    ];
  },

  // Optimize images
  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**",
      },
    ],
  },

  // Enable compression
  compress: true,

  // Optimize bundle
  webpack: (config, { dev, isServer }) => {
    // Exclude uploaded templates from webpack processing
    // Templates are self-contained modules with their own build system
    config.module.rules = (config.module.rules || []).map((rule: Record<string, unknown>) => {
      if (
        rule.test &&
        typeof rule.test === "object" &&
        (rule.test.toString().includes("tsx") || rule.test.toString().includes("ts"))
      ) {
        return {
          ...rule,
          exclude: (path: string) => {
            if (path.includes("src/app/templates")) return true;
            const ruleExclude = rule.exclude as unknown;
            if (typeof ruleExclude === "function")
              return (ruleExclude as (path: string) => boolean)(path);
            if (ruleExclude instanceof RegExp) return ruleExclude.test(path);
            return false;
          },
        };
      }
      return rule;
    });

    // Speed up development builds
    if (dev) {
      config.watchOptions = {
        poll: 1000, // Check for changes every second
        aggregateTimeout: 300, // Delay before rebuilding
        ignored: /node_modules/,
      };
    }

    if (!dev && !isServer) {
      // Optimize for production only
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
          },
          gsap: {
            test: /[\\/]node_modules[\\/]gsap[\\/]/,
            name: "gsap",
            chunks: "all",
          },
        },
      };
    }

    return config;
  },

  // Enable static optimization
  output: "standalone",
} satisfies NextConfig;

export default withPWA({
  dest: "public",
  register: false, // Disable auto-registration since we handle it manually
  skipWaiting: false, // We'll handle this in our custom SW
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [], // Disable runtime caching since we handle it in custom SW
})(nextConfig as unknown as Parameters<typeof withPWA>[0]);
