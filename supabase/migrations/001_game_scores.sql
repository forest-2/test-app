-- Migration: 001_game_scores.sql
-- Run in Supabase Dashboard → SQL Editor

create table if not exists public.game_scores (
  id                   bigserial    primary key,
  session_id           uuid         not null,
  topic                text         not null,
  user_idea            text         not null check (char_length(user_idea) <= 500),
  score_originality    int          not null check (score_originality    between 0 and 33),
  score_practicality   int          not null check (score_practicality   between 0 and 33),
  score_unexpectedness int          not null check (score_unexpectedness between 0 and 34),
  total_score          int          not null check (total_score          between 0 and 100),
  ai_comment           text,
  played_at            timestamptz  not null default now()
);

-- Row Level Security
alter table public.game_scores enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'game_scores' and policyname = 'Anyone can insert game scores'
  ) then
    create policy "Anyone can insert game scores"
      on public.game_scores for insert
      with check (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'game_scores' and policyname = 'Anyone can read game scores'
  ) then
    create policy "Anyone can read game scores"
      on public.game_scores for select
      using (true);
  end if;
end $$;

-- Indexes
create index if not exists idx_game_scores_session_played
  on public.game_scores (session_id, played_at desc);

create index if not exists idx_game_scores_total_score
  on public.game_scores (total_score desc, played_at desc);

create index if not exists idx_game_scores_played_at
  on public.game_scores (played_at desc);
