"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export default function Header() {
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  return (
    <header className="sticky top-0 z-50 bg-gray-950/70 backdrop-blur-md border-b border-gray-800">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-pink-400 hover:text-pink-300">
          🎌 AnimeHub
        </Link>

        {/* Navigation */}
        <div className="hidden sm:flex gap-4 text-sm">
          <Link
            href="/"
            className={`hover:text-pink-400 ${
              pathname === "/" ? "text-pink-400 font-semibold" : "text-gray-300"
            }`}
          >
            Home
          </Link>
        </div>
      </nav>
    </header>
  );
}
