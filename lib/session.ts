const SESSION_KEY = "game_session_id";

export function getSessionId(): string {
  if (typeof window === "undefined") {
    throw new Error("getSessionId must be called in a browser context");
  }

  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}
