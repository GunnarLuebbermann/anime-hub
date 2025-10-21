"use client";

import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial user
    const getInitialUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="sticky top-0 bg-gray-950/70 backdrop-blur-md border-b border-gray-800">
      <nav className="max-w-7xl mx-auto flex justify-between px-4 py-3 items-center">
        <Link href="/" className="text-2xl font-bold text-pink-400">
          🎌 AnimeHub
        </Link>

        <div className="flex items-center gap-4">
          {loading ? (
            <div className="text-gray-400">Loading...</div>
          ) : user ? (
            <>
              <Link href="/watchlist" className="text-gray-300 hover:text-pink-400">
                Watchlist
              </Link>
              <button
                onClick={handleSignOut}
                className="text-gray-400 hover:text-pink-500"
              >
                Logout
              </button>
            </>
          ) : (
            <Link href="/login" className="text-gray-300 hover:text-pink-400">
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}