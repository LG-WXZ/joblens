import { NextRequest, NextResponse } from "next/server";
import { streamChatCompletion } from "@/lib/ai";
import { PROMPTS } from "@/lib/prompts";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { jobAdContent, resumeContent, messages, mode, action } = await request.json();

    const modeInstruction =
      mode === "quick" ? "本次为快速面试模式，共 3 道题。"
      : mode === "pressure" ? "本次为压力面试模式，共 8 道题，包含追问。"
      : "本次为标准面试模式，共 5 道题。";

    const systemPrompt = `${PROMPTS.mockInterview}\n\n【招聘广告内容】\n${jobAdContent}\n\n【用户简历内容】\n${resumeContent}\n\n${modeInstruction}`;

    if (action === "summary") {
      const summaryPrompt = `${PROMPTS.interviewFeedback}\n\n【招聘广告内容】\n${jobAdContent}\n\n【用户简历内容】\n${resumeContent}`;
      const conversationLog = messages.map((m: { role: string; content: string }) =>
        `[${m.role === "user" ? "候选人" : "面试官"}]: ${m.content}`
      ).join("\n\n");

      const stream = await streamChatCompletion(
        summaryPrompt,
        [{ role: "user", content: `以下是完整的面试对话记录：\n\n${conversationLog}\n\n请生成面试总结报告。` }],
        0.5
      );

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // 普通面试对话
    const stream = await streamChatCompletion(systemPrompt, messages, 0.7);

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("面试对话失败:", error);
    return NextResponse.json({ error: "面试对话失败" }, { status: 500 });
  }
}
