// filepath: c:\Users\Aviv Nir\Tiket\next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    // Add worker-loader for Tesseract.js
    config.module.rules.push({
      test: /\.worker\.js$/,
      use: { loader: "worker-loader" },
    });
    return config;
  },
  // Add experimental features for worker support
  experimental: {
    esmExternals: "loose",
    serverComponentsExternalPackages: ["tesseract.js"],
  },
};

export default nextConfig;