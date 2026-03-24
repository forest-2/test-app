import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const SESSION_KEY = "game_session_id";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

beforeEach(() => {
  vi.stubGlobal("localStorage", localStorageMock);
  localStorageMock.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getSessionId", () => {
  it("generates a UUID on first call", async () => {
    const { getSessionId } = await import("@/lib/session");
    const id = getSessionId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it("returns the same UUID on subsequent calls", async () => {
    const { getSessionId } = await import("@/lib/session");
    const first = getSessionId();
    const second = getSessionId();
    expect(first).toBe(second);
  });

  it("generates a new UUID after localStorage is cleared", async () => {
    const { getSessionId } = await import("@/lib/session");
    const first = getSessionId();
    localStorageMock.removeItem(SESSION_KEY);
    const second = getSessionId();
    expect(second).not.toBe(first);
    expect(second).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("persists the UUID in localStorage", async () => {
    const { getSessionId } = await import("@/lib/session");
    const id = getSessionId();
    expect(localStorageMock.getItem(SESSION_KEY)).toBe(id);
  });
});
