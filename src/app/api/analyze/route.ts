import { NextRequest, NextResponse } from "next/server";
import { chatCompletion, visionCompletion } from "@/lib/ai";
import { PROMPTS } from "@/lib/prompts";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const jobAdImage = formData.get("jobAdImage") as File | null;
    const jobAdText = formData.get("jobAdText") as string | null;
    const jobAdSource = formData.get("jobAdSource") as string | null;
    const jobAdLink = formData.get("jobAdLink") as string | null;
    const jobAdCity = formData.get("jobAdCity") as string | null;

    const resumeFile = formData.get("resumeFile") as File | null;
    const resumeText = formData.get("resumeText") as string | null;
    const supplementNote = formData.get("supplementNote") as string | null;

    // Step 1: 获取招聘广告文字内容
    let jobAdContent = jobAdText || "";

    if (jobAdImage && !jobAdContent) {
      try {
        const imageBuffer = Buffer.from(await jobAdImage.arrayBuffer());
        const imageBase64 = imageBuffer.toString("base64");
        jobAdContent = await visionCompletion(
          PROMPTS.ocrRecognition,
          imageBase64,
          "请提取这张招聘广告图片中的所有文字内容"
        );
      } catch (ocrError) {
        console.error("OCR识别失败:", ocrError);
        return NextResponse.json(
          { error: "图片识别服务暂时不可用，请直接粘贴招聘广告文字内容" },
          { status: 400 }
        );
      }
    }

    if (!jobAdContent.trim()) {
      return NextResponse.json({ error: "未能获取招聘广告内容" }, { status: 400 });
    }

    // Step 2: 获取简历文字内容
    let resumeContent = resumeText || "";

    if (resumeFile && !resumeContent) {
      const fileBuffer = Buffer.from(await resumeFile.arrayBuffer());
      const fileName = resumeFile.name.toLowerCase();

      if (fileName.endsWith(".pdf")) {
        const pdfParse = (await import("pdf-parse")).default;
        const pdfData = await pdfParse(fileBuffer);
        resumeContent = pdfData.text;
      } else if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        resumeContent = result.value;
      }

      // 如果解析后内容过少，可能是扫描件PDF，尝试用视觉模型兜底
      if (resumeContent.trim().length < 50 && fileName.endsWith(".pdf")) {
        const fileBase64 = fileBuffer.toString("base64");
        resumeContent = await visionCompletion(
          "你是一个文档识别专家。请完整提取这份简历文档中的所有文字内容，保持原始排版结构。不要添加任何分析，只输出原文。",
          fileBase64,
          "请提取这份简历中的所有文字内容"
        );
      }
    }

    if (!resumeContent.trim()) {
      return NextResponse.json({ error: "未能获取简历内容" }, { status: 400 });
    }

    // 构建附加信息
    const extraInfo = [
      jobAdSource ? `招聘来源平台：${jobAdSource}` : "",
      jobAdLink ? `招聘链接：${jobAdLink}` : "",
      jobAdCity ? `岗位城市：${jobAdCity}` : "",
      supplementNote ? `用户补充说明：${supplementNote}` : "",
    ].filter(Boolean).join("\n");

    const contextBlock = `【招聘广告内容】\n${jobAdContent}\n\n【用户简历内容】\n${resumeContent}${extraInfo ? `\n\n【附加信息】\n${extraInfo}` : ""}`;

    // Step 3-7: 并行调用所有分析
    const [
      authenticityResult,
      recommendationResult,
      matchResult,
      strengthResult,
      resumeOptResult,
      knowledgeResult,
    ] = await Promise.all([
      chatCompletion(PROMPTS.jobAuthenticity, contextBlock, 0.3, true),
      chatCompletion(PROMPTS.jobRecommendation, contextBlock, 0.5, true),
      chatCompletion(PROMPTS.matchAnalysis, contextBlock, 0.5),
      chatCompletion(PROMPTS.strengthWeakness, contextBlock, 0.5),
      chatCompletion(PROMPTS.resumeOptimize, contextBlock, 0.5),
      chatCompletion(PROMPTS.knowledgePoints, contextBlock, 0.5),
    ]);

    return NextResponse.json({
      jobAdContent,
      resumeContent,
      extraInfo,
      authenticity: authenticityResult,
      recommendation: recommendationResult,
      match: matchResult,
      strengthWeakness: strengthResult,
      resumeOptimization: resumeOptResult,
      knowledgePoints: knowledgeResult,
    });
  } catch (error) {
    console.error("分析失败:", error);
    const errorMessage = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json({ error: `分析失败: ${errorMessage}` }, { status: 500 });
  }
}
