/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
  typescript: {
    // viem's nested `ox/tempo` ships a broken .ts type that fails the build
    // type-check. Our own code is still type-checked via `npm run type-check`.
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
