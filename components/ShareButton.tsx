"use client";

import { Share2 } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

export default function ShareButton({ title, text }: { title: string; text?: string }) {
  const toast = useToast();

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast("Link in die Zwischenablage kopiert");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      toast("Teilen nicht möglich", "error");
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-medium transition"
    >
      <Share2 size={16} /> Teilen
    </button>
  );
}
