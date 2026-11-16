import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 gap-4">
      <p className="text-6xl">🍙</p>
      <h1 className="text-2xl font-bold text-pink-400">Seite nicht gefunden</h1>
      <p className="text-gray-400 max-w-md">
        Diese Seite gibt es nicht – vielleicht wurde der Anime entfernt oder der Link ist falsch.
      </p>
      <Link href="/" className="px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-700 font-medium transition">
        Zur Übersicht
      </Link>
    </main>
  );
}
