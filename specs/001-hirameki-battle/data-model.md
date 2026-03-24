# Data Model: 閃き対決

**Branch**: `001-hirameki-battle` | **Date**: 2026-02-27

---

## Entities

### 1. GameScore (Persisted — Supabase)

Represents a single completed game session with its AI-judged result.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | `bigint` | PK, auto-increment | Internal row ID |
| `session_id` | `uuid` | NOT NULL | Client-generated; groups plays from same browser |
| `topic` | `text` | NOT NULL | AI-generated お題 (e.g. "傘の新しい使い方") |
| `user_idea` | `text` | NOT NULL, max 500 chars | Player's submitted idea |
| `score_originality` | `int` | NOT NULL, 0–33 | 独創性 axis score |
| `score_practicality` | `int` | NOT NULL, 0–33 | 実用性 axis score |
| `score_unexpectedness` | `int` | NOT NULL, 0–34 | 意外性 axis score |
| `total_score` | `int` | NOT NULL, 0–100 | Sum of the three axis scores |
| `ai_comment` | `text` | Nullable | AI one-line feedback in Japanese |
| `played_at` | `timestamptz` | NOT NULL, default `now()` | When the game was played |

**State transitions:**
- A `GameScore` row is written **once** (INSERT only; no UPDATE).
- A row is created only after Claude returns a valid score. If scoring fails, no row is inserted.

**Validation rules (enforced at DB level):**
```sql
check (score_originality    between 0 and 33)
check (score_practicality   between 0 and 33)
check (score_unexpectedness between 0 and 34)
check (total_score          between 0 and 100)
check (char_length(user_idea) <= 500)
```

---

### 2. SessionContext (Client-side only — localStorage)

Represents the anonymous player identity for a browser. Never persisted in the database directly; only `session_id` is stored as a foreign key in `game_scores`.

| Field | Type | Storage | Notes |
|-------|------|---------|-------|
| `sessionId` | `string (UUID v4)` | `localStorage["game_session_id"]` | Generated once per browser; reused across page loads |

**Lifecycle:**
- Generated on first game start if absent in localStorage.
- Persists across page refreshes and browser restarts.
- Lost only if user clears browser storage.

---

### 3. IdeaScore (In-memory — API response)

Transient object returned by `/api/score-idea`. Populated from Claude's Tool Use response. Not stored independently; its fields are mapped directly to `GameScore` columns before insertion.

| Field | Type | Notes |
|-------|------|-------|
| `originality` | `number` (0–33) | From Claude tool call |
| `practicality` | `number` (0–33) | From Claude tool call |
| `unexpectedness` | `number` (0–34) | From Claude tool call |
| `comment` | `string` | Japanese feedback text |
| `totalScore` | `number` | Computed: sum of three axes |

---

## SQL DDL

```sql
-- Migration: 001_game_scores.sql
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

create policy "Anyone can insert game scores"
  on public.game_scores for insert
  with check (true);

create policy "Anyone can read game scores"
  on public.game_scores for select
  using (true);
-- No UPDATE or DELETE policies → blocked for all anon users

-- Indexes
create index idx_game_scores_session_played
  on public.game_scores (session_id, played_at desc);

create index idx_game_scores_total_score
  on public.game_scores (total_score desc, played_at desc);

create index idx_game_scores_played_at
  on public.game_scores (played_at desc);
```

---

## Relationships

```
Browser (localStorage)
  └── session_id (UUID) ─────────────────────────┐
                                                   │
Supabase: game_scores                              │
  id ← auto                                        │
  session_id ← ─────────────────────────── matches┘
  topic ← from /api/generate-topic
  user_idea ← from user input
  score_* ← from /api/score-idea (Claude)
  total_score ← computed server-side
  ai_comment ← from /api/score-idea (Claude)
  played_at ← server timestamp
```

---

## Query Patterns

### Personal best (for this session)
```sql
select * from game_scores
where session_id = $1
order by total_score desc
limit 1;
-- Uses: idx_game_scores_session_played
```

### Recent 10 games (for this session)
```sql
select * from game_scores
where session_id = $1
order by played_at desc
limit 10;
-- Uses: idx_game_scores_session_played
```

### Count games played (for this session)
```sql
select count(*) from game_scores
where session_id = $1;
-- Uses: idx_game_scores_session_played
```
