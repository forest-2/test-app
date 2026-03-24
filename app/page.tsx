import Link from "next/link";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        gap: "2rem",
        maxWidth: "640px",
        margin: "0 auto",
      }}
    >
      <header style={{ textAlign: "center" }}>
        <h1 style={{ margin: "0 0 0.5rem", fontSize: "2.5rem" }}>⚡ 閃き対決</h1>
        <p style={{ margin: 0, color: "#718096", fontSize: "1.1rem" }}>
          AIのお題に60秒でアイデアを出し、採点してもらおう！
        </p>
      </header>

      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          width: "100%",
          maxWidth: "320px",
        }}
      >
        <Link
          href="/game"
          style={{
            display: "block",
            textAlign: "center",
            padding: "1rem 2rem",
            fontSize: "1.25rem",
            fontWeight: "bold",
            background: "#4299e1",
            color: "#fff",
            borderRadius: "8px",
            textDecoration: "none",
          }}
        >
          スタート
        </Link>
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
          スコア履歴
        </Link>
      </section>
    </main>
  );
}
