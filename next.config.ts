import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ["gsap", "lucide-react"],
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
    ],
  },

  // Enable compression
  compress: true,

  // Optimize bundle
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Optimize for production
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
};

export default nextConfig;
