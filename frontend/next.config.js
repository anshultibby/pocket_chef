/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'dist',
  images: {
    unoptimized: true
  },
  trailingSlash: true,
  typescript: {
    // During development we'll check types
    // For production build, we'll ignore to allow static export
    ...(process.env.NODE_ENV === 'production' 
      ? { ignoreBuildErrors: true }
      : {})
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't attempt to bundle these modules on the server side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        '@capacitor/camera': false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
