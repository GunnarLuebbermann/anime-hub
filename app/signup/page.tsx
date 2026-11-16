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

const MIN_PASSWORD = 6;

function SignupForm() {
  const router = useRouter();
  const next = safeNextPath(useSearchParams().get("next"));
  const { user } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", confirm: "" });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) router.replace(next);
  }, [user, next, router]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (form.password.length < MIN_PASSWORD) {
      setError(`Das Passwort muss mindestens ${MIN_PASSWORD} Zeichen lang sein.`);
      return;
    }
    if (form.password !== form.confirm) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await requireSupabase().auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) {
        setError(translateAuthError(error.message));
        return;
      }
      if (data.session) {
        router.replace(next);
      } else {
        // E-Mail-Bestätigung ist im Supabase-Projekt aktiviert
        setSuccess("Fast geschafft! Wir haben dir eine E-Mail geschickt – bitte bestätige deine Adresse.");
        setForm({ email: "", password: "", confirm: "" });
      }
    } catch {
      setError("Ein unerwarteter Fehler ist aufgetreten.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <AuthCard title="Registrieren">
        <FormMessage kind="error">Supabase ist nicht konfiguriert. Siehe README.</FormMessage>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Registrieren">
      <form onSubmit={handleSignup} className="flex flex-col gap-4">
        {error && <FormMessage kind="error">{error}</FormMessage>}
        {success && <FormMessage kind="success">{success}</FormMessage>}

        <input
          type="email"
          name="email"
          placeholder="E-Mail"
          aria-label="E-Mail"
          value={form.email}
          onChange={onChange}
          className={inputClass}
          disabled={isLoading}
          autoComplete="email"
          required
        />
        <input
          type="password"
          name="password"
          placeholder={`Passwort (mind. ${MIN_PASSWORD} Zeichen)`}
          aria-label="Passwort"
          value={form.password}
          onChange={onChange}
          className={inputClass}
          disabled={isLoading}
          autoComplete="new-password"
          minLength={MIN_PASSWORD}
          required
        />
        <input
          type="password"
          name="confirm"
          placeholder="Passwort wiederholen"
          aria-label="Passwort wiederholen"
          value={form.confirm}
          onChange={onChange}
          className={inputClass}
          disabled={isLoading}
          autoComplete="new-password"
          required
        />

        <button type="submit" disabled={isLoading} className={primaryButtonClass}>
          {isLoading ? "Wird erstellt…" : "Account erstellen"}
        </button>
      </form>

      <Divider />
      <GoogleButton
        next={next}
        label="Mit Google registrieren"
        onError={(m) => setError(translateAuthError(m))}
        disabled={isLoading}
      />

      <p className="text-gray-400 text-sm text-center mt-2">
        Schon registriert?{" "}
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-pink-400 hover:underline">
          Zum Login
        </Link>
      </p>
    </AuthCard>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
