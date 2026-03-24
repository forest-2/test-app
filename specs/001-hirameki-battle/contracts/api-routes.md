# API Contracts: 閃き対決

**Branch**: `001-hirameki-battle` | **Date**: 2026-02-27

All routes are Next.js Route Handlers under `app/api/`. All requests and responses use `Content-Type: application/json`.

---

## POST /api/generate-topic

Generates a new random creative challenge topic (お題) via Claude AI.

### Request

```
POST /api/generate-topic
Content-Type: application/json
```

Body: empty (`{}`) — no parameters required.

### Response: 200 OK

```json
{
  "topic": "傘の新しい使い方"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `topic` | `string` | お題 in "○○の新しい使い方" format |

### Error Responses

| Status | Body | When |
|--------|------|------|
| `503` | `{ "error": "トピック生成サービスが一時的に利用できません。再試行してください。" }` | Claude API unreachable or timeout |
| `429` | `{ "error": "リクエストが多すぎます。しばらく待ってから再試行してください。", "retryAfter": 60 }` | Claude rate limit hit |
| `500` | `{ "error": "予期しないエラーが発生しました。" }` | Unexpected server error |

---

## POST /api/score-idea

Submits a player's idea for AI judging, persists the result to Supabase, and returns the scores.

### Request

```
POST /api/score-idea
Content-Type: application/json
```

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "topic":     "傘の新しい使い方",
  "idea":      "水耕栽培の支柱として使う"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `sessionId` | `string (UUID)` | Yes | Valid UUID v4 |
| `topic` | `string` | Yes | Non-empty |
| `idea` | `string` | Yes | 1–500 characters |

### Response: 200 OK

```json
{
  "scoreId":        42,
  "originality":    28,
  "practicality":   25,
  "unexpectedness": 20,
  "totalScore":     73,
  "comment":        "実用的で面白いアイデアですが、もう一ひねり欲しいところです。"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `scoreId` | `number` | Supabase row ID of the saved game score |
| `originality` | `number` (0–33) | 独創性スコア |
| `practicality` | `number` (0–33) | 実用性スコア |
| `unexpectedness` | `number` (0–34) | 意外性スコア |
| `totalScore` | `number` (0–100) | 合計スコア |
| `comment` | `string` | AI一言コメント（日本語） |

### Error Responses

| Status | Body | When |
|--------|------|------|
| `400` | `{ "error": "アイデアを入力してください。" }` | `idea` is empty |
| `400` | `{ "error": "アイデアは500文字以内で入力してください。" }` | `idea` exceeds 500 chars |
| `400` | `{ "error": "無効なリクエスト形式です。" }` | Missing required fields |
| `503` | `{ "error": "採点サービスが一時的に利用できません。入力内容は保持されています。" }` | Claude API unreachable |
| `429` | `{ "error": "リクエストが多すぎます。しばらく待ってから再試行してください。", "retryAfter": 60 }` | Rate limit |
| `500` | `{ "error": "採点に失敗しました。再試行してください。" }` | Unexpected error |

**Note:** On error, the score is **not** saved to Supabase. The client should retain the user's input for retry.

---

## GET /api/scores?sessionId={uuid}

Returns the score history for the given session.

### Request

```
GET /api/scores?sessionId=550e8400-e29b-41d4-a716-446655440000
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `sessionId` | `string (UUID)` | Yes | Player's session ID |
| `limit` | `number` | No | Max records to return (default: 10, max: 100) |

### Response: 200 OK

```json
{
  "scores": [
    {
      "id":                  42,
      "topic":               "傘の新しい使い方",
      "totalScore":          73,
      "originality":         28,
      "practicality":        25,
      "unexpectedness":      20,
      "comment":             "実用的で面白いアイデアです。",
      "playedAt":            "2026-02-27T10:30:00Z"
    }
  ],
  "personalBest": 73,
  "gamesPlayed":  5
}
```

| Field | Type | Description |
|-------|------|-------------|
| `scores` | `array` | Recent scores, newest first |
| `personalBest` | `number \| null` | Highest total score in this session |
| `gamesPlayed` | `number` | Total games played in this session |

### Error Responses

| Status | Body | When |
|--------|------|------|
| `400` | `{ "error": "sessionIdは必須です。" }` | `sessionId` param missing |
| `500` | `{ "error": "スコアの取得に失敗しました。" }` | DB error |

---

## Shared Conventions

- All error bodies follow: `{ "error": string, "retryAfter"?: number }`
- `retryAfter` field (seconds) is included only on `429` responses.
- All timestamps are ISO 8601 UTC strings.
- Server-side validation mirrors DB constraints (500-char limit, score ranges).
