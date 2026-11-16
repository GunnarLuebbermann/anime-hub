-- AnimeHub – Datenbankschema für Supabase
-- Im Supabase-Dashboard unter "SQL Editor" ausführen. Das Skript ist idempotent
-- und kann auch auf eine bestehende "watchlist"-Tabelle angewendet werden.

create table if not exists public.watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  anime_id text not null,
  anime_title text not null default '',
  anime_image text not null default '',
  created_at timestamptz not null default now()
);

-- Neue Spalten (Status, Bewertung, Fortschritt)
alter table public.watchlist add column if not exists status text not null default 'plan_to_watch';
alter table public.watchlist add column if not exists rating smallint;
alter table public.watchlist add column if not exists episodes_watched integer not null default 0;
alter table public.watchlist add column if not exists episodes_total integer;
alter table public.watchlist add column if not exists updated_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'watchlist_status_check') then
    alter table public.watchlist add constraint watchlist_status_check
      check (status in ('plan_to_watch', 'watching', 'completed', 'on_hold', 'dropped'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'watchlist_rating_check') then
    alter table public.watchlist add constraint watchlist_rating_check
      check (rating is null or rating between 1 and 10);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'watchlist_episodes_check') then
    alter table public.watchlist add constraint watchlist_episodes_check
      check (episodes_watched >= 0);
  end if;
end $$;

-- Doppelte Einträge entfernen (falls vorhanden) und Eindeutigkeit erzwingen
delete from public.watchlist a
  using public.watchlist b
  where a.user_id = b.user_id and a.anime_id = b.anime_id
    and (a.created_at > b.created_at or (a.created_at = b.created_at and a.id > b.id));

create unique index if not exists watchlist_user_anime_idx
  on public.watchlist (user_id, anime_id);

-- Row Level Security: jede*r sieht und bearbeitet nur die eigene Watchlist
alter table public.watchlist enable row level security;

drop policy if exists "watchlist_select_own" on public.watchlist;
create policy "watchlist_select_own" on public.watchlist
  for select using (auth.uid() = user_id);

drop policy if exists "watchlist_insert_own" on public.watchlist;
create policy "watchlist_insert_own" on public.watchlist
  for insert with check (auth.uid() = user_id);

drop policy if exists "watchlist_update_own" on public.watchlist;
create policy "watchlist_update_own" on public.watchlist
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "watchlist_delete_own" on public.watchlist;
create policy "watchlist_delete_own" on public.watchlist
  for delete using (auth.uid() = user_id);
