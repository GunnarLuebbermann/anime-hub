import { Suspense } from "react";
import Discover from "@/components/Discover";
import { AnimeCardSkeleton } from "@/components/AnimeCard";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <main className="px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 mt-40">
            {Array.from({ length: 12 }, (_, i) => (
              <AnimeCardSkeleton key={i} />
            ))}
          </div>
        </main>
      }
    >
      <Discover />
    </Suspense>
  );
}
