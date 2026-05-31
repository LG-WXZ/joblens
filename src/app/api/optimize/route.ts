import { NextRequest, NextResponse } from "next/server";
import { chatCompletion } from "@/lib/ai";
import { PROMPTS } from "@/lib/prompts";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { jobAdContent, resumeContent, matchAnalysis, supplementExperience } = await request.json();

    const contextBlock = [
      `【招聘广告内容】\n${jobAdContent}`,
      `【用户简历内容】\n${resumeContent}`,
      matchAnalysis ? `【匹配分析结果】\n${matchAnalysis}` : "",
      supplementExperience ? `【用户补充经历】\n${supplementExperience}` : "",
    ].filter(Boolean).join("\n\n");

    const result = await chatCompletion(PROMPTS.resumeOptimize, contextBlock, 0.5);

    return NextResponse.json({ optimization: result });
  } catch (error) {
    console.error("简历优化失败:", error);
    return NextResponse.json({ error: "简历优化失败" }, { status: 500 });
  }
}
