"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogIn, LogOut, Compass, Bookmark } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";

export default function Header() {
  const { user, loading, configured, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast("Du wurdest abgemeldet");
      router.push("/");
    } catch (error) {
      console.error("Fehler beim Abmelden:", error);
      toast("Abmelden fehlgeschlagen", "error");
    }
  };

  const navLink = (href: string, label: string, Icon: typeof Compass) => {
    const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md transition ${
          active ? "text-pink-400" : "text-gray-300 hover:text-pink-400"
        }`}
      >
        <Icon size={18} />
        <span className="hidden sm:inline">{label}</span>
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
      <nav className="max-w-7xl mx-auto flex justify-between gap-4 px-4 py-3 items-center">
        <Link href="/" className="text-xl sm:text-2xl font-bold text-pink-400 shrink-0">
          🎌 AnimeHub
        </Link>

        <div className="flex items-center gap-2 sm:gap-4 text-sm sm:text-base">
          {navLink("/", "Entdecken", Compass)}
          {configured && navLink("/watchlist", "Watchlist", Bookmark)}

          {!configured ? null : loading ? (
            <div className="h-5 w-16 rounded bg-gray-800 animate-pulse" aria-label="Lädt" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <span
                className="hidden md:inline max-w-48 truncate text-gray-500 text-sm"
                title={user.email ?? undefined}
              >
                {user.user_metadata?.full_name || user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 text-gray-400 hover:text-pink-500 transition"
                title="Abmelden"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <Link
              href={`/login?next=${encodeURIComponent(pathname)}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-700 text-white font-medium transition"
            >
              <LogIn size={16} />
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
