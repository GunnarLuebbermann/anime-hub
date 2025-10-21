"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from "@/lib/watchlist";
import { Bookmark, BookmarkCheck } from "lucide-react";

interface WatchlistButtonProps {
  animeId: string;
  animeTitle: string;
  animeImage: string;
}

export default function WatchlistButton({ animeId, animeTitle, animeImage }: WatchlistButtonProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [inWatchlist, setInWatchlist] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      try {
        const exists = await isInWatchlist(user.id, animeId);
        setInWatchlist(exists);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [animeId]);

  const toggleWatchlist = async () => {
    if (!userId) return alert("Bitte zuerst einloggen!");

    setLoading(true);
    try {
      if (inWatchlist) {
        await removeFromWatchlist(userId, animeId);
        setInWatchlist(false);
      } else {
        await addToWatchlist(userId, { id: animeId, title: animeTitle, image: animeImage });
        setInWatchlist(true);
      }
    } catch (e) {
      console.error(e);
      alert("Fehler beim Aktualisieren der Watchlist");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleWatchlist}
      disabled={loading}
      className={`absolute top-2 right-2 z-20 rounded-full p-2 bg-black/70 hover:bg-black/90 transition ${
        inWatchlist ? "text-pink-400" : "text-white"
      }`}
      title={inWatchlist ? "Von Watchlist entfernen" : "Zur Watchlist hinzufügen"}
    >
      {inWatchlist ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
    </button>
  );
}
