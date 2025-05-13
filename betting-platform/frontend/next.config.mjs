/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // ⬅️ This is key for Netlify static hosting
  trailingSlash: true,
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
