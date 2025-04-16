/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    domains: [], // 외부 이미지를 사용하는 경우 해당 도메인 추가
    path: '/_next/image',
    loader: 'default',
    minimumCacheTTL: 60,
  },
  swcMinify: true,
  reactStrictMode: true,
};

module.exports = nextConfig; 