import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Cover, Banner und Charakterbilder von AniList
      { protocol: "https", hostname: "s4.anilist.co", pathname: "/**" },
      // Ältere Watchlist-Einträge speichern noch MyAnimeList-Bilder
      { protocol: "https", hostname: "cdn.myanimelist.net", pathname: "/**" },
    ],
  },
};

export default nextConfig;
