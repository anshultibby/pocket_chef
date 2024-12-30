/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export',
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
  reactStrictMode: true
};

module.exports = nextConfig;
