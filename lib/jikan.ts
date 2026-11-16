// lib/jikan.ts – kleiner Client für die öffentliche Jikan API (MyAnimeList)
import type {
  Anime,
  AnimeCharacter,
  AnimeRecommendation,
  Genre,
  PaginatedResponse,
} from "@/types/anime";

// Optional überschreibbar, z. B. für eine selbst gehostete Jikan-Instanz
export const JIKAN_BASE_URL = process.env.NEXT_PUBLIC_JIKAN_API_URL || "https://api.jikan.moe/v4";
export const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 25; // Limit der Jikan API
const MAX_RETRIES = 3;
const MIN_REQUEST_GAP_MS = 400; // Jikan erlaubt ~3 Requests pro Sekunde

export const SORT_OPTIONS = {
  score: { label: "Bewertung", orderBy: "score", direction: "desc" },
  members: { label: "Beliebtheit", orderBy: "members", direction: "desc" },
  newest: { label: "Neueste", orderBy: "start_date", direction: "desc" },
  title: { label: "Titel (A–Z)", orderBy: "title", direction: "asc" },
} as const;

export type SortKey = keyof typeof SORT_OPTIONS;

export const ANIME_TYPES = {
  tv: "TV",
  movie: "Film",
  ova: "OVA",
  special: "Special",
  ona: "ONA",
} as const;

export type AnimeTypeKey = keyof typeof ANIME_TYPES;

export type FeedParams = {
  page?: number;
  limit?: number;
  query?: string;
  genre?: number;
  year?: number;
  type?: AnimeTypeKey;
  sort?: SortKey;
};

export class JikanError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "JikanError";
  }
}

type JikanPaginated<T> = {
  data: T[];
  pagination: {
    has_next_page: boolean;
    current_page: number;
    last_visible_page?: number;
  };
};

// --- Request-Handling --------------------------------------------------------

const isServer = typeof window === "undefined";
let lastRequest = 0;

/** Verteilt Requests im Browser zeitlich, damit das Rate-Limit nicht greift. */
async function throttle() {
  if (isServer) return;
  const now = Date.now();
  const wait = Math.max(0, lastRequest + MIN_REQUEST_GAP_MS - now);
  lastRequest = now + wait;
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchJikan<T>(
  endpoint: string,
  { revalidate = 3600, signal }: { revalidate?: number; signal?: AbortSignal } = {}
): Promise<T> {
  const url = `${JIKAN_BASE_URL}${endpoint}`;

  for (let attempt = 0; ; attempt++) {
    await throttle();

    let res: Response;
    try {
      res = await fetch(url, {
        signal,
        ...(isServer ? { next: { revalidate } } : {}),
      } as RequestInit);
    } catch (error) {
      if (signal?.aborted) throw error;
      if (attempt < MAX_RETRIES) {
        await sleep(500 * 2 ** attempt);
        continue;
      }
      throw new JikanError(
        `Jikan API nicht erreichbar: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // Rate-Limit oder temporärer Serverfehler -> mit Backoff erneut versuchen
    if ((res.status === 429 || res.status >= 500) && attempt < MAX_RETRIES) {
      await sleep(1000 * 2 ** attempt);
      continue;
    }

    if (!res.ok) {
      throw new JikanError(`Jikan API Fehler: ${res.status} ${res.statusText}`, res.status);
    }

    return (await res.json()) as T;
  }
}

/** Entfernt doppelte Einträge (Jikan liefert gelegentlich Duplikate). */
function uniqueById<T extends { mal_id: number }>(items: T[]): T[] {
  const seen = new Set<number>();
  return items.filter((item) => (seen.has(item.mal_id) ? false : (seen.add(item.mal_id), true)));
}

function toPaginated<T extends { mal_id: number }>(json: JikanPaginated<T>): PaginatedResponse<T> {
  return {
    items: uniqueById(json.data ?? []),
    hasNext: json.pagination?.has_next_page ?? false,
    currentPage: json.pagination?.current_page ?? 1,
    totalPages: json.pagination?.last_visible_page,
  };
}

// --- Öffentliche API ---------------------------------------------------------

export function buildFeedEndpoint(params: FeedParams = {}): string {
  const { page = 1, limit = DEFAULT_LIMIT, query, genre, year, type, sort = "score" } = params;

  if (page < 1) throw new JikanError("Seite muss größer als 0 sein");

  const search = new URLSearchParams();
  search.set("page", String(page));
  search.set("limit", String(Math.min(Math.max(limit, 1), MAX_LIMIT)));
  search.set("sfw", "true");

  const order = SORT_OPTIONS[sort] ?? SORT_OPTIONS.score;
  search.set("order_by", order.orderBy);
  search.set("sort", order.direction);

  const q = query?.trim();
  if (q) search.set("q", q);
  if (genre) search.set("genres", String(genre));
  if (type) search.set("type", type);
  if (year) {
    search.set("start_date", `${year}-01-01`);
    search.set("end_date", `${year}-12-31`);
  }
  // Bei Sortierung nach Score unbewertete Einträge ausblenden
  if (sort === "score" && !q) search.set("min_score", "1");

  return `/anime?${search.toString()}`;
}

export async function getAnimeFeed(
  params: FeedParams = {},
  signal?: AbortSignal
): Promise<PaginatedResponse<Anime>> {
  const json = await fetchJikan<JikanPaginated<Anime>>(buildFeedEndpoint(params), { signal });
  return toPaginated(json);
}

export async function getCurrentSeason(
  { page = 1, type }: { page?: number; type?: AnimeTypeKey } = {},
  signal?: AbortSignal
): Promise<PaginatedResponse<Anime>> {
  const search = new URLSearchParams({
    page: String(page),
    limit: String(DEFAULT_LIMIT),
    sfw: "true",
  });
  if (type) search.set("filter", type);
  const json = await fetchJikan<JikanPaginated<Anime>>(`/seasons/now?${search}`, { signal });
  return toPaginated(json);
}

export async function getGenres(): Promise<Genre[]> {
  const json = await fetchJikan<{ data: Genre[] }>("/genres/anime", { revalidate: 86400 });
  const unique = uniqueById(json.data ?? []);
  return unique.sort((a, b) => a.name.localeCompare(b.name));
}

function assertValidId(id: number | string) {
  if (!/^\d+$/.test(String(id))) {
    throw new JikanError("Ungültige Anime-ID", 404);
  }
}

export async function getAnimeDetails(id: number | string): Promise<Anime> {
  assertValidId(id);
  const json = await fetchJikan<{ data: Anime }>(`/anime/${id}/full`);
  return json.data;
}

export async function getAnimeCharacters(id: number | string): Promise<AnimeCharacter[]> {
  assertValidId(id);
  const json = await fetchJikan<{ data: AnimeCharacter[] }>(`/anime/${id}/characters`, {
    revalidate: 86400,
  });
  return json.data ?? [];
}

export async function getAnimeRecommendations(
  id: number | string
): Promise<AnimeRecommendation[]> {
  assertValidId(id);
  const json = await fetchJikan<{ data: AnimeRecommendation[] }>(
    `/anime/${id}/recommendations`,
    { revalidate: 86400 }
  );
  const seen = new Set<number>();
  return (json.data ?? []).filter((r) =>
    seen.has(r.entry.mal_id) ? false : (seen.add(r.entry.mal_id), true)
  );
}

/** Für die Karten: beste verfügbare Bild-URL. */
export function animeImage(anime: Pick<Anime, "images">, large = false): string {
  const jpg = anime.images?.jpg;
  const webp = anime.images?.webp;
  return (
    (large ? webp?.large_image_url || jpg?.large_image_url : undefined) ||
    webp?.image_url ||
    jpg?.image_url ||
    ""
  );
}

export function animeTitle(anime: Pick<Anime, "title" | "title_english">): string {
  return anime.title_english || anime.title;
}
