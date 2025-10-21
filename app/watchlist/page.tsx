"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

interface WatchlistItem {
  id: string;
  anime_id: string;
  anime_title: string;
  anime_image: string;
  user_id: string;
  created_at: string;
}

export default function WatchlistPage() {
  const [list, setList] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        if (!user) {
          setError("User not authenticated");
          return;
        }

        const { data, error: watchlistError } = await supabase
          .from("watchlist")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (watchlistError) throw watchlistError;

        setList(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load watchlist");
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlist();
  }, []);

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-400">Loading watchlist...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-7xl mx-auto p-6">
        <div className="text-center text-red-400">
          <p>Error: {error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-pink-400">📺 Meine Watchlist</h1>
      
      {list.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <p>Your watchlist is empty</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {list.map((anime) => (
            <Link href={`/anime/${anime.anime_id}`} key={anime.id}>
              <div className="relative group rounded-xl overflow-hidden hover:scale-105 transition-transform duration-200">
                <img
                  src={anime.anime_image}
                  alt={anime.anime_title}
                  className="w-full aspect-[2/3] object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end p-3">
                  <p className="text-white font-semibold text-sm line-clamp-2">
                    {anime.anime_title}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
