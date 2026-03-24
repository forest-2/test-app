import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetRecentScores, mockGetPersonalBest, mockGetGamesPlayed } = vi.hoisted(() => ({
  mockGetRecentScores: vi.fn(),
  mockGetPersonalBest: vi.fn(),
  mockGetGamesPlayed: vi.fn(),
}));

vi.mock("@/lib/game-scores", () => ({
  getRecentScores: mockGetRecentScores,
  getPersonalBest: mockGetPersonalBest,
  getGamesPlayed: mockGetGamesPlayed,
}));

import { GET } from "@/app/api/scores/route";

const SESSION_ID = "550e8400-e29b-41d4-a716-446655440000";

const makeRequest = (params?: Record<string, string>) => {
  const url = new URL("http://localhost/api/scores");
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }
  return new NextRequest(url);
};

const sampleScore = {
  id: 1,
  session_id: SESSION_ID,
  topic: "傘の新しい使い方",
  user_idea: "水耕栽培",
  score_originality: 28,
  score_practicality: 25,
  score_unexpectedness: 20,
  total_score: 73,
  ai_comment: "面白いです",
  played_at: "2026-02-27T00:00:00Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetRecentScores.mockResolvedValue([sampleScore]);
  mockGetPersonalBest.mockResolvedValue(73);
  mockGetGamesPlayed.mockResolvedValue(1);
});

describe("GET /api/scores", () => {
  it("returns scores with personalBest and gamesPlayed on success", async () => {
    const res = await GET(makeRequest({ sessionId: SESSION_ID }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.scores).toHaveLength(1);
    expect(body.scores[0].totalScore).toBe(73);
    expect(body.personalBest).toBe(73);
    expect(body.gamesPlayed).toBe(1);
  });

  it("returns 400 when sessionId is missing", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("sessionId");
  });

  it("returns empty scores array for new session", async () => {
    mockGetRecentScores.mockResolvedValue([]);
    mockGetPersonalBest.mockResolvedValue(null);
    mockGetGamesPlayed.mockResolvedValue(0);

    const res = await GET(makeRequest({ sessionId: SESSION_ID }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.scores).toHaveLength(0);
    expect(body.personalBest).toBeNull();
    expect(body.gamesPlayed).toBe(0);
  });
});
