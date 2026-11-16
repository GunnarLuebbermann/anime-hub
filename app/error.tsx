"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 gap-4">
      <p className="text-6xl">😵</p>
      <h1 className="text-2xl font-bold text-pink-400">Da ist etwas schiefgelaufen</h1>
      <p className="text-gray-400 max-w-md">
        Die Daten konnten nicht geladen werden. Die AniList API ist manchmal kurz überlastet – versuch es gleich noch einmal.
      </p>
      <div className="flex gap-3">
        <button onClick={reset} className="px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-700 font-medium transition">
          Erneut versuchen
        </button>
        <Link href="/" className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 font-medium transition">
          Zur Übersicht
        </Link>
      </div>
    </main>
  );
}
