/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Mencegah double-mounting dan mempercepat kompilasi & rendering peta
  swcMinify: true,
  experimental: {
    optimizePackageImports: ['lucide-react', 'leaflet'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:5000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
