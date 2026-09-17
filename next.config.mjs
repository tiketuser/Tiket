/** @type {import('next').NextConfig} */
const isMobileBuild = process.env.MOBILE_BUILD === "1";

const baseConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/tiket-9268c.firebasestorage.app/**",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/**",
      },
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    config.module.rules.push({
      test: /\.worker\.js$/,
      use: { loader: "worker-loader" },
    });
    return config;
  },
  experimental: {
    esmExternals: "loose",
    serverComponentsExternalPackages: ["tesseract.js"],
  },
};

const mobileConfig = {
  ...baseConfig,
  output: "export",
  trailingSlash: true,
  images: {
    ...baseConfig.images,
    unoptimized: true,
  },
};

const webConfig = {
  ...baseConfig,
  output: "standalone",
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
      {
        // HTML documents must revalidate. Next serves prerendered pages with
        // s-maxage=31536000, and Firebase Hosting's CDN honours it — which
        // pinned old HTML at the edge for a year, so a deploy left visitors on
        // JS chunk URLs that no longer existed. Hashed assets under
        // _next/static, and anything with a file extension, keep their own
        // caching; only extensionless document routes are matched here.
        source: "/((?!_next/static|_next/image|.*\\.).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization, X-Requested-With",
          },
          {
            key: "Access-Control-Max-Age",
            value: "86400",
          },
        ],
      },
    ];
  },
};

export default isMobileBuild ? mobileConfig : webConfig;