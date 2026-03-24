import { getOpenAIClient } from "@/lib/openai";
import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const completion = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o",
      max_tokens: 128,
      messages: [
        {
          role: "user",
          content:
            "日本語で、日常的なモノや状況を対象にした「○○の新しい使い方・活用法」形式のお題を1つ生成してください。お題のテキストだけを返してください。例：「傘の新しい使い方」",
        },
      ],
    });

    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) {
      return NextResponse.json({ error: "予期しないエラーが発生しました。" }, { status: 500 });
    }

    return NextResponse.json({ topic: text });
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
        { error: "トピック生成サービスが一時的に利用できません。再試行してください。" },
        { status: 503 },
      );
    }
    console.error("[generate-topic] Unexpected error:", err);
    return NextResponse.json({ error: "予期しないエラーが発生しました。" }, { status: 500 });
  }
}
