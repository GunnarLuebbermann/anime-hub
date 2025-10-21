// lib/jikan.ts
type FeedParams = {
  page?: number;
  limit?: number;
  genre?: number;        // Jikan: genres (comma allowed)
  year?: number;         // wir mappen auf start_date/end_date
  sort?: "score" | "popularity" | "episodes"; // map to order_by
};

export interface PaginatedResponse<T> {
  items: T[];
  hasNext: boolean;
  currentPage: number;
  totalPages?: number;
}

// Constants
const JIKAN_BASE_URL = "https://api.jikan.moe/v4";
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 25; // Jikan API limit

const ORDER_BY_MAP: Record<NonNullable<FeedParams["sort"]>, string> = {
  score: "score",
  popularity: "popularity",
  episodes: "episodes",
} as const;

// Helper functions
function validateParams(params: FeedParams): void {
  if (params.limit && (params.limit < 1 || params.limit > MAX_LIMIT)) {
    throw new Error(`Limit must be between 1 and ${MAX_LIMIT}`);
  }
  if (params.page && params.page < 1) {
    throw new Error("Page must be greater than 0");
  }
  if (params.year && (params.year < 1900 || params.year > new Date().getFullYear() + 5)) {
    throw new Error("Invalid year");
  }
}

async function fetchJikan<T>(endpoint: string): Promise<T> {
  const url = `${JIKAN_BASE_URL}${endpoint}`;
  
  try {
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`Jikan API error: ${res.status} ${res.statusText}`);
    }
    
    return await res.json();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch from Jikan API: ${error.message}`);
    }
    throw new Error("Unknown error occurred while fetching from Jikan API");
  }
}

function buildAnimeUrl(params: FeedParams): string {
  const { page = 1, limit = DEFAULT_LIMIT, genre, year, sort = "score" } = params;
  
  const url = new URL(`${JIKAN_BASE_URL}/anime`);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(Math.min(limit, MAX_LIMIT)));
  url.searchParams.set("sfw", "true");
  url.searchParams.set("order_by", ORDER_BY_MAP[sort]);
  url.searchParams.set("sort", "desc");

  if (genre) {
    url.searchParams.set("genres", String(genre));
  }
  
  if (year) {
    url.searchParams.set("start_date", `${year}-01-01`);
    url.searchParams.set("end_date", `${year}-12-31`);
  }

  return url.toString();
}

// Main API functions
export async function getAnimeFeed(params: FeedParams = {}): Promise<PaginatedResponse<Anime>> {
  validateParams(params);
  
  const url = buildAnimeUrl(params);
  const endpoint = url.replace(JIKAN_BASE_URL, "");
  
  const json = await fetchJikan<{
    data: Anime[];
    pagination: {
      has_next_page: boolean;
      current_page: number;
      last_visible_page?: number;
    };
  }>(endpoint);

  return {
    items: json.data,
    hasNext: json.pagination.has_next_page,
    currentPage: json.pagination.current_page,
    totalPages: json.pagination.last_visible_page,
  };
}

export async function getGenres(): Promise<Genre[]> {
  const json = await fetchJikan<{ data: Genre[] }>("/genres/anime");
  return json.data;
}

export async function getAnimeDetails(id: number | string): Promise<Anime> {
  if (!id || (typeof id === "string" && isNaN(Number(id)))) {
    throw new Error("Valid anime ID is required");
  }
  
  const json = await fetchJikan<{ data: Anime }>(`/anime/${id}/full`);
  return json.data;
}

export async function searchAnime(
  query: string, 
  page = 1, 
  limit = DEFAULT_LIMIT
): Promise<PaginatedResponse<Anime>> {
  if (!query.trim()) {
    throw new Error("Search query cannot be empty");
  }
  
  if (page < 1) {
    throw new Error("Page must be greater than 0");
  }

  const safeLimit = Math.min(limit, MAX_LIMIT);
  const endpoint = `/anime?q=${encodeURIComponent(query.trim())}&page=${page}&limit=${safeLimit}&sfw=true`;
  
  const json = await fetchJikan<{
    data: Anime[];
    pagination: {
      has_next_page: boolean;
      current_page: number;
      last_visible_page?: number;
    };
  }>(endpoint);

  return {
    items: json.data,
    hasNext: json.pagination.has_next_page,
    currentPage: json.pagination.current_page,
    totalPages: json.pagination.last_visible_page,
  };
}