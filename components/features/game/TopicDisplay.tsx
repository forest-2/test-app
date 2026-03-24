interface TopicDisplayProps {
  topic: string;
  isLoading: boolean;
}

export function TopicDisplay({ topic, isLoading }: TopicDisplayProps) {
  if (isLoading) {
    return (
      <div
        aria-label="お題を読み込み中"
        style={{
          height: "2rem",
          background: "#e2e8f0",
          borderRadius: "4px",
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
    );
  }

  return (
    <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", textAlign: "center" }}>お題：{topic}</h2>
  );
}
