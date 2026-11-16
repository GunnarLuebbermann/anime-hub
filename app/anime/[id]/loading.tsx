export default function Loading() {
  return (
    <main className="px-4 sm:px-6 max-w-6xl mx-auto animate-pulse" aria-label="Lädt">
      <div className="h-5 w-36 bg-gray-800 rounded mb-6" />
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-72 shrink-0">
          <div className="aspect-[2/3] w-full max-w-72 mx-auto rounded-2xl bg-gray-800" />
          <div className="h-10 mt-4 rounded-lg bg-gray-800" />
        </div>
        <div className="flex-1 space-y-4">
          <div className="h-9 w-2/3 bg-gray-800 rounded" />
          <div className="h-4 w-1/3 bg-gray-800 rounded" />
          <div className="flex gap-3">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-14 w-28 bg-gray-800 rounded-xl" />
            ))}
          </div>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-4 bg-gray-800 rounded" />
          ))}
        </div>
      </div>
    </main>
  );
}
