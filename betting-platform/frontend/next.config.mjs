/** @type {import('next').NextConfig} */
const isNetlify = process.env.NETLIFY === 'true';

console.log(`▶️ Building for ${isNetlify ? 'Netlify (static)' : 'Vercel (SSR)'}`);

const nextConfig = {
  trailingSlash: true,
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  ...(isNetlify && {
    output: 'export',
    images: {
      unoptimized: true,
    },
  }),
}

export default nextConfig
