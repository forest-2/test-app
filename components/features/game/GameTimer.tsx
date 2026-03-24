"use client";

import { useEffect, useRef, useState } from "react";

interface GameTimerProps {
  isPaused: boolean;
  onExpire: () => void;
  onTick: (remaining: number) => void;
}

export function GameTimer({ isPaused, onExpire, onTick }: GameTimerProps) {
  const [remaining, setRemaining] = useState(60);
  const onExpireRef = useRef(onExpire);
  const onTickRef = useRef(onTick);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    if (isPaused || remaining === 0) return;

    const id = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        onTickRef.current(next);
        if (next === 0) {
          onExpireRef.current();
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [isPaused, remaining]);

  const isExpired = remaining === 0;
  const isUrgent = remaining <= 10 && !isExpired;

  return (
    <div
      data-testid="game-timer"
      aria-label={`残り時間 ${remaining} 秒`}
      style={{
        fontSize: "2rem",
        fontWeight: "bold",
        color: isExpired ? "#666" : isUrgent ? "#e53e3e" : "#2d3748",
      }}
    >
      {isExpired ? "時間切れ！" : `${remaining}秒`}
    </div>
  );
}
