"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { getAnimeFeed, getGenres, searchAnime } from "@/lib/jikan";

export default function HomePage() {
  const [animes, setAnimes] = useState<any[]>([]);
  const [genres, setGenres] = useState<any[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<number | undefined>();
  const [selectedYear, setSelectedYear] = useState<number | undefined>();
  const [selectedSort, setSelectedSort] = useState<"score" | "popularity" | "episodes">("score");

  const [query, setQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastRef = useRef<HTMLDivElement | null>(null);

  // --- IntersectionObserver für Infinite Scroll ---
  useEffect(() => {
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) setPage((p) => p + 1);
      },
      { rootMargin: "200px" }
    );
    if (lastRef.current) observer.current.observe(lastRef.current);
  }, [hasMore, loading, query, selectedGenre, selectedYear, selectedSort]);

  // --- Initial: Genres + erste Seite ---
  useEffect(() => {
    (async () => {
      const [g, first] = await Promise.all([
        getGenres(),
        getAnimeFeed({ page: 1, sort: selectedSort }),
      ]);
      setGenres(g);
      setAnimes(first.items);
      setHasMore(first.hasNext);
      setLoading(false);
    })();
  }, []);

  // --- Paging nachladen ---
  useEffect(() => {
    if (page === 1) return;
    (async () => {
      setLoading(true);
      const next = query.trim()
        ? await searchAnime(query.trim(), page)
        : await getAnimeFeed({
          page,
          genre: selectedGenre,
          year: selectedYear,
          sort: selectedSort,
        });
      setAnimes((prev) => [...prev, ...next.items]);
      setHasMore(next.hasNext);
      setLoading(false);
    })();
  }, [page]);

  // --- Filter oder Suche anwenden ---
  async function handleFilterChange() {
    setLoading(true);
    setPage(1);
    const first = query.trim()
      ? await searchAnime(query.trim(), 1)
      : await getAnimeFeed({
        page: 1,
        genre: selectedGenre,
        year: selectedYear,
        sort: selectedSort,
      });
    setAnimes(first.items);
    setHasMore(first.hasNext);
    setLoading(false);
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const term = query.trim();
    if (!term) return;
    setActiveSearch(term);
    await handleFilterChange(); // deine bestehende Fetch-Funktion
  }

  return (
    <main className="min-h-screen p-6 max-w-7xl mx-auto">

      {/* 🔍 Suchfeld */}
      <form onSubmit={handleSearch} className="flex justify-center gap-3 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Anime suchen..."
          className="px-4 py-2 rounded-lg bg-gray-800 text-white w-64 outline-none focus:ring-2 focus:ring-pink-500"
        />

        {/* Suche */}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-pink-600 hover:bg-pink-700 rounded-lg font-medium transition"
        >
          Suchen
        </button>

        {/* Reset */}
        <button
          type="button"
          disabled={loading}
          onClick={async () => {
            // Alles zurücksetzen
            setQuery("");
            setSelectedGenre(undefined);
            setSelectedYear(undefined);
            setSelectedSort("score");
            setActiveSearch(null); // 👈 wichtig: Suchstatus zurücksetzen
            setPage(1);
            setLoading(true);

            // Top-Animes neu laden
            const top = await getAnimeFeed({ page: 1, sort: "score" });
            setAnimes(top.items);
            setHasMore(top.hasNext);
            setLoading(false);
          }}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition text-white"
        >
          Reset
        </button>

      </form>


      {/* Filter */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        <select
          className="bg-gray-800 text-white px-3 py-2 rounded-lg"
          value={selectedGenre ?? ""}
          onChange={(e) =>
            setSelectedGenre(e.target.value ? Number(e.target.value) : undefined)
          }
        >
          <option value="">Alle Genres</option>
          {genres.map((g: any) => (
            <option key={g.mal_id} value={g.mal_id}>
              {g.name}
            </option>
          ))}
        </select>

        <select
          className="bg-gray-800 text-white px-3 py-2 rounded-lg"
          value={selectedYear ?? ""}
          onChange={(e) =>
            setSelectedYear(e.target.value ? Number(e.target.value) : undefined)
          }
        >
          <option value="">Alle Jahre</option>
          {Array.from({ length: 25 }, (_, i) => 2025 - i).map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        <select
          className="bg-gray-800 text-white px-3 py-2 rounded-lg"
          value={selectedSort}
          onChange={(e) => setSelectedSort(e.target.value as any)}
        >
          <option value="score">Score</option>
          <option value="popularity">Popularity</option>
          <option value="episodes">Episodes</option>
        </select>

        <button
          onClick={handleFilterChange}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition"
        >
          Filter anwenden
        </button>
      </div>

      <h1 className="text-2xl font-bold mb-6 text-center text-pink-400">
        {activeSearch ? `🔍 Suchergebnisse für "${activeSearch}"` : "🔥 Top Animes"}
      </h1>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        {animes.map((anime, i) => (
          <Link href={`/anime/${anime.mal_id}`} key={anime.mal_id}>
            <div
              ref={i === animes.length - 1 ? lastRef : null}
              className="relative group overflow-hidden rounded-2xl hover:shadow-pink-500/20 transition-all duration-500"
            >
              {anime.rank && (
                <div className="absolute top-2 right-2 z-10 bg-pink-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md">
                  #{anime.rank}
                </div>
              )}
              <img
                src={anime.images.jpg.image_url}
                alt={anime.title}
                className="w-full aspect-[2/3] object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                <h2 className="font-semibold text-sm md:text-base line-clamp-2 text-white drop-shadow">
                  {anime.title_english || anime.title}
                </h2>
                <span className="text-white text-xs bg-black/60 px-2 py-1 rounded backdrop-blur-sm">
                  ⭐ {anime.score ?? "N/A"}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {loading && <p className="text-center text-gray-400 mt-6">Lade weitere Animes...</p>}
    </main>
  );
}
