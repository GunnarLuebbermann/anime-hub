"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/");
      } else {
        router.push("/login");
      }
    })();
  }, [router]);

  return (
    <div className="h-screen flex items-center justify-center text-white">
      Logging you in...
    </div>
  );
}
