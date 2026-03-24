import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreateClient, mockFrom } = vi.hoisted(() => {
  const mockFrom = vi.fn();
  const mockCreateClient = vi.fn();
  return { mockFrom, mockCreateClient };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

import {
  getGamesPlayed,
  getPersonalBest,
  getRecentScores,
  insertGameScore,
} from "@/lib/game-scores";

const SESSION_ID = "550e8400-e29b-41d4-a716-446655440000";

beforeEach(() => {
  vi.clearAllMocks();
  mockCreateClient.mockResolvedValue({ from: mockFrom });
});

describe("insertGameScore", () => {
  it("inserts a game score and returns the created row", async () => {
    const row = {
      id: 1,
      session_id: SESSION_ID,
      topic: "傘の新しい使い方",
      user_idea: "水耕栽培の支柱",
      score_originality: 20,
      score_practicality: 18,
      score_unexpectedness: 15,
      total_score: 53,
      ai_comment: "面白いです",
      played_at: "2026-02-27T00:00:00Z",
    };
    const single = vi.fn().mockResolvedValue({ data: row, error: null });
    const selectChain = vi.fn().mockReturnValue({ single });
    const insertChain = vi.fn().mockReturnValue({ select: selectChain });
    mockFrom.mockReturnValue({ insert: insertChain });

    const result = await insertGameScore({
      sessionId: SESSION_ID,
      topic: "傘の新しい使い方",
      userIdea: "水耕栽培の支柱",
      scoreOriginality: 20,
      scorePracticality: 18,
      scoreUnexpectedness: 15,
      totalScore: 53,
      aiComment: "面白いです",
    });

    expect(result).toEqual(row);
    expect(mockFrom).toHaveBeenCalledWith("game_scores");
  });

  it("throws on Supabase error", async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" } });
    const selectChain = vi.fn().mockReturnValue({ single });
    const insertChain = vi.fn().mockReturnValue({ select: selectChain });
    mockFrom.mockReturnValue({ insert: insertChain });

    await expect(
      insertGameScore({
        sessionId: SESSION_ID,
        topic: "test",
        userIdea: "test",
        scoreOriginality: 10,
        scorePracticality: 10,
        scoreUnexpectedness: 10,
        totalScore: 30,
        aiComment: null,
      }),
    ).rejects.toEqual({ message: "DB error" });
  });
});

describe("getRecentScores", () => {
  it("returns scores in newest-first order", async () => {
    const rows = [
      { id: 2, total_score: 80, played_at: "2026-02-28T00:00:00Z" },
      { id: 1, total_score: 50, played_at: "2026-02-27T00:00:00Z" },
    ];
    const limitChain = vi.fn().mockResolvedValue({ data: rows, error: null });
    const orderChain = vi.fn().mockReturnValue({ limit: limitChain });
    const eqChain = vi.fn().mockReturnValue({ order: orderChain });
    const selectChain = vi.fn().mockReturnValue({ eq: eqChain });
    mockFrom.mockReturnValue({ select: selectChain });

    const result = await getRecentScores(SESSION_ID);
    expect(result).toEqual(rows);
  });
});

describe("getPersonalBest", () => {
  it("returns the highest total_score for the session", async () => {
    const single = vi.fn().mockResolvedValue({ data: { total_score: 95 }, error: null });
    const limitChain = vi.fn().mockReturnValue({ single });
    const orderChain = vi.fn().mockReturnValue({ limit: limitChain });
    const eqChain = vi.fn().mockReturnValue({ order: orderChain });
    const selectChain = vi.fn().mockReturnValue({ eq: eqChain });
    mockFrom.mockReturnValue({ select: selectChain });

    const result = await getPersonalBest(SESSION_ID);
    expect(result).toBe(95);
  });

  it("returns null when no scores exist (PGRST116)", async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } });
    const limitChain = vi.fn().mockReturnValue({ single });
    const orderChain = vi.fn().mockReturnValue({ limit: limitChain });
    const eqChain = vi.fn().mockReturnValue({ order: orderChain });
    const selectChain = vi.fn().mockReturnValue({ eq: eqChain });
    mockFrom.mockReturnValue({ select: selectChain });

    const result = await getPersonalBest(SESSION_ID);
    expect(result).toBeNull();
  });
});

describe("getGamesPlayed", () => {
  it("returns the count of games for the session", async () => {
    const eqChain = vi.fn().mockResolvedValue({ count: 5, error: null });
    const selectChain = vi.fn().mockReturnValue({ eq: eqChain });
    mockFrom.mockReturnValue({ select: selectChain });

    const result = await getGamesPlayed(SESSION_ID);
    expect(result).toBe(5);
  });
});
