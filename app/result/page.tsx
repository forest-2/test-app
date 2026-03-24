"use client";

import { AiComment } from "@/components/features/result/AiComment";
import { ScoreBreakdown } from "@/components/features/result/ScoreBreakdown";
import type { GameResult } from "@/types/game";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<GameResult | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("game_result");
      if (!raw) {
        setError(true);
        return;
      }
      setResult(JSON.parse(raw) as GameResult);
    } catch {
      setError(true);
    }
  }, []);

  const handleReplay = () => {
    sessionStorage.removeItem("game_result");
    router.push("/game");
  };

  if (error) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          gap: "1rem",
        }}
      >
        <p style={{ color: "#e53e3e" }}>結果が見つかりませんでした。</p>
        <Link href="/game">ゲームを始める</Link>
      </main>
    );
  }

  if (!result) return null;

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
      <h1 style={{ fontSize: "1.5rem", margin: 0 }}>⚡ 採点結果</h1>

      <div style={{ width: "100%", background: "#f7fafc", padding: "1rem", borderRadius: "8px" }}>
        <p style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>お題：{result.topic}</p>
        <p style={{ color: "#4a5568", marginTop: 0 }}>あなたのアイデア：{result.idea}</p>
      </div>

      <div style={{ width: "100%" }}>
        <ScoreBreakdown
          originality={result.originality}
          practicality={result.practicality}
          unexpectedness={result.unexpectedness}
          totalScore={result.totalScore}
        />
      </div>

      <div style={{ width: "100%" }}>
        <h3 style={{ marginBottom: "0.5rem" }}>AIコメント</h3>
        <AiComment comment={result.comment} />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          width: "100%",
          maxWidth: "320px",
        }}
      >
        <button
          type="button"
          onClick={handleReplay}
          style={{
            padding: "0.875rem 2rem",
            fontSize: "1.1rem",
            fontWeight: "bold",
            background: "#4299e1",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          もう一度
        </button>
        <Link
          href="/history"
          style={{
            display: "block",
            textAlign: "center",
            padding: "0.75rem 2rem",
            fontSize: "1rem",
            color: "#4299e1",
            border: "1px solid #4299e1",
            borderRadius: "8px",
            textDecoration: "none",
          }}
        >
          スコアを見る
        </Link>
      </div>
    </main>
  );
}
