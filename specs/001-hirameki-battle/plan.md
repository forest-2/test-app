# Implementation Plan: 閃き対決（ひらめきバトル）

**Branch**: `001-hirameki-battle` | **Date**: 2026-02-27 | **Spec**: [spec.md](./spec.md)

## Summary

「閃き対決」はソロ挑戦型アイデアバトルゲームです。Claude AIがランダムなお題を生成し、60秒のカウントダウン中にプレイヤーがアイデアを入力。AIが独創性・実用性・意外性の3軸で採点（合計100点）し、Supabaseにスコアを永続化する。Next.js 15 App Router + Anthropic SDK + Supabase で実装する。

---

## Technical Context

**Language/Version**: TypeScript 5.7, Node.js (Next.js runtime)
**Primary Dependencies**: Next.js 15, `@anthropic-ai/sdk` (new), `@supabase/supabase-js` v2, `@supabase/ssr` v0.5
**Storage**: Supabase PostgreSQL — `game_scores` table (see data-model.md)
**Testing**: Vitest v2 + Testing Library, 80% coverage threshold
**Target Platform**: Web (desktop + mobile browsers)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**:
  - `/api/generate-topic`: <3s p95 (external AI call)
  - `/api/score-idea`: <10s p95 (external AI call; spec SC-003)
  - Page loads: LCP ≤ 2.5s
**Constraints**: No user auth, 500-char input limit, session UUID in localStorage
**Scale/Scope**: Single-user game sessions, anonymous score history per browser

---

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | ✅ Pass | Single-responsibility components; Biome enforced |
| II. Testing Standards | ✅ Pass | Unit tests for scoring logic; integration tests for API routes and timer flow |
| III. UX Consistency | ✅ Pass | Loading, error, empty states required for all interactive elements |
| IV. Performance Requirements | ⚠️ Justified exception | AI API routes exceed 200ms p95; see Complexity Tracking |

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| `/api/generate-topic` and `/api/score-idea` respond in 2–8s (exceeds 200ms p95 constitution target) | Claude AI inference is the core product feature; latency is inherent to LLM API calls | Caching topics degrades gameplay (same お題 repeats); pre-generating scores server-side is not possible without player input |

---

## Project Structure

### Documentation (this feature)

```text
specs/001-hirameki-battle/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 research findings
├── data-model.md        # Entity definitions + SQL DDL
├── quickstart.md        # Developer setup guide
├── contracts/
│   └── api-routes.md    # API contract definitions
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
app/
├── page.tsx                         # Home page — landing + Start button
├── game/
│   └── page.tsx                     # Game page — topic, timer, input
├── result/
│   └── page.tsx                     # Result page — scores, replay
├── history/
│   └── page.tsx                     # History page — score list
└── api/
    ├── generate-topic/
    │   └── route.ts                 # POST: generate AI お題
    ├── score-idea/
    │   └── route.ts                 # POST: score idea + save to DB
    └── scores/
        └── route.ts                 # GET: fetch session score history

components/
├── features/
│   ├── game/
│   │   ├── GameTimer.tsx            # Countdown timer (Client Component)
│   │   ├── IdeaInput.tsx            # Text input + submit button (Client)
│   │   └── TopicDisplay.tsx         # Displays the お題
│   ├── result/
│   │   ├── ScoreBreakdown.tsx       # 3-axis score display
│   │   └── AiComment.tsx            # AI comment display
│   └── history/
│       └── ScoreList.tsx            # Score history list
└── ui/
    └── (existing shared components — reuse before adding new)

lib/
├── anthropic.ts                     # Anthropic client singleton
├── game-scores.ts                   # Supabase query helpers (insert, fetch)
├── session.ts                       # localStorage session_id helper
└── supabase/                        # (existing)

types/
├── database.ts                      # Add GameScore interface (extend existing)
└── game.ts                          # IdeaScore, TopicResponse, ScoreResponse

supabase/
└── migrations/
    └── 001_game_scores.sql          # game_scores table + RLS + indexes

tests/
├── api/
│   ├── generate-topic.test.ts       # Route handler tests
│   ├── score-idea.test.ts           # Route handler + scoring logic tests
│   └── scores.test.ts               # Score history endpoint tests
├── components/
│   ├── GameTimer.test.tsx           # Timer countdown behavior
│   ├── IdeaInput.test.tsx           # Input validation + submit
│   └── ScoreBreakdown.test.tsx      # Score display
└── lib/
    ├── game-scores.test.ts          # Supabase helpers (mocked)
    └── session.test.ts              # localStorage session ID logic
```

**Structure Decision**: Next.js App Router conventions. Feature components grouped by page (`game/`, `result/`, `history/`). Server-only logic (AI calls, DB writes) confined to `app/api/` routes. Client Components isolated to interactive elements only (timer, input form).

---

## Implementation Phases

### Phase 0: Research ✅ Complete

See [research.md](./research.md) for all findings. Key decisions:
- Tool Use pattern for structured Claude scoring output
- Non-streaming AI calls
- `game_scores` table with session UUID (localStorage)
- Score saved server-side in `/api/score-idea`

---

### Phase 1: Infrastructure

**Goal:** Database, environment, and AI client ready; no game UI yet.

**Deliverables:**
1. `bun add @anthropic-ai/sdk` — add to dependencies
2. `.env.example` updated with `ANTHROPIC_API_KEY`
3. `lib/anthropic.ts` — Anthropic client singleton
4. `lib/session.ts` — localStorage session ID helper
5. `supabase/migrations/001_game_scores.sql` — DDL + RLS + indexes
6. `types/game.ts` — TypeScript interfaces
7. `types/database.ts` — `GameScore` interface added
8. `lib/game-scores.ts` — Supabase query helpers

**Tests:** Unit tests for `session.ts` (localStorage logic); `game-scores.ts` (mocked Supabase).

---

### Phase 2: API Routes

**Goal:** Three Route Handlers functional and tested.

**Deliverables:**
1. `app/api/generate-topic/route.ts` — POST, calls Claude, returns topic
2. `app/api/score-idea/route.ts` — POST, calls Claude (Tool Use), saves to DB, returns scores
3. `app/api/scores/route.ts` — GET, queries Supabase by session_id

**Tests:** Route handler tests with mocked Anthropic SDK and Supabase client.

---

### Phase 3: Game UI (P1 — Core Game Loop)

**Goal:** Complete game cycle playable end-to-end (P1 user story).

**Deliverables:**
1. `components/features/game/GameTimer.tsx` — 60s countdown, `onExpire` callback
2. `components/features/game/IdeaInput.tsx` — textarea (max 500 chars), submit button
3. `components/features/game/TopicDisplay.tsx` — displays generated お題
4. `app/game/page.tsx` — orchestrates topic fetch, timer, input, submit flow
5. `components/features/result/ScoreBreakdown.tsx` — shows 3-axis scores
6. `components/features/result/AiComment.tsx` — displays AI comment
7. `app/result/page.tsx` — reads result from sessionStorage, displays scores
8. `app/page.tsx` — landing page with Start button
9. Loading, error, and timeout states for all interactive elements

**Tests:** Timer component (countdown, expire, pause on submit); input validation; score display.

---

### Phase 4: History & Replay (P2 + P3)

**Goal:** Score persistence visible to user; replay flow.

**Deliverables:**
1. `components/features/history/ScoreList.tsx` — score history list
2. `app/history/page.tsx` — fetches and displays session score history
3. "もう一度" button on result page → clears sessionStorage, navigates to game
4. Personal best highlight in history view

**Tests:** ScoreList renders correctly (empty, single, multiple); navigation from result → game.

---

### Phase 5: Polish

**Goal:** UI consistency, error resilience, performance verification.

**Deliverables:**
1. Unified loading skeleton for AI call wait states
2. Error boundary on game and result pages
3. Character counter on IdeaInput (shows 0/500)
4. Verify LCP ≤ 2.5s on game and result pages (Lighthouse)
5. Verify AI route p95 within spec targets (manual test 10 samples)
6. Biome lint + format pass on all new files

---

## Key Design Decisions

### Score Saving: Server-Side Only

Claude scoring and Supabase insertion both happen inside `/api/score-idea`. The client never writes directly to Supabase. This prevents score tampering.

### Session Identity

`crypto.randomUUID()` persisted in `localStorage["game_session_id"]`. Generated on first game start. Sent in request body to `/api/score-idea`. The API route does not validate session ownership (public leaderboard; no privacy concern).

### Game State Between Pages

`sessionStorage` stores the most recent result object (topic, scores, comment) when navigating from game → result. This avoids URL length constraints from long AI comments.

### Timer Expiry Flow

When `GameTimer` calls `onExpire()`:
1. Textarea becomes disabled
2. Submit button becomes disabled
3. "時間切れ！" overlay shown
4. "もう一度" button offered to restart

If user submits before timer expires, timer pauses immediately (cannot re-submit).
