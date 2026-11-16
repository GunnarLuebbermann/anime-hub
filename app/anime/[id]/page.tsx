import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ArrowLeft, ExternalLink, Star, Trophy, TrendingUp, Users } from "lucide-react";
import WatchlistControls from "@/components/WatchlistControls";
import ShareButton from "@/components/ShareButton";
import {
  JikanError,
  animeImage,
  animeTitle,
  getAnimeCharacters,
  getAnimeDetails,
  getAnimeRecommendations,
} from "@/lib/jikan";

type PageProps = { params: Promise<{ id: string }> };

// Pro Request nur einmal laden (Metadata + Seite)
const loadAnime = cache(async (id: string) => {
  try {
    return await getAnimeDetails(id);
  } catch (error) {
    if (error instanceof JikanError && (error.status === 404 || error.status === 400)) notFound();
    throw error;
  }
});

/** Zusatzdaten sind optional – Fehler dürfen die Seite nicht kaputt machen. */
async function optional<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    console.warn("Optionale Anime-Daten nicht geladen:", error);
    return fallback;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const anime = await loadAnime(id);
  const title = animeTitle(anime);
  const description = anime.synopsis?.slice(0, 200) ?? undefined;
  const image = animeImage(anime, true);
  return {
    title,
    description,
    openGraph: { title, description, images: image ? [image] : undefined },
  };
}

const nf = new Intl.NumberFormat("de-DE");

const STATUS_DE: Record<string, string> = {
  "Finished Airing": "Abgeschlossen",
  "Currently Airing": "Läuft aktuell",
  "Not yet aired": "Noch nicht ausgestrahlt",
};

const SEASON_DE: Record<string, string> = {
  winter: "Winter",
  spring: "Frühling",
  summer: "Sommer",
  fall: "Herbst",
};

function formatDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function AnimeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const anime = await loadAnime(id);
  // Nacheinander laden, um das Rate-Limit der Jikan API zu schonen
  const characters = await optional(getAnimeCharacters(id), []);
  const recommendations = await optional(getAnimeRecommendations(id), []);

  const title = animeTitle(anime);
  const image = animeImage(anime, true);
  const aired = [formatDate(anime.aired?.from), formatDate(anime.aired?.to)].filter(Boolean).join(" – ");

  const info: [string, React.ReactNode][] = [
    ["Typ", anime.type],
    ["Folgen", anime.episodes],
    ["Status", anime.status ? (STATUS_DE[anime.status] ?? anime.status) : null],
    ["Ausgestrahlt", aired || anime.aired?.string],
    [
      "Saison",
      anime.season && anime.year ? `${SEASON_DE[anime.season] ?? anime.season} ${anime.year}` : anime.year,
    ],
    ["Sendezeit", anime.broadcast?.string],
    ["Dauer", anime.duration?.replace(" per ep", " pro Folge")],
    ["Altersfreigabe", anime.rating],
    ["Vorlage", anime.source],
    ["Studios", anime.studios?.map((s) => s.name).join(", ")],
  ];

  const tags = [...(anime.genres ?? []), ...(anime.themes ?? []), ...(anime.demographics ?? [])];
  const mainCharacters = [...characters]
    .sort((a, b) => (a.role === b.role ? (b.favorites ?? 0) - (a.favorites ?? 0) : a.role === "Main" ? -1 : 1))
    .slice(0, 12);

  return (
    <main className="min-h-screen px-4 sm:px-6 pb-6 max-w-6xl mx-auto text-gray-100">
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
          <div className="relative aspect-[2/3] w-full max-w-72 mx-auto md:mx-0 rounded-2xl overflow-hidden shadow-lg bg-gray-900">
            {image && (
              <Image src={image} alt={title} fill sizes="288px" className="object-cover" priority />
            )}
          </div>

          <WatchlistControls
            animeId={String(anime.mal_id)}
            title={title}
            image={animeImage(anime)}
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
          <h1 className="text-3xl font-bold text-pink-400">{title}</h1>
          {(anime.title_japanese || (anime.title_english && anime.title !== anime.title_english)) && (
            <p className="text-gray-400 mt-1">
              {[anime.title_english && anime.title !== anime.title_english ? anime.title : null, anime.title_japanese]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}

          <div className="flex flex-wrap gap-3 my-5 text-sm">
            <Stat icon={<Star size={16} className="fill-yellow-400 text-yellow-400" />} label="Score">
              {anime.score ? anime.score.toFixed(2) : "–"}
              {anime.scored_by ? (
                <span className="text-gray-500 text-xs ml-1">({nf.format(anime.scored_by)})</span>
              ) : null}
            </Stat>
            <Stat icon={<Trophy size={16} className="text-pink-400" />} label="Rang">
              {anime.rank ? `#${nf.format(anime.rank)}` : "–"}
            </Stat>
            <Stat icon={<TrendingUp size={16} className="text-pink-400" />} label="Beliebtheit">
              {anime.popularity ? `#${nf.format(anime.popularity)}` : "–"}
            </Stat>
            <Stat icon={<Users size={16} className="text-pink-400" />} label="Mitglieder">
              {anime.members ? nf.format(anime.members) : "–"}
            </Stat>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {anime.genres?.map((g) => (
                <Link
                  key={`g-${g.mal_id}`}
                  href={`/?genre=${g.mal_id}`}
                  className="text-xs px-3 py-1 rounded-full bg-pink-600/20 text-pink-200 hover:bg-pink-600/40 transition"
                >
                  {g.name}
                </Link>
              ))}
              {[...(anime.themes ?? []), ...(anime.demographics ?? [])].map((t) => (
                <span key={`t-${t.mal_id}`} className="text-xs px-3 py-1 rounded-full bg-gray-800 text-gray-300">
                  {t.name}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-3 mb-6">
            <ShareButton title={title} text={`Schau dir „${title}“ auf AnimeHub an!`} />
            <a
              href={anime.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-medium transition"
            >
              <ExternalLink size={16} /> MyAnimeList
            </a>
          </div>

          <Section title="Handlung">
            <p className="text-gray-300 leading-relaxed whitespace-pre-line">
              {anime.synopsis || "Für diesen Anime ist noch keine Beschreibung vorhanden."}
            </p>
            {anime.background && (
              <p className="text-gray-400 text-sm leading-relaxed mt-4 whitespace-pre-line">{anime.background}</p>
            )}
          </Section>

          {anime.trailer?.youtube_id && (
            <Section title="Trailer">
              <div className="aspect-video rounded-xl overflow-hidden shadow-lg border border-gray-800">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${anime.trailer.youtube_id}`}
                  title={`${title} – Trailer`}
                  allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                  className="w-full h-full"
                />
              </div>
            </Section>
          )}

          {anime.streaming && anime.streaming.length > 0 && (
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

          {mainCharacters.length > 0 && (
            <Section title="Charaktere">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {mainCharacters.map((c) => {
                  const va = c.voice_actors?.find((v) => v.language === "Japanese");
                  return (
                    <div key={c.character.mal_id} className="flex gap-3 items-center rounded-xl bg-gray-900/60 p-2">
                      <div className="relative w-12 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-800">
                        <Image
                          src={c.character.images.webp?.image_url || c.character.images.jpg.image_url}
                          alt={c.character.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium line-clamp-2">{c.character.name}</p>
                        <p className="text-xs text-gray-500">{c.role === "Main" ? "Hauptrolle" : "Nebenrolle"}</p>
                        {va && <p className="text-xs text-gray-400 truncate">🎙 {va.person.name}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {recommendations.length > 0 && (
            <Section title="Ähnliche Animes">
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {recommendations.slice(0, 12).map((r) => (
                  <Link key={r.entry.mal_id} href={`/anime/${r.entry.mal_id}`} className="group">
                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-gray-900 ring-1 ring-gray-800 group-hover:ring-pink-500/60 transition">
                      <Image
                        src={r.entry.images.webp?.image_url || r.entry.images.jpg.image_url}
                        alt={r.entry.title}
                        fill
                        sizes="(max-width: 640px) 33vw, 16vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <p className="text-xs mt-1 line-clamp-2 group-hover:text-pink-300 transition-colors">
                      {r.entry.title}
                    </p>
                  </Link>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>
    </main>
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
