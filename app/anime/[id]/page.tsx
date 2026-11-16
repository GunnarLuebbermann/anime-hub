import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ArrowLeft, ExternalLink, Heart, Star, Trophy, TrendingUp, Users } from "lucide-react";
import WatchlistControls from "@/components/WatchlistControls";
import ShareButton from "@/components/ShareButton";
import { AnimeApiError, getAnimeDetails } from "@/lib/anilist";
import { formatLabel, seasonLabel, sourceLabel, statusLabel } from "@/lib/labels";

type PageProps = { params: Promise<{ id: string }> };

// Pro Request nur einmal laden (Metadata + Seite)
const loadAnime = cache(async (id: string) => {
  try {
    return await getAnimeDetails(id);
  } catch (error) {
    if (error instanceof AnimeApiError && (error.status === 404 || error.status === 400)) notFound();
    throw error;
  }
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const anime = await loadAnime(id);
  const description = anime.synopsis?.slice(0, 200) ?? undefined;
  return {
    title: anime.title,
    description,
    openGraph: {
      title: anime.title,
      description,
      images: anime.imageLarge ? [anime.imageLarge] : undefined,
    },
  };
}

const nf = new Intl.NumberFormat("de-DE");

function formatDate(value: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function AnimeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const anime = await loadAnime(id);

  const aired = [formatDate(anime.startDate), formatDate(anime.endDate)].filter(Boolean).join(" – ");
  const nextEpisode = anime.nextEpisode
    ? `Folge ${anime.nextEpisode.episode} am ${new Date(anime.nextEpisode.airingAt * 1000).toLocaleString("de-DE", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Berlin",
      })}`
    : null;

  const info: [string, React.ReactNode][] = [
    ["Typ", anime.format && formatLabel(anime.format)],
    ["Folgen", anime.episodes],
    ["Status", anime.status && statusLabel(anime.status)],
    ["Nächste Folge", nextEpisode],
    ["Ausgestrahlt", aired],
    ["Saison", anime.season && anime.year ? `${seasonLabel(anime.season)} ${anime.year}` : anime.year],
    ["Dauer", anime.duration ? `${anime.duration} min pro Folge` : null],
    ["Vorlage", anime.source && sourceLabel(anime.source)],
    ["Studios", anime.studios.join(", ")],
  ];

  return (
    <main className="min-h-screen pb-6 text-gray-100">
      {anime.banner && (
        <div className="relative h-40 sm:h-56 -mt-4 mb-6 overflow-hidden">
          <Image src={anime.banner} alt="" fill sizes="100vw" className="object-cover opacity-50" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-950" />
        </div>
      )}

      <div className="px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-pink-400 hover:text-pink-300 transition font-medium"
          >
            <ArrowLeft size={18} /> Zur Übersicht
          </Link>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* --- Seitenleiste --- */}
          <aside className="md:w-72 shrink-0 flex flex-col gap-4">
            <div
              style={anime.color ? { backgroundColor: anime.color } : undefined}
              className="relative aspect-[2/3] w-full max-w-72 mx-auto md:mx-0 rounded-2xl overflow-hidden shadow-lg bg-gray-900"
            >
              {anime.imageLarge && (
                <Image src={anime.imageLarge} alt={anime.title} fill sizes="288px" className="object-cover" priority />
              )}
            </div>

            <WatchlistControls
              animeId={anime.id}
              title={anime.title}
              image={anime.image}
              episodesTotal={anime.episodes}
            />

            <dl className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 text-sm grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
              {info
                .filter(([, value]) => value !== null && value !== undefined && value !== "")
                .map(([label, value]) => (
                  <div key={label} className="contents">
                    <dt className="text-gray-500">{label}</dt>
                    <dd className="text-gray-200">{value}</dd>
                  </div>
                ))}
            </dl>
          </aside>

          {/* --- Inhalt --- */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-pink-400">{anime.title}</h1>
            {(anime.titleNative || anime.titleRomaji !== anime.title) && (
              <p className="text-gray-400 mt-1">
                {[anime.titleRomaji !== anime.title ? anime.titleRomaji : null, anime.titleNative]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}

            <div className="flex flex-wrap gap-3 my-5 text-sm">
              <Stat icon={<Star size={16} className="fill-yellow-400 text-yellow-400" />} label="Score">
                {anime.score ? anime.score.toFixed(1) : "–"}
              </Stat>
              <Stat icon={<Trophy size={16} className="text-pink-400" />} label="Rang">
                {anime.rank ? `#${nf.format(anime.rank)}` : "–"}
              </Stat>
              <Stat icon={<TrendingUp size={16} className="text-pink-400" />} label="Beliebtheit">
                {anime.popularityRank ? `#${nf.format(anime.popularityRank)}` : "–"}
              </Stat>
              <Stat icon={<Users size={16} className="text-pink-400" />} label="Mitglieder">
                {anime.members ? nf.format(anime.members) : "–"}
              </Stat>
              {anime.favourites ? (
                <Stat icon={<Heart size={16} className="text-pink-400" />} label="Favoriten">
                  {nf.format(anime.favourites)}
                </Stat>
              ) : null}
            </div>

            {(anime.genres.length > 0 || anime.tags.length > 0) && (
              <div className="flex flex-wrap gap-2 mb-5">
                {anime.genres.map((g) => (
                  <Link
                    key={`g-${g}`}
                    href={`/?genre=${encodeURIComponent(g)}`}
                    className="text-xs px-3 py-1 rounded-full bg-pink-600/20 text-pink-200 hover:bg-pink-600/40 transition"
                  >
                    {g}
                  </Link>
                ))}
                {anime.tags.map((t) => (
                  <span key={`t-${t}`} className="text-xs px-3 py-1 rounded-full bg-gray-800 text-gray-300">
                    {t}
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-3 mb-6">
              <ShareButton title={anime.title} text={`Schau dir „${anime.title}“ auf AnimeHub an!`} />
              <ExtLink href={anime.siteUrl}>AniList</ExtLink>
              {anime.malUrl && <ExtLink href={anime.malUrl}>MyAnimeList</ExtLink>}
            </div>

            <Section title="Handlung">
              <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                {anime.synopsis || "Für diesen Anime ist noch keine Beschreibung vorhanden."}
              </p>
            </Section>

            {anime.trailerYoutubeId && (
              <Section title="Trailer">
                <div className="aspect-video rounded-xl overflow-hidden shadow-lg border border-gray-800">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${anime.trailerYoutubeId}`}
                    title={`${anime.title} – Trailer`}
                    allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    className="w-full h-full"
                  />
                </div>
              </Section>
            )}

            {anime.streaming.length > 0 && (
              <Section title="Streaming">
                <div className="flex flex-wrap gap-2">
                  {anime.streaming.map((s) => (
                    <a
                      key={s.url}
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition"
                    >
                      {s.name} <ExternalLink size={12} />
                    </a>
                  ))}
                </div>
              </Section>
            )}

            {anime.characters.length > 0 && (
              <Section title="Charaktere">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {anime.characters.map((c) => (
                    <div key={c.id} className="flex gap-3 items-center rounded-xl bg-gray-900/60 p-2">
                      <div className="relative w-12 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-800">
                        {c.image && <Image src={c.image} alt={c.name} fill sizes="48px" className="object-cover" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium line-clamp-2">{c.name}</p>
                        <p className="text-xs text-gray-500">
                          {c.role === "MAIN" ? "Hauptrolle" : c.role === "SUPPORTING" ? "Nebenrolle" : "Hintergrund"}
                        </p>
                        {c.voiceActor && <p className="text-xs text-gray-400 truncate">🎙 {c.voiceActor}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {anime.recommendations.length > 0 && (
              <Section title="Ähnliche Animes">
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                  {anime.recommendations.map((r) => (
                    <Link key={r.id} href={`/anime/${r.id}`} className="group">
                      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-gray-900 ring-1 ring-gray-800 group-hover:ring-pink-500/60 transition">
                        {r.image && (
                          <Image
                            src={r.image}
                            alt={r.title}
                            fill
                            sizes="(max-width: 640px) 33vw, 16vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        )}
                      </div>
                      <p className="text-xs mt-1 line-clamp-2 group-hover:text-pink-300 transition-colors">
                        {r.title}
                      </p>
                    </Link>
                  ))}
                </div>
              </Section>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-medium transition"
    >
      <ExternalLink size={16} /> {children}
    </a>
  );
}

function Stat({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 bg-gray-900/70 border border-gray-800 px-3 py-2 rounded-xl">
      {icon}
      <div>
        <div className="text-[11px] uppercase tracking-wide text-gray-500">{label}</div>
        <div className="font-semibold">{children}</div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3 text-gray-100">{title}</h2>
      {children}
    </section>
  );
}
