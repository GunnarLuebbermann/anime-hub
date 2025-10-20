// lib/jikan.ts
type FeedParams = {
  page?: number;
  limit?: number;
  genre?: number;        // Jikan: genres (comma allowed)
  year?: number;         // wir mappen auf start_date/end_date
  sort?: "score" | "popularity" | "episodes"; // map to order_by
};

const ORDER_BY_MAP: Record<NonNullable<FeedParams["sort"]>, string> = {
  score: "score",
  popularity: "popularity",
  episodes: "episodes",
};

// Hauptfeed mit Filtern über /anime (NICHT /top/anime)
export async function getAnimeFeed(params: FeedParams = {}) {
  const { page = 1, limit = 12, genre, year, sort = "score" } = params;

  const url = new URL("https://api.jikan.moe/v4/anime");
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("sfw", "true");
  url.searchParams.set("order_by", ORDER_BY_MAP[sort]);
  url.searchParams.set("sort", "desc");

  if (genre) url.searchParams.set("genres", String(genre));
  if (year) {
    url.searchParams.set("start_date", `${year}-01-01`);
    url.searchParams.set("end_date", `${year}-12-31`);
  }

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Anime-Feed fehlgeschlagen");
  const json = await res.json();

  // gib auch Pagination zurück
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: json.data as any[],
    hasNext: json.pagination?.has_next_page === true,
  };
}

export async function getGenres() {
  const res = await fetch("https://api.jikan.moe/v4/genres/anime");
  if (!res.ok) throw new Error("Genres fehlgeschlagen");
  const json = await res.json();
  return json.data;
}

export async function getAnimeDetails(id: number | string) {
  const res = await fetch(`https://api.jikan.moe/v4/anime/${id}/full`);
  if (!res.ok) throw new Error("Details fehlgeschlagen");
  const json = await res.json();
  return json.data;
}

export async function searchAnime(query: string, page = 1) {
  const res = await fetch(
    `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&page=${page}&limit=12&sfw=true`
  );
  if (!res.ok) throw new Error("Fehler bei der Suche");
  const json = await res.json();
  return {
    items: json.data,
    hasNext: json.pagination?.has_next_page === true,
  };
}