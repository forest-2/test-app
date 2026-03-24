import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreate, mockInsertGameScore } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockInsertGameScore: vi.fn(),
}));

vi.mock("@/lib/openai", () => ({
  getOpenAIClient: () => ({ chat: { completions: { create: mockCreate } } }),
}));

vi.mock("@/lib/game-scores", () => ({
  insertGameScore: mockInsertGameScore,
}));

import { POST } from "@/app/api/score-idea/route";
import OpenAI from "openai";

const makeRequest = (body: object) =>
  new NextRequest("http://localhost/api/score-idea", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

const validBody = {
  sessionId: "550e8400-e29b-41d4-a716-446655440000",
  topic: "傘の新しい使い方",
  idea: "水耕栽培の支柱として使う",
};

const mockScoreResponse = {
  choices: [
    {
      message: {
        tool_calls: [
          {
            type: "function",
            function: {
              name: "submit_score",
              arguments: JSON.stringify({
                originality: 28,
                practicality: 25,
                unexpectedness: 20,
                comment: "面白いアイデアです",
              }),
            },
          },
        ],
      },
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockInsertGameScore.mockResolvedValue({ id: 42 });
});

describe("POST /api/score-idea", () => {
  it("returns scores on success", async () => {
    mockCreate.mockResolvedValue(mockScoreResponse);

    const res = await POST(makeRequest(validBody));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.scoreId).toBe(42);
    expect(body.originality).toBe(28);
    expect(body.practicality).toBe(25);
    expect(body.unexpectedness).toBe(20);
    expect(body.totalScore).toBe(73);
    expect(body.comment).toBe("面白いアイデアです");
  });

  it("returns 400 when idea is empty", async () => {
    const res = await POST(makeRequest({ ...validBody, idea: "" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("入力してください");
  });

  it("returns 400 when idea exceeds 500 chars", async () => {
    const res = await POST(makeRequest({ ...validBody, idea: "a".repeat(501) }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("500文字以内");
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await POST(makeRequest({ idea: "test" }));
    expect(res.status).toBe(400);
  });

  it("returns 503 without DB insert on OpenAI connection error", async () => {
    mockCreate.mockRejectedValue(new OpenAI.APIConnectionError({ message: "connection error" }));

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(503);
    expect(mockInsertGameScore).not.toHaveBeenCalled();
  });
});
