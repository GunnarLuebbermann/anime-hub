"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Search, X, RotateCcw } from "lucide-react";
import AnimeCard, { AnimeCardSkeleton } from "@/components/AnimeCard";
import {
  ANIME_TYPES,
  SORT_OPTIONS,
  getAnimeFeed,
  getCurrentSeason,
  getGenres,
  type AnimeTypeKey,
  type SortKey,
} from "@/lib/anilist";

type View = "top" | "season";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR + 1 - 1970 }, (_, i) => CURRENT_YEAR + 1 - i);

function parseFilters(params: URLSearchParams) {
  const num = (key: string) => {
    const v = Number(params.get(key));
    return Number.isInteger(v) && v > 0 ? v : undefined;
  };
  const sort = params.get("sort");
  const type = params.get("type");
  return {
    view: (params.get("view") === "season" ? "season" : "top") as View,
    q: params.get("q")?.trim() ?? "",
    genre: params.get("genre")?.trim() || undefined,
    year: num("year"),
    type: type && type in ANIME_TYPES ? (type as AnimeTypeKey) : undefined,
    sort: sort && sort in SORT_OPTIONS ? (sort as SortKey) : ("score" as SortKey),
  };
}

export default function Discover() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useMemo(() => parseFilters(new URLSearchParams(searchParams.toString())), [searchParams]);
  const [input, setInput] = useState(filters.q);

  // URL ist die einzige Quelle der Wahrheit -> Filter sind teil- und verlinkbar
  const setParams = useCallback(
    (updates: Record<string, string | number | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === "" || (key === "sort" && value === "score") || (key === "view" && value === "top")) {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  // Eingabe entprellt in die URL übernehmen
  useEffect(() => {
    const term = input.trim();
    if (term === filters.q) return;
    const t = setTimeout(() => setParams({ q: term, view: term ? "top" : filters.view }), 450);
    return () => clearTimeout(t);
  }, [input, filters.q, filters.view, setParams]);

  // Zurück/Vor im Browser -> Eingabefeld synchronisieren
  useEffect(() => {
    setInput((prev) => (prev.trim() === filters.q ? prev : filters.q));
  }, [filters.q]);

  const genresQuery = useQuery({ queryKey: ["genres"], queryFn: getGenres, staleTime: Infinity });

  const feed = useInfiniteQuery({
    queryKey: ["feed", filters],
    queryFn: ({ pageParam, signal }) =>
      filters.view === "season"
        ? getCurrentSeason({ page: pageParam, type: filters.type }, signal)
        : getAnimeFeed(
            {
              page: pageParam,
              query: filters.q,
              genre: filters.genre,
              year: filters.year,
              type: filters.type,
              sort: filters.sort,
            },
            signal
          ),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasNext ? last.currentPage + 1 : undefined),
  });

  const animes = useMemo(() => {
    const seen = new Set<string>();
    return (feed.data?.pages ?? [])
      .flatMap((p) => p.items)
      .filter((a) => (seen.has(a.id) ? false : (seen.add(a.id), true)));
  }, [feed.data]);

  // Infinite Scroll
  const sentinel = useRef<HTMLDivElement | null>(null);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = feed;
  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "600px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const hasActiveFilters = Boolean(filters.q || filters.genre || filters.year || filters.type || filters.sort !== "score");
  const genreName = filters.genre;

  const heading =
    filters.view === "season"
      ? "🌸 Aktuelle Saison"
      : filters.q
        ? `🔍 Ergebnisse für „${filters.q}“`
        : [
            filters.sort === "members" ? "💖 Beliebteste" : filters.sort === "trending" ? "📈 Angesagte" : filters.sort === "newest" ? "🆕 Neueste" : "🔥 Top",
            filters.type ? ANIME_TYPES[filters.type].label : "Animes",
            genreName && `· ${genreName}`,
            filters.year && `· ${filters.year}`,
          ]
            .filter(Boolean)
            .join(" ");

  const selectClass =
    "bg-gray-800 text-white px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50";

  return (
    <main className="min-h-screen px-4 sm:px-6 pb-6 max-w-7xl mx-auto text-white">
      {/* --- Tabs --- */}
      <div className="flex justify-center gap-2 mb-5" role="tablist">
        {(
          [
            ["top", "Entdecken"],
            ["season", "Aktuelle Saison"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            role="tab"
            aria-selected={filters.view === value}
            onClick={() => {
              if (value === "season") setInput("");
              setParams({ view: value, q: value === "season" ? undefined : filters.q });
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              filters.view === value ? "bg-pink-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* --- Suche --- */}
      {filters.view === "top" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setParams({ q: input.trim() });
          }}
          className="flex justify-center mb-4"
          role="search"
        >
          <div className="relative w-full max-w-xl">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="search"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Anime suchen…"
              aria-label="Anime suchen"
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-gray-800 text-white outline-none focus:ring-2 focus:ring-pink-500 [&::-webkit-search-cancel-button]:hidden"
            />
            {input && (
              <button
                type="button"
                onClick={() => {
                  setInput("");
                  setParams({ q: undefined });
                }}
                aria-label="Suche leeren"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </form>
      )}

      {/* --- Filter --- */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8">
        {filters.view === "top" && (
          <>
            <select
              aria-label="Genre"
              className={selectClass}
              value={filters.genre ?? ""}
              disabled={genresQuery.isLoading}
              onChange={(e) => setParams({ genre: e.target.value || undefined })}
            >
              <option value="">Alle Genres</option>
              {genresQuery.data?.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>

            <select
              aria-label="Jahr"
              className={selectClass}
              value={filters.year ?? ""}
              onChange={(e) => setParams({ year: e.target.value || undefined })}
            >
              <option value="">Alle Jahre</option>
              {YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </>
        )}

        <select
          aria-label="Typ"
          className={selectClass}
          value={filters.type ?? ""}
          onChange={(e) => setParams({ type: e.target.value || undefined })}
        >
          <option value="">Alle Typen</option>
          {Object.entries(ANIME_TYPES).map(([value, t]) => (
            <option key={value} value={value}>
              {t.label}
            </option>
          ))}
        </select>

        {filters.view === "top" && (
          <select
            aria-label="Sortierung"
            className={selectClass}
            value={filters.sort}
            onChange={(e) => setParams({ sort: e.target.value })}
          >
            {Object.entries(SORT_OPTIONS).map(([value, opt]) => (
              <option key={value} value={value}>
                Sortieren: {opt.label}
              </option>
            ))}
          </select>
        )}

        {hasActiveFilters && filters.view === "top" && (
          <button
            type="button"
            onClick={() => {
              setInput("");
              router.replace(pathname, { scroll: false });
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition"
          >
            <RotateCcw size={14} /> Zurücksetzen
          </button>
        )}
      </div>

      <h1 className="text-2xl font-bold mb-6 text-center text-pink-400">{heading}</h1>

      {/* --- Ergebnisse --- */}
      {feed.isError && animes.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-red-400 mb-4">Animes konnten nicht geladen werden.</p>
          <button
            onClick={() => feed.refetch()}
            className="px-4 py-2 bg-pink-600 hover:bg-pink-700 rounded-lg font-medium transition"
          >
            Erneut versuchen
          </button>
        </div>
      ) : feed.isPending ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {Array.from({ length: 12 }, (_, i) => (
            <AnimeCardSkeleton key={i} />
          ))}
        </div>
      ) : animes.length === 0 ? (
        <div className="text-center text-gray-400 py-16">
          <p className="text-4xl mb-3">🔎</p>
          <p>Keine Animes gefunden. Versuch es mit anderen Filtern.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {animes.map((anime, i) => (
            <AnimeCard key={anime.id} anime={anime} priority={i < 6} />
          ))}
          {isFetchingNextPage &&
            Array.from({ length: 6 }, (_, i) => <AnimeCardSkeleton key={`s-${i}`} />)}
        </div>
      )}

      <div ref={sentinel} aria-hidden className="h-4" />

      {feed.isFetchNextPageError && (
        <div className="text-center mt-6">
          <button
            onClick={() => fetchNextPage()}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition"
          >
            Weitere laden fehlgeschlagen – erneut versuchen
          </button>
        </div>
      )}

      {!hasNextPage && animes.length > 0 && !feed.isFetching && (
        <div className="text-center text-gray-500 mt-6">✨ Keine weiteren Ergebnisse ✨</div>
      )}
    </main>
  );
}
