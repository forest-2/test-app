import { insertGameScore } from "@/lib/game-scores";
import { getOpenAIClient } from "@/lib/openai";
import { type NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const SCORE_FUNCTION: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: "function",
  function: {
    name: "submit_score",
    description: "プレイヤーのアイデアを3軸で採点し、一言コメントを返す",
    parameters: {
      type: "object",
      properties: {
        originality: {
          type: "number",
          description: "独創性スコア（0〜33点）：既成概念にとらわれない独自性",
        },
        practicality: {
          type: "number",
          description: "実用性スコア（0〜33点）：実際に使えそうか・現実的か",
        },
        unexpectedness: {
          type: "number",
          description: "意外性スコア（0〜34点）：予想外・驚きがあるか",
        },
        comment: {
          type: "string",
          description: "採点理由・講評を含む一言コメント（日本語）",
        },
      },
      required: ["originality", "practicality", "unexpectedness", "comment"],
    },
  },
};

export async function POST(request: NextRequest) {
  let body: { sessionId?: string; topic?: string; idea?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "無効なリクエスト形式です。" }, { status: 400 });
  }

  const { sessionId, topic, idea } = body;

  if (!sessionId || !topic) {
    return NextResponse.json({ error: "無効なリクエスト形式です。" }, { status: 400 });
  }
  if (!idea || idea.trim().length === 0) {
    return NextResponse.json({ error: "アイデアを入力してください。" }, { status: 400 });
  }
  if (idea.length > 500) {
    return NextResponse.json(
      { error: "アイデアは500文字以内で入力してください。" },
      { status: 400 },
    );
  }

  try {
    const completion = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o",
      max_tokens: 512,
      tools: [SCORE_FUNCTION],
      tool_choice: { type: "function", function: { name: "submit_score" } },
      messages: [
        {
          role: "user",
          content: `お題：「${topic}」\nプレイヤーのアイデア：「${idea}」\n\nこのアイデアを独創性・実用性・意外性の3軸で採点し、一言コメントを付けてください。`,
        },
      ],
    });

    const toolCall = completion.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.type !== "function") {
      return NextResponse.json(
        { error: "採点に失敗しました。再試行してください。" },
        { status: 500 },
      );
    }

    const scores = JSON.parse(toolCall.function.arguments) as {
      originality: number;
      practicality: number;
      unexpectedness: number;
      comment: string;
    };

    const totalScore = scores.originality + scores.practicality + scores.unexpectedness;

    const saved = await insertGameScore({
      sessionId,
      topic,
      userIdea: idea,
      scoreOriginality: scores.originality,
      scorePracticality: scores.practicality,
      scoreUnexpectedness: scores.unexpectedness,
      totalScore,
      aiComment: scores.comment,
    });

    return NextResponse.json({
      scoreId: saved.id,
      originality: scores.originality,
      practicality: scores.practicality,
      unexpectedness: scores.unexpectedness,
      totalScore,
      comment: scores.comment,
    });
  } catch (err) {
    if (err instanceof OpenAI.RateLimitError) {
      return NextResponse.json(
        {
          error: "リクエストが多すぎます。しばらく待ってから再試行してください。",
          retryAfter: 60,
        },
        { status: 429 },
      );
    }
    if (err instanceof OpenAI.APIConnectionError) {
      return NextResponse.json(
        { error: "採点サービスが一時的に利用できません。入力内容は保持されています。" },
        { status: 503 },
      );
    }
    console.error("[score-idea] Unexpected error:", err);
    return NextResponse.json(
      { error: "採点に失敗しました。再試行してください。" },
      { status: 500 },
    );
  }
}
