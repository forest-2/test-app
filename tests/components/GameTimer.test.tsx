import { GameTimer } from "@/components/features/game/GameTimer";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe("GameTimer", () => {
  it("displays initial countdown", () => {
    render(<GameTimer isPaused={false} onExpire={() => {}} onTick={() => {}} />);
    expect(screen.getByText("60秒")).toBeDefined();
  });

  it("counts down over time", () => {
    render(<GameTimer isPaused={false} onExpire={() => {}} onTick={() => {}} />);
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText("57秒")).toBeDefined();
  });

  it("calls onExpire when reaching 0", () => {
    const onExpire = vi.fn();
    render(<GameTimer isPaused={false} onExpire={onExpire} onTick={() => {}} />);
    act(() => {
      vi.advanceTimersByTime(60000);
    });
    expect(onExpire).toHaveBeenCalledOnce();
  });

  it("shows 時間切れ！ text at expiry", () => {
    render(<GameTimer isPaused={false} onExpire={() => {}} onTick={() => {}} />);
    act(() => {
      vi.advanceTimersByTime(60000);
    });
    expect(screen.getByText("時間切れ！")).toBeDefined();
  });

  it("pauses when isPaused is true", () => {
    render(<GameTimer isPaused={true} onExpire={() => {}} onTick={() => {}} />);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText("60秒")).toBeDefined();
  });
});
