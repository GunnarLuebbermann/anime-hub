# 🎌 AnimeHub

Entdecke, bewerte und teile deine Lieblingsanimes. AnimeHub nutzt die öffentliche
[Jikan API](https://jikan.moe) (MyAnimeList-Daten) und [Supabase](https://supabase.com)
für Accounts und die persönliche Watchlist.

## Features

- **Entdecken** – Top-Animes mit Infinite Scroll, Suche (entprellt), Filter nach Genre,
  Jahr und Typ sowie Sortierung nach Bewertung, Beliebtheit, Datum oder Titel.
  Alle Filter stehen in der URL und lassen sich teilen.
- **Aktuelle Saison** – alle Animes, die gerade laufen.
- **Detailseite** – Score, Rang, Infos, Genres, Handlung, Trailer, Streaming-Links,
  Charaktere mit Sprecher*innen, ähnliche Animes und Teilen-Button.
- **Watchlist** – Status (Geplant, Schaue ich, Abgeschlossen, Pausiert, Abgebrochen),
  Folgen-Fortschritt, eigene Bewertung (1–10), Statistik, Filter und Sortierung.
  Änderungen werden sofort (optimistisch) angezeigt.
- **Accounts** – E-Mail/Passwort, Google-Login, Passwort vergessen/zurücksetzen.
- Läuft auch ohne Supabase: Entdecken und Details funktionieren, Login/Watchlist
  werden dann ausgeblendet.

## Setup

```bash
npm install
cp .env.example .env.local   # Werte eintragen
npm run dev                  # http://localhost:3000
```

### Supabase einrichten

1. Projekt auf [supabase.com](https://supabase.com) anlegen.
2. Unter **Project Settings → API** URL und `anon`-Key in `.env.local` eintragen.
3. Im **SQL Editor** den Inhalt von [`supabase/schema.sql`](supabase/schema.sql) ausführen.
   Das Skript legt die Tabelle `watchlist` inkl. Row Level Security an und migriert
   eine bestehende Tabelle (neue Spalten, Unique-Index).
4. Unter **Authentication → URL Configuration** die Site-URL setzen und als Redirect-URLs
   z. B. `http://localhost:3000/**` und `https://deine-domain.de/**` eintragen.
5. Optional: Google unter **Authentication → Providers** aktivieren.

### Umgebungsvariablen

| Variable | Beschreibung |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL des Supabase-Projekts |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Öffentlicher `anon`-Key |
| `NEXT_PUBLIC_JIKAN_API_URL` | Optional: eigene Jikan-Instanz (Standard: `https://api.jikan.moe/v4`) |

## Skripte

| Befehl | Zweck |
| --- | --- |
| `npm run dev` | Entwicklungsserver |
| `npm run build` | Produktions-Build |
| `npm start` | Produktionsserver |
| `npm run lint` | ESLint |

## Projektstruktur

```
app/                 Seiten (App Router)
  anime/[id]/        Detailseite (Server Component)
  watchlist/         Persönliche Watchlist
  login, signup, forgot-password, auth/…   Authentifizierung
components/          UI-Komponenten, Provider (Auth, Toasts, React Query)
lib/jikan.ts         Jikan-Client mit Rate-Limit-Handling und Retries
lib/watchlist.ts     Supabase-Zugriff auf die Watchlist
lib/useWatchlist.ts  Hook mit Caching und optimistischen Updates
supabase/schema.sql  Datenbankschema + RLS-Policies
types/anime.ts       Gemeinsame Typen
```

## Hinweise

- Die Jikan API erlaubt ca. 3 Anfragen pro Sekunde. Der Client verteilt Anfragen und
  wiederholt sie bei `429` automatisch; Serverseitig werden Antworten gecacht.
- Deployment z. B. auf Vercel: Umgebungsvariablen dort eintragen und die Domain
  in Supabase als Redirect-URL freigeben.
