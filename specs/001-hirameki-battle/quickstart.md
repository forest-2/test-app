# Quickstart: 閃き対決

**Branch**: `001-hirameki-battle`

## Prerequisites

- Bun installed
- Supabase project (free tier works)
- Anthropic API key ([console.anthropic.com](https://console.anthropic.com))

## Setup

### 1. Install dependencies

```bash
bun install
```

The `@anthropic-ai/sdk` package is required and listed in `dependencies`.

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
# Supabase (existing)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Anthropic (new — server-only, never expose to browser)
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Run database migration

In Supabase Dashboard → SQL Editor, run:

```sql
-- paste contents of supabase/migrations/001_game_scores.sql
```

Or if using Supabase CLI:

```bash
supabase db push
```

### 4. Start dev server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) and press Start to play.

## Verify Setup

- **Topic generation**: Press Start; お題 should appear within 3 seconds.
- **Scoring**: Enter an idea and submit; score should appear within 10 seconds.
- **History**: After playing, check `/history` to see saved scores.

## Run Tests

```bash
bun run test:ci
```

## Lint + Format

```bash
bunx biome check --apply .
```
