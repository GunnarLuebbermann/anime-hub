import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Providers from "@/components/providers/Providers";

export const metadata: Metadata = {
  title: {
    default: "AnimeHub",
    template: "%s · AnimeHub",
  },
  description: "Entdecke, bewerte und teile deine Lieblingsanimes!",
};

export const viewport: Viewport = {
  themeColor: "#030712",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="bg-gray-950 text-gray-100 min-h-screen flex flex-col antialiased">
        <Providers>
          <Header />
          <div className="flex-1 pt-4">{children}</div>
          <footer className="border-t border-gray-900 mt-12 py-6 text-center text-xs text-gray-500 px-4">
            Daten von{" "}
            <a href="https://anilist.co" target="_blank" rel="noreferrer" className="hover:text-pink-400 underline">
              AniList
            </a>
            . AnimeHub ist ein inoffizielles Fanprojekt.
          </footer>
        </Providers>
      </body>
    </html>
  );
}
