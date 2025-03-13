import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Fix for MongoDB native binary modules
    if (!isServer) {
      // Don't bundle MongoDB native modules for the browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        aws4: false,
        util: false,
        mongodb: false,
        "util/types": false,
      }
    }
    return config
  },
}

export default nextConfig
