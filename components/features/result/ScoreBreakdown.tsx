interface ScoreBreakdownProps {
  originality: number;
  practicality: number;
  unexpectedness: number;
  totalScore: number;
}

function ScoreBar({ label, score, max }: { label: string; score: number; max: number }) {
  const pct = Math.round((score / max) * 100);
  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
        <span>{label}</span>
        <span>
          {score}/{max}点
        </span>
      </div>
      <div style={{ background: "#e2e8f0", borderRadius: "4px", height: "12px" }}>
        <div
          style={{
            width: `${pct}%`,
            background: "#4299e1",
            borderRadius: "4px",
            height: "100%",
            transition: "width 0.5s ease",
          }}
        />
      </div>
    </div>
  );
}

export function ScoreBreakdown({
  originality,
  practicality,
  unexpectedness,
  totalScore,
}: ScoreBreakdownProps) {
  return (
    <div>
      <ScoreBar label="独創性" score={originality} max={33} />
      <ScoreBar label="実用性" score={practicality} max={33} />
      <ScoreBar label="意外性" score={unexpectedness} max={34} />
      <div
        style={{
          marginTop: "1rem",
          padding: "0.75rem",
          background: "#ebf8ff",
          borderRadius: "8px",
          textAlign: "center",
        }}
      >
        <span style={{ fontSize: "1.1rem" }}>合計：</span>
        <span style={{ fontSize: "2rem", fontWeight: "bold", color: "#2b6cb0" }}>{totalScore}</span>
        <span style={{ fontSize: "1.1rem" }}>/100点</span>
      </div>
    </div>
  );
}
