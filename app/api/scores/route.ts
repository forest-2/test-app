import { getGamesPlayed, getPersonalBest, getRecentScores } from "@/lib/game-scores";
import type { GameScore } from "@/types/database";
import type { ScoreHistoryItem } from "@/types/game";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  const limitParam = searchParams.get("limit");

  if (!sessionId) {
    return NextResponse.json({ error: "sessionIdは必須です。" }, { status: 400 });
  }

  const limit = limitParam ? Math.min(Number(limitParam), 100) : 10;

  try {
    const [rawScores, personalBest, gamesPlayed] = await Promise.all([
      getRecentScores(sessionId, limit),
      getPersonalBest(sessionId),
      getGamesPlayed(sessionId),
    ]);

    const scores: ScoreHistoryItem[] = rawScores.map((s: GameScore) => ({
      id: s.id,
      topic: s.topic,
      totalScore: s.total_score,
      originality: s.score_originality,
      practicality: s.score_practicality,
      unexpectedness: s.score_unexpectedness,
      comment: s.ai_comment,
      playedAt: s.played_at,
    }));

    return NextResponse.json({ scores, personalBest, gamesPlayed });
  } catch (err) {
    console.error("[scores] Error fetching scores:", err);
    return NextResponse.json({ error: "スコアの取得に失敗しました。" }, { status: 500 });
  }
}
