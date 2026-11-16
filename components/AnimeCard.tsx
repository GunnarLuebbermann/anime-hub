import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import WatchlistButton from "@/components/WatchlistButton";
import { animeImage, animeTitle } from "@/lib/jikan";
import type { Anime } from "@/types/anime";

export default function AnimeCard({ anime, priority = false }: { anime: Anime; priority?: boolean }) {
  const title = animeTitle(anime);
  const image = animeImage(anime);

  return (
    <Link href={`/anime/${anime.mal_id}`} className="group block focus:outline-none">
      <div className="relative overflow-hidden rounded-2xl bg-gray-900 aspect-[2/3] ring-1 ring-gray-800 group-hover:ring-pink-500/60 group-focus-visible:ring-2 group-focus-visible:ring-pink-500 transition">
        {image && (
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            priority={priority}
          />
        )}
        <WatchlistButton
          animeId={String(anime.mal_id)}
          animeTitle={title}
          animeImage={image}
          episodesTotal={anime.episodes}
        />
        {anime.rank ? (
          <div className="absolute top-2 left-2 z-10 bg-pink-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md">
            #{anime.rank}
          </div>
        ) : null}
        <div className="absolute bottom-0 inset-x-0 p-2 flex items-center justify-between gap-2 bg-gradient-to-t from-black/85 via-black/40 to-transparent">
          <span className="inline-flex items-center gap-1 text-white text-xs bg-black/60 px-2 py-1 rounded backdrop-blur-sm">
            <Star size={12} className="fill-yellow-400 text-yellow-400" />
            {anime.score ? anime.score.toFixed(2) : "–"}
          </span>
          {anime.type && (
            <span className="text-[10px] uppercase tracking-wide text-gray-200 bg-black/60 px-2 py-1 rounded">
              {anime.type}
            </span>
          )}
        </div>
      </div>
      <h2 className="font-semibold text-sm md:text-base line-clamp-2 text-white mt-2 group-hover:text-pink-300 transition-colors">
        {title}
      </h2>
      <p className="text-xs text-gray-400 line-clamp-1">
        {[anime.year ?? anime.aired?.from?.slice(0, 4), anime.genres?.[0]?.name]
          .filter(Boolean)
          .join(" · ")}
      </p>
    </Link>
  );
}

export function AnimeCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="rounded-2xl bg-gray-800/70 aspect-[2/3]" />
      <div className="h-4 bg-gray-800/70 rounded mt-2 w-4/5" />
      <div className="h-3 bg-gray-800/50 rounded mt-1 w-1/2" />
    </div>
  );
}
