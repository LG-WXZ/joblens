import { NextRequest, NextResponse } from "next/server";
import { chatCompletion } from "@/lib/ai";
import { PROMPTS } from "@/lib/prompts";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { jobAdContent, resumeContent, knowledgePoints, questionCount } = await request.json();

    const contextBlock = `【招聘广告内容】\n${jobAdContent}\n\n【用户简历内容】\n${resumeContent}\n\n【岗位知识点】\n${knowledgePoints}`;

    const countInstruction = questionCount === "light"
      ? "请生成 3 道精选练习题。"
      : "请生成 8-10 道完整练习题。";

    const result = await chatCompletion(
      PROMPTS.practiceQuestions,
      `${contextBlock}\n\n${countInstruction}`,
      0.6
    );

    return NextResponse.json({ questions: result });
  } catch (error) {
    console.error("生成练习题失败:", error);
    return NextResponse.json({ error: "生成练习题失败" }, { status: 500 });
  }
}
