import type { ScoreHistoryItem } from "@/types/game";

interface ScoreListProps {
  scores: ScoreHistoryItem[];
  personalBest: number | null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ScoreList({ scores, personalBest }: ScoreListProps) {
  if (scores.length === 0) {
    return <p style={{ textAlign: "center", color: "#718096" }}>まだ記録がありません</p>;
  }

  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {scores.map((score) => {
        const isBest = personalBest !== null && score.totalScore === personalBest;
        return (
          <li
            key={score.id}
            style={{
              padding: "1rem",
              marginBottom: "0.75rem",
              borderRadius: "8px",
              border: isBest ? "2px solid #f6ad55" : "1px solid #e2e8f0",
              background: isBest ? "#fffaf0" : "#fff",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: "bold" }}>{score.topic}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {isBest && (
                  <span
                    style={{
                      background: "#f6ad55",
                      color: "#fff",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                    }}
                  >
                    自己ベスト
                  </span>
                )}
                <span style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#2b6cb0" }}>
                  {score.totalScore}点
                </span>
              </div>
            </div>
            <div style={{ fontSize: "0.85rem", color: "#718096", marginTop: "0.25rem" }}>
              {formatDate(score.playedAt)}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
