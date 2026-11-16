// lib/watchlist.ts – Datenzugriff auf die Supabase-Tabelle "watchlist"
import { requireSupabase } from "@/lib/supabaseClient";
import type { WatchlistEntry, WatchStatus } from "@/types/anime";

const COLUMNS =
  "id, user_id, anime_id, anime_title, anime_image, status, rating, episodes_watched, episodes_total, created_at, updated_at";

export type NewWatchlistEntry = {
  animeId: string;
  title: string;
  image: string;
  episodesTotal?: number | null;
  status?: WatchStatus;
};

export type WatchlistPatch = Partial<
  Pick<WatchlistEntry, "status" | "rating" | "episodes_watched">
>;

export async function fetchWatchlist(userId: string): Promise<WatchlistEntry[]> {
  const { data, error } = await requireSupabase()
    .from("watchlist")
    .select(COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(normalize);
}

export async function addToWatchlist(
  userId: string,
  entry: NewWatchlistEntry
): Promise<WatchlistEntry> {
  const { data, error } = await requireSupabase()
    .from("watchlist")
    .upsert(
      {
        user_id: userId,
        anime_id: entry.animeId,
        anime_title: entry.title,
        anime_image: entry.image,
        episodes_total: entry.episodesTotal ?? null,
        status: entry.status ?? "plan_to_watch",
      },
      { onConflict: "user_id,anime_id" }
    )
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return normalize(data);
}

export async function updateWatchlistEntry(
  userId: string,
  animeId: string,
  patch: WatchlistPatch
): Promise<WatchlistEntry> {
  const { data, error } = await requireSupabase()
    .from("watchlist")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("anime_id", animeId)
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return normalize(data);
}

export async function removeFromWatchlist(userId: string, animeId: string) {
  const { error } = await requireSupabase()
    .from("watchlist")
    .delete()
    .eq("user_id", userId)
    .eq("anime_id", animeId);
  if (error) throw error;
}

// Ältere Zeilen (vor der Migration) haben ggf. keine Status-/Bewertungsfelder.
function normalize(row: Partial<WatchlistEntry> & Record<string, unknown>): WatchlistEntry {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    anime_id: String(row.anime_id),
    anime_title: row.anime_title ?? "",
    anime_image: row.anime_image ?? "",
    status: (row.status as WatchStatus) ?? "plan_to_watch",
    rating: row.rating ?? null,
    episodes_watched: row.episodes_watched ?? 0,
    episodes_total: row.episodes_total ?? null,
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? null,
  };
}
