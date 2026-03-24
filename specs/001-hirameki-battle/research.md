# Research: 閃き対決

**Branch**: `001-hirameki-battle` | **Date**: 2026-02-27

---

## 1. Claude API Integration in Next.js 15

### Decision: Tool Use Pattern (Structured JSON) + Non-Streaming

**Rationale:**
Scoring requires a complete, structured response (3 integer scores + string comment) before anything can be displayed. Streaming provides no UX benefit here — the user sees a loading state until all scores arrive simultaneously.

Tool Use enforces a JSON schema at the model level, eliminating the need for fragile JSON parsing of free-text responses.

**Key choices:**

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Model | `claude-sonnet-4-6` | Latest model, best structured-output reliability |
| Streaming | No | Scores must arrive complete; streaming adds complexity with no UX gain |
| JSON Output | Tool Use (`submit_score` tool) | Schema enforced by Claude, not manual parsing |
| Client | Singleton in `lib/anthropic.ts` | Avoid re-creating client per request |
| API Routes | Server-side only (`app/api/`) | API key must never reach the browser |

**Topic generation prompt pattern:**
```
Generate a random Japanese creative challenge topic in the format: "○○の新しい使い方"
Return ONLY the topic text, nothing else.
```

**Scoring tool schema:**
```json
{
  "name": "submit_score",
  "input_schema": {
    "type": "object",
    "properties": {
      "originality":     { "type": "integer", "minimum": 0, "maximum": 33 },
      "practicality":    { "type": "integer", "minimum": 0, "maximum": 33 },
      "unexpectedness":  { "type": "integer", "minimum": 0, "maximum": 34 },
      "comment":         { "type": "string" }
    },
    "required": ["originality", "practicality", "unexpectedness", "comment"]
  }
}
```

**Error handling strategy:** Catch `RateLimitError`, `APIConnectionError`, `APIStatusError` separately. Return user-friendly Japanese error messages with HTTP status codes.

**Alternatives considered:**
- Free-text JSON prompt → Rejected: brittle, requires manual parsing + validation
- Streaming → Rejected: no UX benefit for complete-score display
- GPT-4o → Rejected: project already uses Claude API; consistency

---

## 2. Anonymous Score Storage in Supabase

### Decision: Session ID (localStorage) + `game_scores` table, no Supabase Auth

**Rationale:**
Anonymous Supabase Auth adds JWT refresh complexity and extra HTTP calls. For a game where scores are per-browser-session, `crypto.randomUUID()` persisted in localStorage is sufficient and simpler.

Score saving happens **server-side** in the `/api/score-idea` route to prevent client-side tampering.

**Schema:**
```sql
create table public.game_scores (
  id                   bigserial primary key,
  session_id           uuid not null,
  topic                text not null,
  user_idea            text not null check (char_length(user_idea) <= 500),
  score_originality    int  not null check (score_originality    between 0 and 33),
  score_practicality   int  not null check (score_practicality   between 0 and 33),
  score_unexpectedness int  not null check (score_unexpectedness between 0 and 34),
  total_score          int  not null check (total_score          between 0 and 100),
  ai_comment           text,
  played_at            timestamptz not null default now()
);
```

**RLS policies:** INSERT and SELECT allowed for all (anon key). UPDATE and DELETE omitted → blocked automatically.

**Performance:** Three indexes cover the three query patterns (personal best, recent games, session history).

**Alternatives considered:**
- Supabase Anonymous Auth → Rejected: added complexity for no benefit at MVP
- Client-side score saving → Rejected: scores can be tampered; server-side save via API route is safer
- No persistence → Rejected: spec requires FR-007 and HS display

---

## 3. React Timer Pattern (Client Component)

### Decision: `useEffect` countdown in a dedicated `GameTimer` Client Component

**Rationale:**
The countdown timer is purely client-side (requires `setInterval`). Isolate it in a Client Component to keep the game page mostly server-rendered. The parent game page passes `onExpire` callback.

```tsx
"use client"
// components/features/game/GameTimer.tsx
// Uses useEffect + setInterval for 60s countdown
// Calls onExpire() when reaches 0
// Calls onTick(remaining) to update display
```

**Alternatives considered:**
- `setTimeout` loop → Rejected: `setInterval` more accurate for countdown display
- Server-side timer → Not possible (browser-only)

---

## 4. Game State Management

### Decision: URL-based navigation between pages (no global state store)

**Rationale:**
The game has 4 distinct screens (Home → Game → Result → History). Using Next.js routes with `router.push()` and URL search params (for passing scores between game and result) is simpler than adding a global state store.

Score data passed from game to result via URL query params (total_score, breakdown, topic encoded as params) or via a temporary client store (`sessionStorage`).

**Decision:** Use `sessionStorage` to pass the full result object from game page to result page (avoids URL length issues with AI comment text).

**Alternatives considered:**
- React Context / Zustand → Rejected: over-engineering for a linear game flow
- URL params only → Rejected: AI comment text can be long (URL encoding issues)

---

## 5. New Dependency Required

**Package:** `@anthropic-ai/sdk`

Must be added to `dependencies` in `package.json`:
```bash
bun add @anthropic-ai/sdk
```

**Environment variable to add:**
```
ANTHROPIC_API_KEY=sk-ant-...
```
Add to `.env.example` and document in README.

---

## Summary of Key Decisions

| Topic | Decision |
|-------|----------|
| AI client | `@anthropic-ai/sdk`, singleton in `lib/anthropic.ts` |
| AI calls | Server-side API routes only |
| Scoring output | Tool Use pattern (schema-enforced JSON) |
| Streaming | No |
| Score storage | Supabase `game_scores` table |
| Auth | None — session UUID in localStorage |
| Score save timing | Server-side in `/api/score-idea` route |
| Game state | `sessionStorage` between pages |
| Timer | Client Component (`GameTimer.tsx`) |
