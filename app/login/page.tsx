"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { isSupabaseConfigured, requireSupabase, safeNextPath } from "@/lib/supabaseClient";
import { useAuth } from "@/components/providers/AuthProvider";
import GoogleButton from "@/components/auth/GoogleButton";
import {
  AuthCard,
  Divider,
  FormMessage,
  inputClass,
  primaryButtonClass,
  translateAuthError,
} from "@/components/auth/AuthCard";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Bereits angemeldet -> weiterleiten
  useEffect(() => {
    if (user) router.replace(next);
  }, [user, next, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const { error } = await requireSupabase().auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        setError(translateAuthError(error.message));
        return;
      }
      router.replace(next);
    } catch {
      setError("Ein unerwarteter Fehler ist aufgetreten. Bitte versuch es erneut.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <AuthCard title="Login">
        <FormMessage kind="error">Supabase ist nicht konfiguriert. Siehe README.</FormMessage>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Login">
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        {error && <FormMessage kind="error">{error}</FormMessage>}

        <input
          type="email"
          placeholder="E-Mail"
          aria-label="E-Mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          required
          disabled={isLoading}
          autoComplete="email"
        />
        <input
          type="password"
          placeholder="Passwort"
          aria-label="Passwort"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          required
          disabled={isLoading}
          autoComplete="current-password"
        />
        <div className="text-right -mt-2">
          <Link href="/forgot-password" className="text-xs text-gray-400 hover:text-pink-400">
            Passwort vergessen?
          </Link>
        </div>

        <button type="submit" disabled={isLoading || !email || !password} className={primaryButtonClass}>
          {isLoading ? "Anmelden…" : "Login"}
        </button>
      </form>

      <Divider />
      <GoogleButton next={next} onError={(m) => setError(translateAuthError(m))} disabled={isLoading} />

      <p className="text-gray-400 text-sm text-center mt-2">
        Noch keinen Account?{" "}
        <Link href={`/signup?next=${encodeURIComponent(next)}`} className="text-pink-400 hover:underline">
          Registrieren
        </Link>
      </p>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
