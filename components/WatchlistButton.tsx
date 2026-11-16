"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { useWatchlist } from "@/lib/useWatchlist";

interface WatchlistButtonProps {
  animeId: string;
  animeTitle: string;
  animeImage: string;
  episodesTotal?: number | null;
  className?: string;
}

/** Kleiner Lesezeichen-Button für Anime-Karten. */
export default function WatchlistButton({
  animeId,
  animeTitle,
  animeImage,
  episodesTotal,
  className = "absolute top-2 right-2 z-20",
}: WatchlistButtonProps) {
  const watchlist = useWatchlist();
  const inWatchlist = watchlist.has(animeId);

  const toggle = (e: React.MouseEvent) => {
    // Klick soll nicht den umgebenden Link auslösen
    e.preventDefault();
    e.stopPropagation();
    if (inWatchlist) watchlist.remove(animeId);
    else watchlist.add({ animeId, title: animeTitle, image: animeImage, episodesTotal });
  };

  const label = inWatchlist ? "Von Watchlist entfernen" : "Zur Watchlist hinzufügen";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={watchlist.isLoading}
      aria-pressed={inWatchlist}
      aria-label={label}
      title={label}
      className={`${className} rounded-full p-2 bg-black/70 hover:bg-black/90 backdrop-blur-sm transition disabled:opacity-50 ${
        inWatchlist ? "text-pink-400" : "text-white"
      }`}
    >
      {inWatchlist ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
    </button>
  );
}
