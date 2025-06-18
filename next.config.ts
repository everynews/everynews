import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true,
    ppr: 'incremental',
    useCache: true,
  },
}

export default nextConfig
