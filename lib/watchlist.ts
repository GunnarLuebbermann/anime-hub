// lib/watchlist.ts
import { supabase } from "@/lib/supabaseClient";

export async function isInWatchlist(userId: string, animeId: string) {
  const { data, error } = await supabase
    .from("watchlist")
    .select("id")
    .eq("user_id", userId)
    .eq("anime_id", animeId)
    .single();

  if (error && error.code !== "PGRST116") throw error; // ignore "no rows found"
  return !!data;
}

export async function addToWatchlist(userId: string, anime: { id: string; title: string; image: string }) {
  const { error } = await supabase.from("watchlist").insert([
    {
      user_id: userId,
      anime_id: anime.id,
      anime_title: anime.title,
      anime_image: anime.image,
    },
  ]);
  if (error) throw error;
}

export async function removeFromWatchlist(userId: string, animeId: string) {
  const { error } = await supabase
    .from("watchlist")
    .delete()
    .eq("user_id", userId)
    .eq("anime_id", animeId);
  if (error) throw error;
}
