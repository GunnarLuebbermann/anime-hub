"use client";

import { Star } from "lucide-react";
import { useState } from "react";

/** Bewertung von 1–10, dargestellt als 5 Sterne mit halben Schritten. */
export default function RatingInput({
  value,
  onChange,
  size = 22,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  size?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value ?? 0;

  return (
    <div className="flex items-center gap-2">
      <div className="flex" onMouseLeave={() => setHover(null)} role="radiogroup" aria-label="Eigene Bewertung">
        {[1, 2, 3, 4, 5].map((star) => {
          const full = shown >= star * 2;
          const half = !full && shown >= star * 2 - 1;
          return (
            <span key={star} className="relative inline-block" style={{ width: size, height: size }}>
              <Star size={size} className="text-gray-600" />
              {(full || half) && (
                <span className="absolute inset-0 overflow-hidden" style={{ width: full ? "100%" : "50%" }}>
                  <Star size={size} className="fill-yellow-400 text-yellow-400" />
                </span>
              )}
              {[star * 2 - 1, star * 2].map((v, i) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={value === v}
                  aria-label={`${v} von 10`}
                  title={`${v}/10`}
                  onMouseEnter={() => setHover(v)}
                  onFocus={() => setHover(v)}
                  onBlur={() => setHover(null)}
                  onClick={() => onChange(value === v ? null : v)}
                  className={`absolute top-0 h-full w-1/2 ${i === 0 ? "left-0" : "right-0"} focus:outline-none`}
                />
              ))}
            </span>
          );
        })}
      </div>
      <span className="text-sm text-gray-300 tabular-nums w-10">{shown ? `${shown}/10` : "–"}</span>
    </div>
  );
}
