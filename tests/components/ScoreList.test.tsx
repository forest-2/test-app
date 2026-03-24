import { ScoreList } from "@/components/features/history/ScoreList";
import type { ScoreHistoryItem } from "@/types/game";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

const makeScore = (overrides: Partial<ScoreHistoryItem> = {}): ScoreHistoryItem => ({
  id: 1,
  topic: "傘の新しい使い方",
  totalScore: 73,
  originality: 28,
  practicality: 25,
  unexpectedness: 20,
  comment: "面白いです",
  playedAt: "2026-02-27T10:30:00Z",
  ...overrides,
});

describe("ScoreList", () => {
  it("renders empty state when no scores", () => {
    render(<ScoreList scores={[]} personalBest={null} />);
    expect(screen.getByText("まだ記録がありません")).toBeDefined();
  });

  it("renders score list with correct topic and score values", () => {
    const scores = [makeScore({ totalScore: 73, topic: "傘の新しい使い方" })];
    render(<ScoreList scores={scores} personalBest={73} />);
    expect(screen.getByText("傘の新しい使い方")).toBeDefined();
    expect(screen.getByText("73点")).toBeDefined();
  });

  it("highlights highest score as personal best", () => {
    const scores = [makeScore({ id: 1, totalScore: 73 }), makeScore({ id: 2, totalScore: 50 })];
    render(<ScoreList scores={scores} personalBest={73} />);
    expect(screen.getByText("自己ベスト")).toBeDefined();
  });

  it("does not show personal best badge when scores don't match", () => {
    const scores = [makeScore({ id: 1, totalScore: 50 })];
    render(<ScoreList scores={scores} personalBest={73} />);
    expect(screen.queryByText("自己ベスト")).toBeNull();
  });
});
