/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Mencegah double-mounting dan mempercepat kompilasi & rendering peta
  swcMinify: true,
  experimental: {
    optimizePackageImports: ['lucide-react', 'leaflet'],
  },
};

export default nextConfig;
