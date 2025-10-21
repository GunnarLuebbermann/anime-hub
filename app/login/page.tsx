"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password 
      });
      
      if (error) {
        setError(error.message);
        return;
      }

      router.push("/");
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-950 px-4">
      <form
        onSubmit={handleLogin}
        className="bg-gray-900 p-6 rounded-2xl shadow-lg w-full max-w-sm flex flex-col gap-4"
      >
        <h1 className="text-2xl font-bold text-pink-400 text-center">Login</h1>
        
        {error && (
          <div className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded">
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-gray-800 text-white px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-pink-500"
          required
          disabled={isLoading}
          autoComplete="email"
        />
        
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-gray-800 text-white px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-pink-500"
          required
          disabled={isLoading}
          autoComplete="current-password"
        />

        <button
          type="submit"
          disabled={isLoading || !email || !password}
          className="bg-pink-600 hover:bg-pink-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-2 transition-colors"
        >
          {isLoading ? "Signing in..." : "Login"}
        </button>

        <p className="text-gray-400 text-sm text-center mt-2">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-pink-400 hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </main>
  );
}
