import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true,
    useCache: true,
  },
}

export default nextConfig
