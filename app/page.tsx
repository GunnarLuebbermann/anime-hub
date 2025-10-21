"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { getAnimeFeed, getGenres, searchAnime } from "@/lib/jikan";
import WatchlistButton from "@/components/WatchlistButton";

export default function HomePage() {
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<number | undefined>();
  const [selectedYear, setSelectedYear] = useState<number | undefined>();
  const [selectedSort, setSelectedSort] = useState<"score" | "popularity" | "episodes">("score");
  const [query, setQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const observer = useRef<IntersectionObserver | null>(null);

  // --- FETCH DATA ---
  const fetchData = useCallback(async (pageNum: number, isNewSearch = false) => {
    setLoading(true);

    try {
      const result = query.trim()
        ? await searchAnime(query.trim(), pageNum)
        : await getAnimeFeed({
          page: pageNum,
          genre: selectedGenre,
          year: selectedYear,
          sort: selectedSort,
        });

      setAnimes(prev => (isNewSearch || pageNum === 1 ? result.items : [...prev, ...result.items]));
      setHasMore(result.hasNext);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, [query, selectedGenre, selectedYear, selectedSort]);

  // --- INITIAL DATA ---
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [genresData, firstPageData] = await Promise.all([
          getGenres(),
          getAnimeFeed({ page: 1, sort: selectedSort }),
        ]);
        setGenres(genresData);
        setAnimes(firstPageData.items);
        setHasMore(firstPageData.hasNext);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedSort]);

  // --- INFINITE SCROLL OBSERVER ---
  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasMore) {
          setPage(prev => prev + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  // --- LOAD NEXT PAGE ---
  useEffect(() => {
    if (page > 1) {
      fetchData(page);
    }
  }, [page, fetchData]);

  // --- FILTER / SEARCH HANDLING ---
  const handleFilterChange = useCallback(async () => {
    setPage(1);
    await fetchData(1, true);
  }, [fetchData]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const term = query.trim();
    if (!term) return;
    setActiveSearch(term);
    setPage(1);
    await fetchData(1, true);
  };

  const handleReset = async () => {
    setQuery("");
    setSelectedGenre(undefined);
    setSelectedYear(undefined);
    setSelectedSort("score");
    setActiveSearch(null);
    setPage(1);
    await fetchData(1, true);
  };

  const years = Array.from({ length: 25 }, (_, i) => 2025 - i);

  return (
    <main className="min-h-screen p-6 max-w-7xl mx-auto text-white">
      {/* --- SEARCH FORM --- */}
      <form onSubmit={handleSearch} className="flex justify-center gap-3 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Anime suchen..."
          className="px-4 py-2 rounded-lg bg-gray-800 text-white w-64 outline-none focus:ring-2 focus:ring-pink-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-pink-600 hover:bg-pink-700 rounded-lg font-medium transition"
        >
          Suchen
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={loading}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition"
        >
          Reset
        </button>
      </form>

      {/* --- FILTERS --- */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        <select
          className="bg-gray-800 text-white px-3 py-2 rounded-lg"
          value={selectedGenre ?? ""}
          onChange={(e) => setSelectedGenre(e.target.value ? Number(e.target.value) : undefined)}
        >
          <option value="">Alle Genres</option>
          {genres.map((genre) => (
            <option key={genre.mal_id} value={genre.mal_id}>{genre.name}</option>
          ))}
        </select>

        <select
          className="bg-gray-800 text-white px-3 py-2 rounded-lg"
          value={selectedYear ?? ""}
          onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : undefined)}
        >
          <option value="">Alle Jahre</option>
          {years.map((year) => <option key={year}>{year}</option>)}
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

      {/* --- ANIME GRID --- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
        {animes.map((anime, index) => {
          const isLast = index === animes.length - 1;
          return (
            <Link href={`/anime/${anime.mal_id}`} key={`${anime.mal_id}-${index}`}>
              <div
                ref={isLast ? lastElementRef : null}
                className="relative group overflow-hidden rounded-2xl hover:shadow-pink-500/20 transition-all duration-500"
              >
                <WatchlistButton
                  animeId={anime.mal_id.toString()}
                  animeTitle={anime.title}
                  animeImage={anime.images.jpg.image_url}
                />
                {anime.rank && (
                  <div className="absolute top-2 left-2 z-10 bg-pink-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md">
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
                  <span className="text-white text-xs bg-black/60 px-2 py-1 rounded backdrop-blur-sm">
                    ⭐ {anime.score ?? "N/A"}
                  </span>
                </div>
              </div>

              <h2 className="font-semibold text-sm md:text-base line-clamp-2 text-white drop-shadow mt-2">
                {anime.title_english || anime.title}
              </h2>
              <h4 className="font-medium text-xs md:text-sm line-clamp-2 text-white opacity-75">
                {anime.genres?.[0]?.name}
              </h4>
            </Link>
          );
        })}
      </div>

      {loading && (
        <div className="text-center text-gray-400 mt-6">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 mr-2"></div>
          Lade weitere Animes...
        </div>
      )}

      {!hasMore && !loading && (
        <div className="text-center text-gray-500 mt-6">✨ Keine weiteren Ergebnisse ✨</div>
      )}
    </main>
  );
}
