"use client";

import { useState } from "react";

interface IdeaInputProps {
  isSubmitting: boolean;
  isDisabled: boolean;
  onSubmit: (idea: string) => void;
}

export function IdeaInput({ isSubmitting, isDisabled, onSubmit }: IdeaInputProps) {
  const [value, setValue] = useState("");
  const MAX = 500;
  const remaining = MAX - value.length;
  const isNearLimit = value.length >= 450;

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={MAX}
        disabled={isDisabled || isSubmitting}
        placeholder="アイデアを入力してください…"
        rows={5}
        style={{ resize: "vertical", fontSize: "1rem", padding: "0.5rem" }}
        aria-label="アイデア入力"
      />
      <div
        style={{
          textAlign: "right",
          fontSize: "0.85rem",
          color: isNearLimit ? "#e53e3e" : "#718096",
        }}
      >
        {value.length}/{MAX}
      </div>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!value.trim() || isSubmitting || isDisabled}
        style={{ padding: "0.75rem 1.5rem", fontSize: "1rem" }}
      >
        {isSubmitting ? "採点中…" : "送信"}
      </button>
    </div>
  );
}
