"use client";

import { GameTimer } from "@/components/features/game/GameTimer";
import { IdeaInput } from "@/components/features/game/IdeaInput";
import { TopicDisplay } from "@/components/features/game/TopicDisplay";
import { getSessionId } from "@/lib/session";
import type { GameResult, ScoreResponse, TopicResponse } from "@/types/game";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type GamePhase = "loading" | "playing" | "submitting" | "timeout" | "error";

export default function GamePage() {
  const router = useRouter();
  const [phase, setPhase] = useState<GamePhase>("loading");
  const [topic, setTopic] = useState("");
  const [topicError, setTopicError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [lastIdea, setLastIdea] = useState("");
  const timerPaused = phase !== "playing";

  const fetchTopic = useCallback(async () => {
    setPhase("loading");
    setTopicError("");
    try {
      const res = await fetch("/api/generate-topic", { method: "POST" });
      const data: TopicResponse | { error: string } = await res.json();
      if (!res.ok || "error" in data) {
        setTopicError("error" in data ? data.error : "お題の取得に失敗しました");
        setPhase("error");
        return;
      }
      setTopic((data as TopicResponse).topic);
      setPhase("playing");
    } catch {
      setTopicError("お題の取得に失敗しました");
      setPhase("error");
    }
  }, []);

  useEffect(() => {
    fetchTopic();
  }, [fetchTopic]);

  const handleExpire = useCallback(() => {
    setPhase("timeout");
  }, []);

  const handleTick = useCallback((_remaining: number) => {}, []);

  const handleSubmit = useCallback(
    async (idea: string) => {
      setLastIdea(idea);
      setSubmitError("");
      setPhase("submitting");

      let sessionId: string;
      try {
        sessionId = getSessionId();
      } catch {
        setSubmitError("セッションの取得に失敗しました。再試行してください。");
        setPhase("playing");
        return;
      }

      try {
        const res = await fetch("/api/score-idea", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, topic, idea }),
        });
        const data: ScoreResponse | { error: string } = await res.json();

        if (!res.ok || "error" in data) {
          setSubmitError("error" in data ? data.error : "採点に失敗しました。再試行してください。");
          setPhase("playing");
          return;
        }

        const score = data as ScoreResponse;
        const result: GameResult = {
          topic,
          idea,
          scoreId: score.scoreId,
          originality: score.originality,
          practicality: score.practicality,
          unexpectedness: score.unexpectedness,
          totalScore: score.totalScore,
          comment: score.comment,
          playedAt: new Date().toISOString(),
        };
        sessionStorage.setItem("game_result", JSON.stringify(result));
        router.push("/result");
      } catch {
        setSubmitError("採点に失敗しました。再試行してください。");
        setPhase("playing");
      }
    },
    [topic, router],
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "2rem",
        gap: "1.5rem",
        maxWidth: "640px",
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", margin: 0 }}>⚡ 閃き対決</h1>

      <TopicDisplay topic={topic} isLoading={phase === "loading"} />

      {phase === "error" && (
        <div style={{ textAlign: "center", color: "#e53e3e" }}>
          <p>{topicError || "お題の取得に失敗しました"}</p>
          <button
            type="button"
            onClick={fetchTopic}
            style={{ padding: "0.5rem 1rem", marginTop: "0.5rem" }}
          >
            リトライ
          </button>
        </div>
      )}

      {(phase === "playing" || phase === "submitting") && (
        <GameTimer isPaused={timerPaused} onExpire={handleExpire} onTick={handleTick} />
      )}

      {phase === "timeout" && (
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "1.25rem", color: "#e53e3e", fontWeight: "bold" }}>
            タイムアップ！
          </p>
          <button
            type="button"
            onClick={fetchTopic}
            style={{ padding: "0.75rem 1.5rem", marginTop: "0.5rem" }}
          >
            もう一度
          </button>
        </div>
      )}

      {(phase === "playing" || phase === "submitting") && (
        <div style={{ width: "100%" }}>
          {submitError && <p style={{ color: "#e53e3e", marginBottom: "0.5rem" }}>{submitError}</p>}
          <IdeaInput
            isSubmitting={phase === "submitting"}
            isDisabled={false}
            onSubmit={handleSubmit}
          />
        </div>
      )}
    </main>
  );
}
