"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import { useWatchlist } from "@/lib/useWatchlist";
import { EntryEditor } from "@/components/WatchlistControls";
import { useAuth } from "@/components/providers/AuthProvider";
import { WATCH_STATUSES, WATCH_STATUS_LABELS, type WatchStatus, type WatchlistEntry } from "@/types/anime";

type Filter = "all" | WatchStatus;
type Sort = "added" | "updated" | "title" | "rating";

const SORTS: Record<Sort, { label: string; compare: (a: WatchlistEntry, b: WatchlistEntry) => number }> = {
  added: { label: "Zuletzt hinzugefügt", compare: (a, b) => b.created_at.localeCompare(a.created_at) },
  updated: {
    label: "Zuletzt bearbeitet",
    compare: (a, b) => (b.updated_at ?? b.created_at).localeCompare(a.updated_at ?? a.created_at),
  },
  title: { label: "Titel (A–Z)", compare: (a, b) => a.anime_title.localeCompare(b.anime_title, "de") },
  rating: { label: "Eigene Bewertung", compare: (a, b) => (b.rating ?? 0) - (a.rating ?? 0) },
};

export default function WatchlistPage() {
  const { configured } = useAuth();
  const watchlist = useWatchlist();
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("added");

  const counts = useMemo(() => {
    const c = Object.fromEntries(WATCH_STATUSES.map((s) => [s, 0])) as Record<WatchStatus, number>;
    for (const e of watchlist.entries) c[e.status] = (c[e.status] ?? 0) + 1;
    return c;
  }, [watchlist.entries]);

  const stats = useMemo(() => {
    const rated = watchlist.entries.filter((e) => e.rating);
    return {
      total: watchlist.entries.length,
      episodes: watchlist.entries.reduce((sum, e) => sum + (e.episodes_watched || 0), 0),
      avg: rated.length ? rated.reduce((s, e) => s + (e.rating ?? 0), 0) / rated.length : null,
    };
  }, [watchlist.entries]);

  const visible = useMemo(
    () =>
      watchlist.entries
        .filter((e) => filter === "all" || e.status === filter)
        .sort(SORTS[sort].compare),
    [watchlist.entries, filter, sort]
  );

  if (!configured) {
    return (
      <Notice title="Watchlist nicht verfügbar">
        Für die Watchlist muss Supabase konfiguriert sein (siehe README).
      </Notice>
    );
  }

  if (watchlist.isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-8 w-56 bg-gray-800 rounded mb-6 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="aspect-[2/3] rounded-2xl bg-gray-800/70 animate-pulse" />
          ))}
        </div>
      </main>
    );
  }

  if (!watchlist.user) {
    return (
      <Notice title="Melde dich an">
        Mit einem Account kannst du Animes speichern, deinen Fortschritt verfolgen und Bewertungen vergeben.
        <div className="flex gap-3 justify-center mt-6">
          <Link href="/login?next=/watchlist" className="px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-700 font-medium">
            Login
          </Link>
          <Link href="/signup" className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 font-medium">
            Registrieren
          </Link>
        </div>
      </Notice>
    );
  }

  if (watchlist.error) {
    return (
      <Notice title="Watchlist konnte nicht geladen werden">
        <span className="text-red-400">{watchlist.error.message}</span>
        <div className="mt-6">
          <button
            onClick={() => watchlist.refetch()}
            className="px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-700 font-medium"
          >
            Erneut versuchen
          </button>
        </div>
      </Notice>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-pink-400">📺 Meine Watchlist</h1>
          <p className="text-sm text-gray-400 mt-1">
            {stats.total} Animes · {stats.episodes} Folgen gesehen
            {stats.avg !== null && ` · Ø Bewertung ${stats.avg.toFixed(1)}/10`}
          </p>
        </div>
        <select
          aria-label="Sortierung"
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="bg-gray-800 text-white px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-pink-500"
        >
          {Object.entries(SORTS).map(([value, s]) => (
            <option key={value} value={value}>
              Sortieren: {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6" role="tablist">
        {(["all", ...WATCH_STATUSES] as Filter[]).map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition ${
              filter === f ? "bg-pink-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            {f === "all" ? "Alle" : WATCH_STATUS_LABELS[f]}{" "}
            <span className="opacity-70">{f === "all" ? stats.total : counts[f]}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="text-center text-gray-400 py-16">
          <p className="text-4xl mb-3">📭</p>
          {stats.total === 0 ? (
            <>
              <p>Deine Watchlist ist noch leer.</p>
              <Link href="/" className="inline-block mt-4 text-pink-400 hover:underline">
                Jetzt Animes entdecken →
              </Link>
            </>
          ) : (
            <p>In dieser Kategorie ist noch nichts.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {visible.map((entry) => (
            <article key={entry.anime_id} className="flex flex-col">
              <Link href={`/anime/${entry.anime_id}`} className="group block">
                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-gray-900 ring-1 ring-gray-800 group-hover:ring-pink-500/60 transition">
                  {entry.anime_image && (
                    <Image
                      src={entry.anime_image}
                      alt={entry.anime_title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                  <span className="absolute top-2 left-2 text-[11px] font-semibold px-2 py-1 rounded-md bg-black/70 backdrop-blur-sm">
                    {WATCH_STATUS_LABELS[entry.status]}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      watchlist.remove(entry.anime_id);
                    }}
                    aria-label={`„${entry.anime_title}“ entfernen`}
                    title="Entfernen"
                    className="absolute top-2 right-2 p-2 rounded-full bg-black/70 hover:bg-red-600 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <h2 className="font-semibold text-sm md:text-base line-clamp-2 mt-2 group-hover:text-pink-300 transition-colors">
                  {entry.anime_title}
                </h2>
              </Link>
              <div className="mt-2">
                <EntryEditor entry={entry} episodesTotal={entry.episodes_total} compact />
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="max-w-xl mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-pink-400 mb-3">{title}</h1>
      <div className="text-gray-400">{children}</div>
    </main>
  );
}
