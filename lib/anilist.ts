// lib/anilist.ts – Client für die öffentliche AniList GraphQL API
// Doku: https://docs.anilist.co
import type {
  Anime,
  AnimeCharacter,
  AnimeDetails,
  AnimeRecommendation,
  PaginatedResponse,
} from "@/types/anime";

export const ANILIST_URL = process.env.NEXT_PUBLIC_ANILIST_API_URL || "https://graphql.anilist.co";
export const PAGE_SIZE = 24;
const MAX_RETRIES = 3;
const MIN_REQUEST_GAP_MS = 350;

export const SORT_OPTIONS = {
  score: { label: "Bewertung", value: "SCORE_DESC" },
  members: { label: "Beliebtheit", value: "POPULARITY_DESC" },
  trending: { label: "Im Trend", value: "TRENDING_DESC" },
  newest: { label: "Neueste", value: "START_DATE_DESC" },
  title: { label: "Titel (A–Z)", value: "TITLE_ROMAJI" },
} as const;

export type SortKey = keyof typeof SORT_OPTIONS;

export const ANIME_TYPES = {
  tv: { label: "TV", formats: ["TV", "TV_SHORT"] },
  movie: { label: "Film", formats: ["MOVIE"] },
  ova: { label: "OVA", formats: ["OVA"] },
  special: { label: "Special", formats: ["SPECIAL"] },
  ona: { label: "ONA", formats: ["ONA"] },
} as const;

export type AnimeTypeKey = keyof typeof ANIME_TYPES;

export type FeedParams = {
  page?: number;
  query?: string;
  genre?: string;
  year?: number;
  type?: AnimeTypeKey;
  sort?: SortKey;
};

export class AnimeApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "AnimeApiError";
  }
}

// --- GraphQL-Fragmente ---------------------------------------------------------

const CARD_FIELDS = `
  id idMal
  title { romaji english native }
  coverImage { large extraLarge color }
  format episodes status season seasonYear
  averageScore popularity
  startDate { year month day }
  genres
  rankings { rank type allTime }
`;

const DETAIL_FIELDS = `
  ${CARD_FIELDS}
  bannerImage favourites duration source(version: 3) siteUrl
  endDate { year month day }
  description(asHtml: false)
  tags { name rank isMediaSpoiler }
  studios(isMain: true) { nodes { name } }
  trailer { id site }
  externalLinks { site url type }
  nextAiringEpisode { episode airingAt }
  characters(sort: [ROLE, RELEVANCE, ID], perPage: 12) {
    edges {
      role
      node { id name { full } image { medium } }
      voiceActors(language: JAPANESE, sort: [RELEVANCE, ID]) { name { full } }
    }
  }
  recommendations(sort: [RATING_DESC, ID], perPage: 12) {
    nodes { mediaRecommendation { id idMal isAdult title { romaji english } coverImage { large } } }
  }
`;

const PAGE_INFO = "pageInfo { hasNextPage currentPage lastPage }";

// --- Request-Handling --------------------------------------------------------

const isServer = typeof window === "undefined";
let lastRequest = 0;

async function throttle() {
  if (isServer) return;
  const now = Date.now();
  const wait = Math.max(0, lastRequest + MIN_REQUEST_GAP_MS - now);
  lastRequest = now + wait;
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type GraphQLResponse<T> = { data?: T; errors?: { message: string; status?: number }[] };

async function gql<T>(
  query: string,
  variables: Record<string, unknown>,
  { revalidate = 3600, signal }: { revalidate?: number; signal?: AbortSignal } = {}
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    await throttle();

    let res: Response;
    try {
      res = await fetch(ANILIST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ query, variables }),
        signal,
        ...(isServer ? { next: { revalidate } } : {}),
      } as RequestInit);
    } catch (error) {
      if (signal?.aborted) throw error;
      if (attempt < MAX_RETRIES) {
        await sleep(500 * 2 ** attempt);
        continue;
      }
      throw new AnimeApiError(
        `AniList nicht erreichbar: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // Rate-Limit (90 Anfragen/Minute) oder Serverfehler -> erneut versuchen
    if ((res.status === 429 || res.status >= 500) && attempt < MAX_RETRIES) {
      const retryAfter = Number(res.headers.get("Retry-After"));
      await sleep(retryAfter > 0 ? Math.min(retryAfter, 30) * 1000 : 1000 * 2 ** attempt);
      continue;
    }

    let json: GraphQLResponse<T> | null = null;
    try {
      json = (await res.json()) as GraphQLResponse<T>;
    } catch {
      /* keine gültige JSON-Antwort */
    }

    if (!res.ok || json?.errors?.length || !json?.data) {
      const err = json?.errors?.[0];
      throw new AnimeApiError(
        `AniList Fehler: ${err?.message ?? `${res.status} ${res.statusText}`}`,
        err?.status ?? res.status
      );
    }

    return json.data;
  }
}

// --- Mapping -----------------------------------------------------------------

type FuzzyDate = { year?: number | null; month?: number | null; day?: number | null } | null;

type RawMedia = {
  id: number;
  idMal: number | null;
  title: { romaji: string | null; english: string | null; native: string | null };
  coverImage: { large: string | null; extraLarge?: string | null; color?: string | null };
  format: string | null;
  episodes: number | null;
  status: string | null;
  season: string | null;
  seasonYear: number | null;
  averageScore: number | null;
  popularity: number | null;
  startDate: FuzzyDate;
  genres: string[] | null;
  rankings: { rank: number; type: string; allTime: boolean }[] | null;
  // nur Detail
  bannerImage?: string | null;
  favourites?: number | null;
  duration?: number | null;
  source?: string | null;
  siteUrl?: string;
  endDate?: FuzzyDate;
  description?: string | null;
  tags?: { name: string; rank: number; isMediaSpoiler: boolean }[];
  studios?: { nodes: { name: string }[] };
  trailer?: { id: string; site: string } | null;
  externalLinks?: { site: string; url: string; type: string }[];
  nextAiringEpisode?: { episode: number; airingAt: number } | null;
  characters?: {
    edges: {
      role: AnimeCharacter["role"];
      node: { id: number; name: { full: string }; image: { medium: string } };
      voiceActors: { name: { full: string } }[];
    }[];
  };
  recommendations?: {
    nodes: {
      mediaRecommendation: {
        id: number;
        idMal: number | null;
        isAdult: boolean;
        title: { romaji: string | null; english: string | null };
        coverImage: { large: string | null };
      } | null;
    }[];
  };
};

/** App-ID: MAL-ID (kompatibel zur bestehenden Watchlist) oder "al-<id>". */
export function toAppId(media: { id: number; idMal: number | null }): string {
  return media.idMal ? String(media.idMal) : `al-${media.id}`;
}

function formatDate(d: FuzzyDate): string | null {
  if (!d?.year) return null;
  return [d.year, d.month ?? 1, d.day ?? 1].map((n, i) => String(n).padStart(i ? 2 : 4, "0")).join("-");
}

/** AniList-Beschreibungen enthalten HTML (<br>, <i> …) – in Klartext umwandeln. */
export function cleanDescription(html: string | null | undefined): string | null {
  if (!html) return null;
  const text = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text || null;
}

function mapMedia(m: RawMedia): Anime {
  const ranking = (type: string) =>
    m.rankings?.find((r) => r.type === type && r.allTime)?.rank ?? null;
  const title = m.title.english || m.title.romaji || m.title.native || "Unbenannt";

  return {
    id: toAppId(m),
    anilistId: m.id,
    malId: m.idMal,
    title,
    titleRomaji: m.title.romaji || title,
    titleNative: m.title.native,
    image: m.coverImage.large || m.coverImage.extraLarge || "",
    imageLarge: m.coverImage.extraLarge || m.coverImage.large || "",
    color: m.coverImage.color ?? null,
    banner: m.bannerImage ?? null,
    format: m.format,
    episodes: m.episodes,
    status: m.status,
    startDate: formatDate(m.startDate),
    endDate: formatDate(m.endDate ?? null),
    season: m.season,
    year: m.seasonYear ?? m.startDate?.year ?? null,
    duration: m.duration ?? null,
    score: m.averageScore ? m.averageScore / 10 : null,
    members: m.popularity,
    favourites: m.favourites ?? null,
    rank: ranking("RATED"),
    popularityRank: ranking("POPULAR"),
    genres: m.genres ?? [],
    tags: (m.tags ?? []).filter((t) => !t.isMediaSpoiler && t.rank >= 60).slice(0, 8).map((t) => t.name),
    studios: m.studios?.nodes.map((s) => s.name) ?? [],
    source: m.source ?? null,
    synopsis: cleanDescription(m.description),
    trailerYoutubeId: m.trailer?.site === "youtube" ? m.trailer.id : null,
    streaming: (m.externalLinks ?? [])
      .filter((l) => l.type === "STREAMING")
      .map((l) => ({ name: l.site, url: l.url })),
    siteUrl: m.siteUrl ?? `https://anilist.co/anime/${m.id}`,
    malUrl: m.idMal ? `https://myanimelist.net/anime/${m.idMal}` : null,
    nextEpisode: m.nextAiringEpisode ?? null,
  };
}

function uniqueById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((i) => (seen.has(i.id) ? false : (seen.add(i.id), true)));
}

type RawPage = {
  Page: {
    pageInfo: { hasNextPage: boolean; currentPage: number; lastPage: number };
    media: RawMedia[];
  };
};

function toPaginated(data: RawPage): PaginatedResponse<Anime> {
  return {
    items: uniqueById(data.Page.media.map(mapMedia)),
    hasNext: data.Page.pageInfo.hasNextPage,
    currentPage: data.Page.pageInfo.currentPage,
    totalPages: data.Page.pageInfo.lastPage,
  };
}

// --- Öffentliche API ---------------------------------------------------------

const FEED_QUERY = `
query Feed($page: Int, $perPage: Int, $search: String, $genre: String, $year: Int,
           $formats: [MediaFormat], $sort: [MediaSort], $season: MediaSeason) {
  Page(page: $page, perPage: $perPage) {
    ${PAGE_INFO}
    media(type: ANIME, isAdult: false, search: $search, genre: $genre, seasonYear: $year,
          season: $season, format_in: $formats, sort: $sort) {
      ${CARD_FIELDS}
    }
  }
}`;

export async function getAnimeFeed(
  { page = 1, query, genre, year, type, sort = "score" }: FeedParams = {},
  signal?: AbortSignal
): Promise<PaginatedResponse<Anime>> {
  const search = query?.trim() || undefined;
  const sortValue = SORT_OPTIONS[sort]?.value ?? SORT_OPTIONS.score.value;
  const data = await gql<RawPage>(
    FEED_QUERY,
    {
      page,
      perPage: PAGE_SIZE,
      search,
      genre: genre || undefined,
      year,
      formats: type ? ANIME_TYPES[type].formats : undefined,
      // Bei einer Suche ohne explizite Sortierung nach Relevanz sortieren
      sort: search && sort === "score" ? ["SEARCH_MATCH"] : [sortValue, "ID"],
    },
    { signal }
  );
  return toPaginated(data);
}

/** Aktuelle Saison nach AniList-Definition (Winter = Jan–März usw.). */
export function currentSeason(date = new Date()) {
  const seasons = ["WINTER", "SPRING", "SUMMER", "FALL"] as const;
  return { season: seasons[Math.floor(date.getMonth() / 3)], year: date.getFullYear() };
}

export async function getCurrentSeason(
  { page = 1, type }: { page?: number; type?: AnimeTypeKey } = {},
  signal?: AbortSignal
): Promise<PaginatedResponse<Anime>> {
  const { season, year } = currentSeason();
  const data = await gql<RawPage>(
    FEED_QUERY,
    {
      page,
      perPage: PAGE_SIZE,
      season,
      year,
      formats: type ? ANIME_TYPES[type].formats : undefined,
      sort: ["POPULARITY_DESC", "ID"],
    },
    { signal }
  );
  return toPaginated(data);
}

// Genres, die AniList nur für Erwachseneninhalte nutzt
const HIDDEN_GENRES = new Set(["Hentai"]);

export async function getGenres(): Promise<string[]> {
  const data = await gql<{ GenreCollection: string[] }>("query { GenreCollection }", {}, { revalidate: 86400 });
  return data.GenreCollection.filter((g) => !HIDDEN_GENRES.has(g)).sort((a, b) => a.localeCompare(b));
}

const DETAIL_QUERY = `
query Detail($id: Int, $idMal: Int) {
  Media(id: $id, idMal: $idMal, type: ANIME) { isAdult ${DETAIL_FIELDS} }
}`;

/**
 * Lädt einen Anime inkl. Charakteren und Empfehlungen in einer einzigen Anfrage.
 * `id` ist eine MAL-ID ("5114") oder eine AniList-ID mit Präfix ("al-12345").
 */
export async function getAnimeDetails(id: string): Promise<AnimeDetails> {
  const match = /^(al-)?(\d+)$/.exec(id);
  if (!match) throw new AnimeApiError("Ungültige Anime-ID", 404);
  const num = Number(match[2]);
  const variables = match[1] ? { id: num } : { idMal: num };

  const data = await gql<{ Media: (RawMedia & { isAdult: boolean }) | null }>(DETAIL_QUERY, variables);
  if (!data.Media || data.Media.isAdult) throw new AnimeApiError("Anime nicht gefunden", 404);

  const media = data.Media;
  const characters: AnimeCharacter[] = (media.characters?.edges ?? []).map((e) => ({
    id: e.node.id,
    name: e.node.name.full,
    image: e.node.image.medium,
    role: e.role,
    voiceActor: e.voiceActors[0]?.name.full ?? null,
  }));
  const recommendations: AnimeRecommendation[] = uniqueById(
    (media.recommendations?.nodes ?? [])
      .map((n) => n.mediaRecommendation)
      .filter((r): r is NonNullable<typeof r> => Boolean(r && !r.isAdult))
      .map((r) => ({
        id: toAppId(r),
        title: r.title.english || r.title.romaji || "",
        image: r.coverImage.large || "",
      }))
  );

  return { ...mapMedia(media), characters, recommendations };
}
