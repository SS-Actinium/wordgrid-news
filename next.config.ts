import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.bbci.co.uk" },
      { protocol: "https", hostname: "**.bbcimg.co.uk" },
      { protocol: "https", hostname: "media.npr.org" },
      { protocol: "https", hostname: "i.guim.co.uk" },
      { protocol: "https", hostname: "www.aljazeera.com" },
      { protocol: "https", hostname: "**.aljazeera.net" },
    ],
    // Local AI uploads under /public/uploads
    localPatterns: [
      { pathname: "/uploads/**" },
    ],
  },
};

export default nextConfig;
