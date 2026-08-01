import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Plotly (client charts / geo map)
   * - react-plotly.js ships dual CJS/ESM; transpile so App Router resolves factory cleanly
   * - plotly.js-geo-dist is loaded only via PlotlyClient + next/dynamic ssr:false (browser)
   * - Do not list plotly.js-geo-dist in both transpilePackages and serverExternalPackages
   */
  transpilePackages: ["react-plotly.js"],

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

  webpack: (config, { isServer }) => {
    // plotly / optional node-canvas must not break client or server builds
    if (!isServer) {
      config.resolve = config.resolve ?? {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        canvas: false,
      };
    } else {
      // SSR: do not bundle optional native canvas
      const externals = config.externals;
      if (Array.isArray(externals)) {
        externals.push({ canvas: "commonjs canvas" });
      }
    }

    return config;
  },
};

export default nextConfig;
