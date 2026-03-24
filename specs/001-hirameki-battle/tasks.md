# Tasks: 閃き対決（ひらめきバトル）

**Input**: Design documents from `specs/001-hirameki-battle/`
**Branch**: `001-hirameki-battle`
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

**Tests**: Included — required by project constitution (Principle II: Testing Standards).

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1 / US2 / US3 — maps to user stories from spec.md
- Exact file paths included in all task descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project dependencies, environment configuration, database schema, and shared type definitions. No game logic yet.

- [x] T001 Install @anthropic-ai/sdk via `bun add @anthropic-ai/sdk` and verify package.json updated
- [x] T002 [P] Add `ANTHROPIC_API_KEY=sk-ant-...` entry to `.env.example` with comment "server-only, never expose to browser"
- [x] T003 [P] Create `lib/anthropic.ts` — Anthropic client singleton (server-only import guard, `new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })`)
- [x] T004 [P] Create `lib/session.ts` — `getSessionId()` helper using `crypto.randomUUID()` persisted in `localStorage["game_session_id"]`
- [x] T005 [P] Create `types/game.ts` — interfaces: `IdeaScore`, `TopicResponse`, `ScoreResponse`, `GameResult`, `ScoreHistoryResponse`
- [x] T006 [P] Add `GameScore` interface to `types/database.ts` (fields: id, session_id, topic, user_idea, score_originality, score_practicality, score_unexpectedness, total_score, ai_comment, played_at)
- [x] T007 Create `supabase/migrations/001_game_scores.sql` — `game_scores` table DDL with CHECK constraints, RLS policies (INSERT + SELECT for anon), and three indexes (session_id+played_at, total_score+played_at, played_at)

**Checkpoint**: `bun run type-check` passes; migration file is valid SQL; `.env.example` documents all required vars.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Supabase query helpers and their unit tests. MUST complete before any user story implementation.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T008 Create `lib/game-scores.ts` — Supabase helpers: `insertGameScore(payload)`, `getRecentScores(sessionId, limit)`, `getPersonalBest(sessionId)`, `getGamesPlayed(sessionId)`
- [x] T009 [P] Create `tests/lib/session.test.ts` — unit tests: generates UUID on first call, returns same UUID on subsequent calls, generates new UUID after localStorage cleared
- [x] T010 [P] Create `tests/lib/game-scores.test.ts` — unit tests with mocked Supabase: insertGameScore inserts correct fields, getRecentScores returns newest-first ordered results, getPersonalBest returns highest total_score

**Checkpoint**: `bun run test:ci` passes for Phase 1–2 tests; `lib/game-scores.ts` and `lib/session.ts` have ≥ 80% coverage.

---

## Phase 3: User Story 1 - ゲームをプレイする (Priority: P1) 🎯 MVP

**Goal**: Complete game cycle end-to-end — Home → お題生成 → 60秒タイマー → アイデア入力 → 送信 → AI採点 → スコア表示。

**Independent Test**: `GET /` → press Start → お題 appears → enter any text → submit → see 3-axis scores and AI comment on result page. No history or replay needed.

### API Routes for User Story 1

- [x] T011 [P] [US1] Create `app/api/generate-topic/route.ts` — POST handler: calls `anthropic.messages.create` with claude-sonnet-4-6, returns `{ topic: string }`; handles RateLimitError (429), APIConnectionError (503), unexpected errors (500) with Japanese error messages
- [x] T012 [P] [US1] Create `app/api/score-idea/route.ts` — POST handler: validates `{ sessionId, topic, idea }` (idea 1–500 chars required), calls Claude with Tool Use `submit_score` schema, saves result via `insertGameScore`, returns `ScoreResponse`; returns 503 with input-preserving error on Claude failure (no DB write on error)

### Tests for User Story 1 API

- [x] T013 [US1] Create `tests/api/generate-topic.test.ts` — mocked Anthropic SDK: returns topic on success, returns 503 on connection error, returns 429 on rate limit
- [x] T014 [US1] Create `tests/api/score-idea.test.ts` — mocked Anthropic SDK + Supabase: returns scores on success, rejects empty idea (400), rejects idea >500 chars (400), returns 503 without DB insert on Claude error

### UI Components for User Story 1

- [x] T015 [P] [US1] Create `components/features/game/GameTimer.tsx` — Client Component: 60s countdown display, accepts `onExpire()` and `onTick(remaining: number)` props; pauses when `isPaused` prop is true; shows "時間切れ！" at 0
- [x] T016 [P] [US1] Create `components/features/game/IdeaInput.tsx` — Client Component: `<textarea>` maxLength=500, submit `<button>` disabled when empty or `isSubmitting`; calls `onSubmit(idea: string)` prop; blocks submit after timeout
- [x] T017 [P] [US1] Create `components/features/game/TopicDisplay.tsx` — renders お題 text with skeleton loading state while `isLoading` prop is true
- [x] T018 [US1] Create `app/game/page.tsx` — Client Component orchestration: fetches topic from `/api/generate-topic` on mount, starts timer, handles submit (calls `/api/score-idea`, pauses timer, writes result to `sessionStorage["game_result"]`, navigates to `/result`), handles topic fetch error (retry UI), handles timer expiry (disables input)
- [x] T019 [P] [US1] Create `components/features/result/ScoreBreakdown.tsx` — displays独創性/実用性/意外性 individual scores and total out of 100 with labeled bars or numbers
- [x] T020 [P] [US1] Create `components/features/result/AiComment.tsx` — renders AI comment text with styled quote presentation
- [x] T021 [US1] Create `app/result/page.tsx` — reads `GameResult` from `sessionStorage["game_result"]`, renders `ScoreBreakdown` + `AiComment`; shows error state if no result found in sessionStorage
- [x] T022 [US1] Update `app/page.tsx` — add prominent "スタート" button that navigates to `/game`; keep existing layout/styling conventions

### Tests for User Story 1 UI

- [x] T023 [P] [US1] Create `tests/components/GameTimer.test.tsx` — counts down from 60, calls `onExpire` at 0, pauses when `isPaused=true`, shows "時間切れ！" text at expiry
- [x] T024 [P] [US1] Create `tests/components/IdeaInput.test.tsx` — submit button disabled when empty, accepts text up to 500 chars, rejects 501st character, calls `onSubmit` with trimmed value

**Checkpoint**: Full game cycle works end-to-end locally. Start → お題表示 → 入力 → 採点 → スコア表示. `bun run test:ci` passes for all US1 tests.

---

## Phase 4: User Story 2 - ハイスコアを記録・確認する (Priority: P2)

**Goal**: Score persistence (via `/api/score-idea` already in T012) surfaced in a history view. Personal best highlighted.

**Independent Test**: Play 2 games → open `/history` → see both games listed newest-first with topic, total score, date. Highest score shows personal best badge.

### API Route for User Story 2

- [x] T025 [P] [US2] Create `app/api/scores/route.ts` — GET handler: reads `sessionId` query param (required), calls `getRecentScores`, `getPersonalBest`, `getGamesPlayed`, returns `ScoreHistoryResponse { scores, personalBest, gamesPlayed }`; returns 400 on missing sessionId

### Test for User Story 2 API

- [x] T026 [US2] Create `tests/api/scores.test.ts` — mocked Supabase: returns scores array with personalBest and gamesPlayed on success, returns 400 when sessionId missing, returns empty scores array for new session

### UI for User Story 2

- [x] T027 [P] [US2] Create `components/features/history/ScoreList.tsx` — renders list of `GameScore` entries (topic, total_score, played_at formatted as日本語 date); highlights personal best with badge; empty state "まだ記録がありません"
- [x] T028 [US2] Create `app/history/page.tsx` — reads `sessionId` via `getSessionId()`, fetches `/api/scores?sessionId=...`, renders `ScoreList` with loading skeleton and error state; link back to home
- [x] T029 [US2] Create `tests/components/ScoreList.test.tsx` — renders empty state when no scores, renders score list with correct topic and score values, highlights highest score as personal best

**Checkpoint**: Play games, navigate to `/history`, see all games with correct scores. Personal best highlighted. `bun run test:ci` passes for all US2 tests.

---

## Phase 5: User Story 3 - 結果画面からリプレイする (Priority: P3)

**Goal**: "もう一度" button on result page starts a new game instantly with a fresh topic.

**Independent Test**: On result page → press "もう一度" → navigate to `/game` → new topic appears (different from last game) → timer restarted from 60.

- [x] T030 [US3] Add "もう一度" button to `app/result/page.tsx` — on click: clears `sessionStorage["game_result"]`, calls `router.push("/game")`; verify navigates to fresh game state (topic re-fetched, timer reset)
- [x] T031 [P] [US3] Add "スコアを見る" link to `app/result/page.tsx` — navigates to `/history`; styled as secondary action below "もう一度" button

**Checkpoint**: After viewing result, pressing "もう一度" loads a new お題 within 3 seconds. `bun run test:ci` still passes.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Error resilience, UX completeness, lint/format, performance verification.

- [ ] T032 [P] Add topic-fetch loading skeleton to `app/game/page.tsx` — show `TopicDisplay` in loading state during the AI call; prevent timer start until topic is received
- [ ] T033 [P] Add retry UI to `app/game/page.tsx` on `/api/score-idea` error — display Japanese error message, keep textarea content, show "再試行" button that re-submits without resetting timer
- [ ] T034 [P] Add character counter (現在の文字数/500) below textarea in `components/features/game/IdeaInput.tsx` — updates on every keystroke; turns red when ≥ 450 chars
- [ ] T035 [P] Add topic-generation error state to `app/game/page.tsx` — if `/api/generate-topic` fails, show "お題の取得に失敗しました" with "リトライ" button; do not start timer on error
- [ ] T036 [P] Add "タイムアップ" overlay to `app/game/page.tsx` — triggered by `GameTimer.onExpire`; overlay disables input, shows elapsed time, offers "もう一度" button to restart
- [ ] T037 Run `bunx biome check --apply .` across all new files and fix all lint/format issues
- [ ] T038 [P] Run `bun run build` and confirm zero TypeScript errors and successful production build
- [ ] T039 Run `bun run test:ci` and confirm overall test coverage ≥ 80% for all new modules (`lib/`, `app/api/`, `components/features/`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately; all T001–T007 can run in parallel after T001 completes
- **Foundational (Phase 2)**: Requires Phase 1 complete — T008 requires `types/game.ts` (T005) and `types/database.ts` (T006); T009–T010 require T004 and T008
- **User Story 1 (Phase 3)**: Requires Phase 2 complete — T011 requires `lib/anthropic.ts` (T003); T012 requires T003 + T008; UI tasks require type definitions
- **User Story 2 (Phase 4)**: Requires Phase 2 complete; score persistence already wired in T012
- **User Story 3 (Phase 5)**: Requires Phase 3 complete (result page must exist)
- **Polish (Phase 6)**: Requires desired user stories complete

### User Story Dependencies

- **US1 (P1)**: Unblocked after Phase 2 — no dependency on US2 or US3
- **US2 (P2)**: Unblocked after Phase 2 — no dependency on US1 (history page reads from DB independently); however, score *writing* was implemented in T012 (US1), so US1 should be complete first for end-to-end smoke test
- **US3 (P3)**: Requires US1 complete (result page must exist for "もう一度" button)

### Within Each User Story

- API routes before UI pages (pages depend on route contracts)
- Types and models before services and routes
- Component tests can be written in parallel with component implementation

---

## Parallel Opportunities

### Phase 1 (after T001 completes)

```
T002  Add ANTHROPIC_API_KEY to .env.example
T003  Create lib/anthropic.ts
T004  Create lib/session.ts
T005  Create types/game.ts
T006  Update types/database.ts
T007  Create supabase migration SQL
```

### Phase 3 — US1 API routes (after Phase 2)

```
T011  Create app/api/generate-topic/route.ts
T012  Create app/api/score-idea/route.ts
```

### Phase 3 — US1 UI components (after T005 types exist)

```
T015  Create GameTimer.tsx
T016  Create IdeaInput.tsx
T017  Create TopicDisplay.tsx
T019  Create ScoreBreakdown.tsx
T020  Create AiComment.tsx
```

### Phase 3 — US1 tests (can write alongside implementations)

```
T013  tests/api/generate-topic.test.ts
T014  tests/api/score-idea.test.ts
T023  tests/components/GameTimer.test.tsx
T024  tests/components/IdeaInput.test.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T007)
2. Complete Phase 2: Foundational (T008–T010)
3. Complete Phase 3: User Story 1 (T011–T024)
4. **STOP and VALIDATE**: Full game cycle Home → Game → Result works end-to-end
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → shared infrastructure ready
2. User Story 1 → **MVP**: playable game with AI scoring
3. User Story 2 → score history and personal best
4. User Story 3 → replay flow from result page
5. Polish → production-ready quality

---

## Notes

- `[P]` tasks can be parallelized — they touch different files with no blocking dependencies
- `[US1/2/3]` labels map tasks to spec user stories for traceability
- Constitution requires tests written before or alongside implementation (Red → Green → Refactor)
- Each phase checkpoint should pass `bun run test:ci` before proceeding
- Commit after each phase checkpoint, not after individual tasks
- Score saving is **server-side only** (T012) — never trust client-calculated scores
- `ANTHROPIC_API_KEY` must never be prefixed with `NEXT_PUBLIC_`
