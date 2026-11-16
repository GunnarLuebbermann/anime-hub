export const inputClass =
  "bg-gray-800 text-white px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-60";

export const primaryButtonClass =
  "bg-pink-600 hover:bg-pink-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-2 transition-colors";

export function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="min-h-[75vh] flex flex-col items-center justify-center px-4">
      <div className="bg-gray-900 p-6 rounded-2xl shadow-lg w-full max-w-sm flex flex-col gap-4 border border-gray-800">
        <h1 className="text-2xl font-bold text-pink-400 text-center">{title}</h1>
        {children}
      </div>
    </main>
  );
}

export function FormMessage({ kind, children }: { kind: "error" | "success"; children: React.ReactNode }) {
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={`text-sm text-center p-2 rounded ${
        kind === "error" ? "text-red-300 bg-red-900/30" : "text-green-300 bg-green-900/30"
      }`}
    >
      {children}
    </div>
  );
}

export function Divider() {
  return (
    <div className="flex items-center gap-3 text-xs text-gray-500">
      <span className="h-px flex-1 bg-gray-800" /> oder <span className="h-px flex-1 bg-gray-800" />
    </div>
  );
}

/** Übersetzt die häufigsten Supabase-Fehlermeldungen. */
export function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-Mail oder Passwort ist falsch.";
  if (m.includes("email not confirmed")) return "Bitte bestätige zuerst deine E-Mail-Adresse.";
  if (m.includes("user already registered")) return "Für diese E-Mail gibt es bereits einen Account.";
  if (m.includes("password should be at least")) return "Das Passwort muss mindestens 6 Zeichen lang sein.";
  if (m.includes("rate limit")) return "Zu viele Versuche. Bitte warte einen Moment.";
  if (m.includes("same password")) return "Das neue Passwort muss sich vom alten unterscheiden.";
  return message;
}
