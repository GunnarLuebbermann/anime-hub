"use client";

import { BookmarkPlus, Minus, Plus, Trash2 } from "lucide-react";
import RatingInput from "@/components/RatingInput";
import { useWatchlist } from "@/lib/useWatchlist";
import { WATCH_STATUSES, WATCH_STATUS_LABELS, type WatchStatus, type WatchlistEntry } from "@/types/anime";

type Props = {
  animeId: string;
  title: string;
  image: string;
  episodesTotal?: number | null;
};

/** Steuerung für Status, Bewertung und Fortschritt eines Animes auf der Detailseite. */
export default function WatchlistControls({ animeId, title, image, episodesTotal }: Props) {
  const watchlist = useWatchlist();
  const entry = watchlist.get(animeId);

  if (watchlist.isLoading) {
    return <div className="h-11 w-48 rounded-lg bg-gray-800 animate-pulse" />;
  }

  if (!entry) {
    return (
      <button
        type="button"
        onClick={() => watchlist.add({ animeId, title, image, episodesTotal })}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-700 font-semibold transition"
      >
        <BookmarkPlus size={18} /> Zur Watchlist hinzufügen
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-pink-300">Auf deiner Watchlist</h2>
        <button
          type="button"
          onClick={() => watchlist.remove(animeId)}
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-red-400 transition"
        >
          <Trash2 size={16} /> Entfernen
        </button>
      </div>
      <EntryEditor entry={entry} episodesTotal={episodesTotal ?? entry.episodes_total} />
    </div>
  );
}

/** Wiederverwendbarer Editor für einen Watchlist-Eintrag. */
export function EntryEditor({
  entry,
  episodesTotal,
  compact = false,
}: {
  entry: WatchlistEntry;
  episodesTotal?: number | null;
  compact?: boolean;
}) {
  const watchlist = useWatchlist();
  const total = episodesTotal ?? null;
  const watched = entry.episodes_watched;

  const setStatus = (status: WatchStatus) => {
    const patch: Parameters<typeof watchlist.update>[1] = { status };
    if (status === "completed" && total) patch.episodes_watched = total;
    watchlist.update(entry.anime_id, patch);
  };

  const setEpisodes = (value: number) => {
    const next = Math.max(0, total ? Math.min(total, value) : value);
    if (next === watched) return;
    const patch: Parameters<typeof watchlist.update>[1] = { episodes_watched: next };
    if (total && next === total) patch.status = "completed";
    else if (next > 0 && entry.status === "plan_to_watch") patch.status = "watching";
    watchlist.update(entry.anime_id, patch);
  };

  return (
    <div className={`flex flex-col ${compact ? "gap-2" : "gap-4"}`}>
      <label className="flex flex-col gap-1 text-sm">
        {!compact && <span className="text-gray-400">Status</span>}
        <select
          value={entry.status}
          onChange={(e) => setStatus(e.target.value as WatchStatus)}
          aria-label="Status"
          className="bg-gray-800 text-white px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-pink-500"
        >
          {WATCH_STATUSES.map((s) => (
            <option key={s} value={s}>
              {WATCH_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-1 text-sm">
        {!compact && <span className="text-gray-400">Fortschritt</span>}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEpisodes(watched - 1)}
            disabled={watched <= 0}
            aria-label="Eine Folge weniger"
            className="p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 disabled:opacity-40"
          >
            <Minus size={14} />
          </button>
          <span className="tabular-nums min-w-16 text-center">
            {watched} / {total ?? "?"}
          </span>
          <button
            type="button"
            onClick={() => setEpisodes(watched + 1)}
            disabled={total !== null && watched >= total}
            aria-label="Eine Folge mehr"
            className="p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 disabled:opacity-40"
          >
            <Plus size={14} />
          </button>
        </div>
        {total ? (
          <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden mt-1">
            <div
              className="h-full bg-pink-500 transition-all"
              style={{ width: `${Math.min(100, (watched / total) * 100)}%` }}
            />
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-1 text-sm">
        {!compact && <span className="text-gray-400">Deine Bewertung</span>}
        <RatingInput
          value={entry.rating}
          size={compact ? 16 : 22}
          onChange={(rating) => watchlist.update(entry.anime_id, { rating })}
        />
      </div>
    </div>
  );
}
