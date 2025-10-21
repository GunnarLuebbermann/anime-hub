"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      router.push("/");
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-950 p-4">
      <form
        onSubmit={handleSignup}
        className="bg-gray-900 p-6 rounded-2xl shadow-lg w-full max-w-sm flex flex-col gap-4"
      >
        <h1 className="text-2xl font-bold text-pink-400 text-center">
          Registrieren
        </h1>
        
        {error && (
          <p className="text-red-400 text-sm text-center bg-red-400/10 p-2 rounded">
            {error}
          </p>
        )}

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleInputChange}
          className="bg-gray-800 text-white px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-pink-400"
          disabled={isLoading}
          required
        />
        
        <input
          type="password"
          name="password"
          placeholder="Passwort"
          value={formData.password}
          onChange={handleInputChange}
          className="bg-gray-800 text-white px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-pink-400"
          disabled={isLoading}
          required
        />

        <button
          type="submit"
          disabled={isLoading}
          className="bg-pink-600 hover:bg-pink-700 disabled:bg-pink-600/50 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-2 transition-colors"
        >
          {isLoading ? "Wird erstellt..." : "Account erstellen"}
        </button>
      </form>
    </main>
  );
}
