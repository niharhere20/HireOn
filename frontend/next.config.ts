import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize for Netlify deployment
  output: 'standalone',
  
  // Image optimization
  images: {
    unoptimized: true, // Netlify doesn't support Next.js image optimization by default
  },
};

export default nextConfig;
