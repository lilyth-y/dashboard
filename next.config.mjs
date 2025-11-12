/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // 개발 환경에서만 엄격한 검증 적용
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },
  images: {
    unoptimized: false,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // 개발 경험 개선 설정
  ...(process.env.NODE_ENV !== 'production' && {
    // 개발 모드에서만 적용되는 설정들
    webpack: (config, { dev, isServer }) => {
      if (dev && !isServer) {
        // 핫 리로드 최적화
        config.watchOptions = {
          poll: 1000,
          aggregateTimeout: 300,
        }
        // 소스 맵 개선
        config.devtool = 'eval-cheap-module-source-map'
      }
      return config
    },
    // 실시간 타입 체크 비활성화 (성능 향상)
    typescript: {
      ignoreBuildErrors: true,
    },
    eslint: {
      ignoreDuringBuilds: true,
    },
  }),
  // 프로덕션 빌드 최적화
  ...(process.env.NODE_ENV === 'production' && {
    compiler: {
      removeConsole: process.env.NODE_ENV === 'production',
    },
  }),
}

export default nextConfig
