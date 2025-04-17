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
  eslint: {
    ignoreDuringBuilds: true,
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
  reactStrictMode: true,
  env: {
    // 클라이언트에서도 접근 가능한 환경 변수 (주의해서 사용)
    APP_ENV: process.env.NODE_ENV,
  },
  serverRuntimeConfig: {
    // 서버에서만 접근 가능한 환경 변수 (보안에 민감한 정보)
    FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
    FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID,
    ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
  },
  publicRuntimeConfig: {
    // 클라이언트에서도 접근할 수 있지만 빌드 시간에만 노출되는 환경 변수
    // 민감한 정보는 여기에 넣지 않아야 함
    staticFolder: '/static',
  },
};

module.exports = nextConfig; 