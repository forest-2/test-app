export interface IdeaScore {
  originality: number;
  practicality: number;
  unexpectedness: number;
  comment: string;
  totalScore: number;
}

export interface TopicResponse {
  topic: string;
}

export interface ScoreResponse {
  scoreId: number;
  originality: number;
  practicality: number;
  unexpectedness: number;
  totalScore: number;
  comment: string;
}

export interface GameResult {
  topic: string;
  idea: string;
  scoreId: number;
  originality: number;
  practicality: number;
  unexpectedness: number;
  totalScore: number;
  comment: string;
  playedAt: string;
}

export interface ScoreHistoryItem {
  id: number;
  topic: string;
  totalScore: number;
  originality: number;
  practicality: number;
  unexpectedness: number;
  comment: string | null;
  playedAt: string;
}

export interface ScoreHistoryResponse {
  scores: ScoreHistoryItem[];
  personalBest: number | null;
  gamesPlayed: number;
}
