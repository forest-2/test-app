/**
 * Database type definitions.
 *
 * Add your own table types here as you build out your project.
 * The DemoItem type is used by the template home page — you can remove it
 * once you replace the demo_items table with your own schema.
 */

// Template demo table — replace with your own types
export interface DemoItem {
  id: number;
  title: string;
  created_at: string; // ISO 8601 timestamp
}

// Add your project types below:
// export interface YourEntity { ... }

export interface GameScore {
  id: number;
  session_id: string;
  topic: string;
  user_idea: string;
  score_originality: number;
  score_practicality: number;
  score_unexpectedness: number;
  total_score: number;
  ai_comment: string | null;
  played_at: string;
}
