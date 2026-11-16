"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { safeNextPath, supabase } from "@/lib/supabaseClient";

function Callback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const next = safeNextPath(searchParams.get("next"));
    const urlError = searchParams.get("error_description");
    if (urlError) {
      setError(urlError);
      return;
    }
    if (!supabase) {
      setError("Supabase ist nicht konfiguriert.");
      return;
    }

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      router.replace(next);
    };

    // supabase-js verarbeitet Token/Code aus der URL automatisch (detectSessionInUrl)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) finish();
    });

    (async () => {
      const code = searchParams.get("code");
      const { data } = await supabase.auth.getSession();
      if (data.session) return finish();
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) return finish();
      }
      // Kurz warten, falls die Sitzung noch aufgebaut wird
      setTimeout(async () => {
        const { data } = await supabase!.auth.getSession();
        if (data.session) finish();
        else if (!done) setError("Anmeldung fehlgeschlagen oder Link abgelaufen.");
      }, 2500);
    })();

    return () => sub.subscription.unsubscribe();
  }, [router, searchParams]);

  return (
    <div className="min-h-[60vh] flex flex-col gap-4 items-center justify-center text-center px-4">
      {error ? (
        <>
          <p className="text-red-400">{error}</p>
          <Link href="/login" className="text-pink-400 hover:underline">
            Zurück zum Login
          </Link>
        </>
      ) : (
        <>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
          <p className="text-gray-300">Du wirst angemeldet…</p>
        </>
      )}
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <Callback />
    </Suspense>
  );
}
