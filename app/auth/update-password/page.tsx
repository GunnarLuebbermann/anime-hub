"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { requireSupabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { AuthCard, FormMessage, inputClass, primaryButtonClass, translateAuthError } from "@/components/auth/AuthCard";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const toast = useToast();
  const { user, loading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) return setError("Das Passwort muss mindestens 6 Zeichen lang sein.");
    if (password !== confirm) return setError("Die Passwörter stimmen nicht überein.");

    setIsLoading(true);
    try {
      const { error } = await requireSupabase().auth.updateUser({ password });
      if (error) {
        setError(translateAuthError(error.message));
        return;
      }
      toast("Passwort wurde geändert");
      router.replace("/");
    } finally {
      setIsLoading(false);
    }
  };

  if (!loading && !user) {
    return (
      <AuthCard title="Neues Passwort">
        <FormMessage kind="error">Der Link ist ungültig oder abgelaufen.</FormMessage>
        <Link href="/forgot-password" className="text-sm text-center text-pink-400 hover:underline">
          Neuen Link anfordern
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Neues Passwort">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <FormMessage kind="error">{error}</FormMessage>}
        <input
          type="password"
          placeholder="Neues Passwort"
          aria-label="Neues Passwort"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          disabled={isLoading || loading}
          autoComplete="new-password"
          minLength={6}
          required
        />
        <input
          type="password"
          placeholder="Passwort wiederholen"
          aria-label="Passwort wiederholen"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputClass}
          disabled={isLoading || loading}
          autoComplete="new-password"
          required
        />
        <button type="submit" disabled={isLoading || loading} className={primaryButtonClass}>
          {isLoading ? "Speichern…" : "Passwort speichern"}
        </button>
      </form>
    </AuthCard>
  );
}
