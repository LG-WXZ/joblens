import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const maxDuration = 30;

const client = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: process.env.DASHSCOPE_API_BASE,
});

export async function POST(request: NextRequest) {
  try {
    const { audioBase64, mimeType = "audio/webm" } = await request.json();

    if (!audioBase64 || typeof audioBase64 !== "string") {
      return NextResponse.json({ error: "缺少音频数据" }, { status: 400 });
    }

    // 构造 data URI
    const audioDataUri = `data:${mimeType};base64,${audioBase64}`;

    const response = await client.chat.completions.create({
      model: "qwen3-asr-flash",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "input_audio",
              input_audio: {
                data: audioDataUri,
              },
            } as unknown as OpenAI.Chat.Completions.ChatCompletionContentPart,
          ],
        },
      ],
      stream: false,
    });

    const text = response.choices[0]?.message?.content || "";

    return NextResponse.json({ text });
  } catch (error) {
    console.error("ASR 识别失败:", error);
    const message = error instanceof Error ? error.message : "语音识别失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
