import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** true, wenn die Supabase-Umgebungsvariablen gesetzt sind. */
export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * Supabase-Client oder `null`, wenn keine Zugangsdaten konfiguriert sind.
 * So lässt sich die App (Entdecken, Details) auch ohne Supabase bauen und nutzen.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      "Supabase ist nicht konfiguriert. Bitte NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local setzen."
    );
  }
  return supabase;
}

/** Erlaubt nur relative Weiterleitungen innerhalb der App. */
export function safeNextPath(next: string | null | undefined, fallback = "/"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}
