export type NamedResource = {
  mal_id: number;
  type: string;
  name: string;
  url: string;
};

export type ImageSet = {
  image_url: string;
  small_image_url?: string;
  large_image_url?: string;
};

export type Anime = {
  mal_id: number;
  url: string;
  approved?: boolean;
  title: string;
  title_english?: string | null;
  title_japanese?: string | null;
  title_synonyms?: string[];
  type?: string | null;
  source?: string | null;
  episodes?: number | null;
  status?: string | null;
  airing?: boolean;
  aired?: {
    from?: string | null;
    to?: string | null;
    string?: string;
  };
  duration?: string | null;
  rating?: string | null;
  score?: number | null;
  scored_by?: number | null;
  rank?: number | null;
  popularity?: number | null;
  members?: number | null;
  favorites?: number | null;
  synopsis?: string | null;
  background?: string | null;
  season?: string | null;
  year?: number | null;
  broadcast?: {
    day?: string | null;
    time?: string | null;
    timezone?: string | null;
    string?: string | null;
  };
  images: {
    jpg: ImageSet;
    webp?: ImageSet;
  };
  trailer?: {
    youtube_id?: string | null;
    url?: string | null;
    embed_url?: string | null;
  };
  producers?: NamedResource[];
  licensors?: NamedResource[];
  studios?: NamedResource[];
  genres?: NamedResource[];
  explicit_genres?: NamedResource[];
  themes?: NamedResource[];
  demographics?: NamedResource[];
  streaming?: { name: string; url: string }[];
};

export type Genre = {
  mal_id: number;
  name: string;
  count?: number;
};

export type AnimeCharacter = {
  character: {
    mal_id: number;
    name: string;
    images: { jpg: { image_url: string }; webp?: { image_url: string } };
  };
  role: string;
  favorites?: number;
  voice_actors?: {
    person: { mal_id: number; name: string };
    language: string;
  }[];
};

export type AnimeRecommendation = {
  entry: {
    mal_id: number;
    title: string;
    images: { jpg: ImageSet; webp?: ImageSet };
  };
  votes: number;
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
