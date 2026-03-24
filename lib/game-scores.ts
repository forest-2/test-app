import { createClient } from "@/lib/supabase/server";
import type { GameScore } from "@/types/database";

export interface InsertGameScorePayload {
  sessionId: string;
  topic: string;
  userIdea: string;
  scoreOriginality: number;
  scorePracticality: number;
  scoreUnexpectedness: number;
  totalScore: number;
  aiComment: string | null;
}

export async function insertGameScore(payload: InsertGameScorePayload): Promise<GameScore> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("game_scores")
    .insert({
      session_id: payload.sessionId,
      topic: payload.topic,
      user_idea: payload.userIdea,
      score_originality: payload.scoreOriginality,
      score_practicality: payload.scorePracticality,
      score_unexpectedness: payload.scoreUnexpectedness,
      total_score: payload.totalScore,
      ai_comment: payload.aiComment,
    })
    .select()
    .single();

  if (error) throw error;
  return data as GameScore;
}

export async function getRecentScores(sessionId: string, limit = 10): Promise<GameScore[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("game_scores")
    .select("*")
    .eq("session_id", sessionId)
    .order("played_at", { ascending: false })
    .limit(Math.min(limit, 100));

  if (error) throw error;
  return (data ?? []) as GameScore[];
}

export async function getPersonalBest(sessionId: string): Promise<number | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("game_scores")
    .select("total_score")
    .eq("session_id", sessionId)
    .order("total_score", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // no rows
    throw error;
  }
  return data?.total_score ?? null;
}

export async function getGamesPlayed(sessionId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("game_scores")
    .select("*", { count: "exact", head: true })
    .eq("session_id", sessionId);

  if (error) throw error;
  return count ?? 0;
}
