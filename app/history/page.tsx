"use client";

import { ScoreList } from "@/components/features/history/ScoreList";
import { getSessionId } from "@/lib/session";
import type { ScoreHistoryResponse } from "@/types/game";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function HistoryPage() {
  const [data, setData] = useState<ScoreHistoryResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const sessionId = getSessionId();
        const res = await fetch(`/api/scores?sessionId=${sessionId}`);
        if (!res.ok) {
          setError("スコアの取得に失敗しました。");
          return;
        }
        const json: ScoreHistoryResponse = await res.json();
        setData(json);
      } catch {
        setError("スコアの取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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
      <header
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", margin: 0 }}>📊 スコア履歴</h1>
        <Link href="/" style={{ color: "#4299e1", textDecoration: "none" }}>
          ホームへ
        </Link>
      </header>

      {data && (
        <div style={{ width: "100%", display: "flex", gap: "1rem", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{data.gamesPlayed}</div>
            <div style={{ fontSize: "0.85rem", color: "#718096" }}>プレイ回数</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#2b6cb0" }}>
              {data.personalBest ?? "-"}
            </div>
            <div style={{ fontSize: "0.85rem", color: "#718096" }}>自己ベスト</div>
          </div>
        </div>
      )}

      <div style={{ width: "100%" }}>
        {loading && <p style={{ textAlign: "center", color: "#718096" }}>読み込み中…</p>}
        {error && <p style={{ textAlign: "center", color: "#e53e3e" }}>{error}</p>}
        {data && <ScoreList scores={data.scores} personalBest={data.personalBest} />}
      </div>

      <Link
        href="/game"
        style={{
          display: "block",
          textAlign: "center",
          padding: "0.75rem 2rem",
          fontSize: "1rem",
          fontWeight: "bold",
          background: "#4299e1",
          color: "#fff",
          borderRadius: "8px",
          textDecoration: "none",
        }}
      >
        新しくプレイ
      </Link>
    </main>
  );
}
