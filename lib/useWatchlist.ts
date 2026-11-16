"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import {
  addToWatchlist,
  fetchWatchlist,
  removeFromWatchlist,
  updateWatchlistEntry,
  type NewWatchlistEntry,
  type WatchlistPatch,
} from "@/lib/watchlist";
import type { WatchlistEntry } from "@/types/anime";

const watchlistKey = (userId: string | undefined) => ["watchlist", userId] as const;

/**
 * Zentrale Watchlist-Logik: lädt die Liste einmal pro Nutzer*in (gecacht über
 * React Query) und aktualisiert sie optimistisch bei Änderungen.
 */
export function useWatchlist() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const toast = useToast();
  const router = useRouter();
  const key = watchlistKey(userId);

  const query = useQuery({
    queryKey: key,
    queryFn: () => fetchWatchlist(userId!),
    enabled: Boolean(userId),
  });

  const entries = useMemo(() => query.data ?? [], [query.data]);
  const byAnimeId = useMemo(
    () => new Map(entries.map((e) => [e.anime_id, e] as const)),
    [entries]
  );

  const setEntries = (updater: (prev: WatchlistEntry[]) => WatchlistEntry[]) =>
    queryClient.setQueryData<WatchlistEntry[]>(key, (prev) => updater(prev ?? []));

  const snapshot = async () => {
    await queryClient.cancelQueries({ queryKey: key });
    return queryClient.getQueryData<WatchlistEntry[]>(key);
  };

  const onError = (message: string) => (err: unknown, _vars: unknown, ctx?: { prev?: WatchlistEntry[] }) => {
    console.error(err);
    if (ctx?.prev) queryClient.setQueryData(key, ctx.prev);
    toast(message, "error");
  };

  const addMutation = useMutation({
    scope: { id: "watchlist" }, // Änderungen nacheinander ausführen
    mutationFn: (entry: NewWatchlistEntry) => addToWatchlist(userId!, entry),
    onMutate: async (entry) => {
      const prev = await snapshot();
      const optimistic: WatchlistEntry = {
        id: `temp-${entry.animeId}`,
        user_id: userId!,
        anime_id: entry.animeId,
        anime_title: entry.title,
        anime_image: entry.image,
        status: entry.status ?? "plan_to_watch",
        rating: null,
        episodes_watched: 0,
        episodes_total: entry.episodesTotal ?? null,
        created_at: new Date().toISOString(),
      };
      setEntries((list) => [optimistic, ...list.filter((e) => e.anime_id !== entry.animeId)]);
      return { prev };
    },
    onSuccess: (saved, entry) => {
      setEntries((list) => list.map((e) => (e.anime_id === saved.anime_id ? saved : e)));
      toast(`„${entry.title}“ zur Watchlist hinzugefügt`);
    },
    onError: onError("Konnte nicht zur Watchlist hinzufügen"),
  });

  const removeMutation = useMutation({
    scope: { id: "watchlist" }, // Änderungen nacheinander ausführen
    mutationFn: (animeId: string) => removeFromWatchlist(userId!, animeId),
    onMutate: async (animeId) => {
      const prev = await snapshot();
      setEntries((list) => list.filter((e) => e.anime_id !== animeId));
      return { prev };
    },
    onSuccess: (_data, animeId) => {
      const title = byAnimeId.get(animeId)?.anime_title;
      toast(title ? `„${title}“ entfernt` : "Von der Watchlist entfernt");
    },
    onError: onError("Konnte nicht von der Watchlist entfernen"),
  });

  const updateMutation = useMutation({
    scope: { id: "watchlist" }, // Änderungen nacheinander ausführen
    mutationFn: ({ animeId, patch }: { animeId: string; patch: WatchlistPatch }) =>
      updateWatchlistEntry(userId!, animeId, patch),
    onMutate: async ({ animeId, patch }) => {
      const prev = await snapshot();
      setEntries((list) => list.map((e) => (e.anime_id === animeId ? { ...e, ...patch } : e)));
      return { prev };
    },
    onSuccess: (saved) => {
      setEntries((list) => list.map((e) => (e.anime_id === saved.anime_id ? saved : e)));
    },
    onError: onError("Änderung konnte nicht gespeichert werden"),
  });

  const requireLogin = useCallback(() => {
    const next = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
    toast("Bitte melde dich an, um deine Watchlist zu nutzen", "error");
    router.push(`/login?next=${encodeURIComponent(next)}`);
  }, [router, toast]);

  return {
    user,
    ready: !authLoading && (!userId || query.isFetched),
    isLoading: authLoading || (Boolean(userId) && query.isLoading),
    error: query.error as Error | null,
    entries,
    get: (animeId: string) => byAnimeId.get(animeId),
    has: (animeId: string) => byAnimeId.has(animeId),
    add: (entry: NewWatchlistEntry) => (userId ? addMutation.mutate(entry) : requireLogin()),
    remove: (animeId: string) => (userId ? removeMutation.mutate(animeId) : requireLogin()),
    update: (animeId: string, patch: WatchlistPatch) =>
      userId ? updateMutation.mutate({ animeId, patch }) : requireLogin(),
    refetch: query.refetch,
  };
}
