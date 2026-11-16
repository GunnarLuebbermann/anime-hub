/**
 * Einheitliches Anime-Modell der App (aus der AniList API gemappt).
 * `id` ist die MyAnimeList-ID, falls vorhanden (kompatibel zu bestehenden
 * Watchlist-Einträgen), sonst "al-<AniList-ID>".
 */
export type Anime = {
  id: string;
  anilistId: number;
  malId: number | null;
  title: string;
  titleRomaji: string;
  titleNative: string | null;
  image: string;
  imageLarge: string;
  color: string | null;
  banner: string | null;
  format: string | null;
  episodes: number | null;
  status: string | null;
  startDate: string | null;
  endDate: string | null;
  season: string | null;
  year: number | null;
  duration: number | null;
  score: number | null; // 0–10
  members: number | null;
  favourites: number | null;
  rank: number | null;
  popularityRank: number | null;
  genres: string[];
  tags: string[];
  studios: string[];
  source: string | null;
  synopsis: string | null;
  trailerYoutubeId: string | null;
  streaming: { name: string; url: string }[];
  siteUrl: string;
  malUrl: string | null;
  nextEpisode: { episode: number; airingAt: number } | null;
};

export type AnimeCharacter = {
  id: number;
  name: string;
  image: string;
  role: "MAIN" | "SUPPORTING" | "BACKGROUND";
  voiceActor: string | null;
};

export type AnimeRecommendation = {
  id: string;
  title: string;
  image: string;
};

export type AnimeDetails = Anime & {
  characters: AnimeCharacter[];
  recommendations: AnimeRecommendation[];
};

export type PaginatedResponse<T> = {
  items: T[];
  hasNext: boolean;
  currentPage: number;
  totalPages?: number;
};

export const WATCH_STATUSES = [
  "plan_to_watch",
  "watching",
  "completed",
  "on_hold",
  "dropped",
] as const;

export type WatchStatus = (typeof WATCH_STATUSES)[number];

export const WATCH_STATUS_LABELS: Record<WatchStatus, string> = {
  plan_to_watch: "Geplant",
  watching: "Schaue ich",
  completed: "Abgeschlossen",
  on_hold: "Pausiert",
  dropped: "Abgebrochen",
};

export type WatchlistEntry = {
  id: string;
  user_id: string;
  anime_id: string;
  anime_title: string;
  anime_image: string;
  status: WatchStatus;
  rating: number | null;
  episodes_watched: number;
  episodes_total: number | null;
  created_at: string;
  updated_at?: string | null;
};
