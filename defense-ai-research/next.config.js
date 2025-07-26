/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable type checking and linting during build for deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ensure proper output
  output: 'standalone',
  // Disable image optimization for now
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig 