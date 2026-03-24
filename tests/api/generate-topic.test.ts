import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }));

vi.mock("@/lib/openai", () => ({
  getOpenAIClient: () => ({ chat: { completions: { create: mockCreate } } }),
}));

vi.mock("openai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("openai")>();
  return {
    ...actual,
    default: {
      ...actual.default,
      APIConnectionError: class APIConnectionError extends Error {
        constructor() {
          super("connection error");
        }
      },
      RateLimitError: class RateLimitError extends Error {
        constructor() {
          super("rate limit");
        }
      },
    },
  };
});

import { POST } from "@/app/api/generate-topic/route";
import OpenAI from "openai";

const makeRequest = () =>
  new NextRequest("http://localhost/api/generate-topic", { method: "POST" });

beforeEach(() => vi.clearAllMocks());

describe("POST /api/generate-topic", () => {
  it("returns a topic on success", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "  傘の新しい使い方  " } }],
    });

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.topic).toBe("傘の新しい使い方");
  });

  it("returns 503 on connection error", async () => {
    mockCreate.mockRejectedValue(new OpenAI.APIConnectionError({ message: "connection error" }));

    const res = await POST(makeRequest());
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toContain("一時的に利用できません");
  });

  it("returns 429 on rate limit", async () => {
    mockCreate.mockRejectedValue(
      new OpenAI.RateLimitError(429, undefined, "rate limit", undefined),
    );

    const res = await POST(makeRequest());
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.retryAfter).toBe(60);
  });
});
