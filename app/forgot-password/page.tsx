"use client";

import { useState } from "react";
import Link from "next/link";
import { requireSupabase } from "@/lib/supabaseClient";
import { AuthCard, FormMessage, inputClass, primaryButtonClass, translateAuthError } from "@/components/auth/AuthCard";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const { error } = await requireSupabase().auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
      });
      if (error) setError(translateAuthError(error.message));
      else setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unerwarteter Fehler");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard title="Passwort vergessen">
      {sent ? (
        <FormMessage kind="success">
          Falls ein Account mit dieser Adresse existiert, haben wir dir einen Link zum Zurücksetzen geschickt.
        </FormMessage>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-gray-400 text-center">
            Gib deine E-Mail-Adresse ein. Wir schicken dir einen Link, mit dem du ein neues Passwort setzen kannst.
          </p>
          {error && <FormMessage kind="error">{error}</FormMessage>}
          <input
            type="email"
            placeholder="E-Mail"
            aria-label="E-Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            disabled={isLoading}
            autoComplete="email"
            required
          />
          <button type="submit" disabled={isLoading || !email} className={primaryButtonClass}>
            {isLoading ? "Senden…" : "Link senden"}
          </button>
        </form>
      )}
      <p className="text-sm text-center">
        <Link href="/login" className="text-pink-400 hover:underline">
          Zurück zum Login
        </Link>
      </p>
    </AuthCard>
  );
}
