import Link from "next/link";
import Image from "next/image";
import { getAnimeDetails } from "@/lib/jikan";

export default async function AnimeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const anime = await getAnimeDetails(params.id);

  if (!anime) {
    return (
      <main className="min-h-screen p-6 max-w-5xl mx-auto text-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400">Anime not found</h1>
          <Link href="/" className="text-pink-400 hover:text-pink-300 mt-4 inline-block">
            Back to overview
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 max-w-5xl mx-auto text-gray-100">
      {/* Back Button */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-pink-400 hover:text-pink-300 transition font-medium"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M10.53 3.47a.75.75 0 0 1 0 1.06L4.81 10.25H20a.75.75 0 0 1 0 1.5H4.81l5.72 5.72a.75.75 0 1 1-1.06 1.06l-7-7a.75.75 0 0 1 0-1.06l7-7a.75.75 0 0 1 1.06 0z"
              clipRule="evenodd"
            />
          </svg>
          Back to Overview
        </Link>
      </div>

      {/* Anime Details */}
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3">
          <Image
            src={anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || "/placeholder-anime.jpg"}
            alt={anime.title || "Anime image"}
            width={400}
            height={600}
            className="rounded-2xl shadow-lg w-full object-cover"
            priority
          />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-3 text-pink-400">
            {anime.title_english || anime.title}
          </h1>
          {anime.synopsis && (
            <p className="text-gray-400 mb-4">{anime.synopsis}</p>
          )}
          <div className="flex flex-wrap gap-3 mb-4 text-sm">
            <span className="bg-gray-800 px-3 py-1 rounded-lg">
              ⭐ Score: {anime.score ?? "N/A"}
            </span>
            <span className="bg-gray-800 px-3 py-1 rounded-lg">
              🎬 Episodes: {anime.episodes ?? "?"}
            </span>
            <span className="bg-gray-800 px-3 py-1 rounded-lg">
              🗓️ Year: {anime.year ?? "?"}
            </span>
          </div>

          {/* Trailer */}
          {anime.trailer?.embed_url && (
            <div className="aspect-video rounded-xl overflow-hidden shadow-lg border border-gray-800">
              <iframe
                src={`${anime.trailer.embed_url}?autoplay=0`}
                title={`${anime.title} Trailer`}
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
