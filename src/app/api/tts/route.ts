import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

const TTS_API_KEY = process.env.DASHSCOPE_API_KEY;
const TTS_URL =
  "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation";
const TTS_MODEL = "qwen3-tts-instruct-flash";
const TTS_VOICE = "Maia";
const TTS_INSTRUCTIONS =
  "像真实的一对一面试官在现场提问，普通话自然、温和、有思考感，不要新闻播音腔。语速中等偏慢，句间有自然停顿，重点词轻微强调，语调随问题起伏，保持专业但有人情味。";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing text for speech synthesis" }, { status: 400 });
    }

    if (!TTS_API_KEY) {
      return NextResponse.json({ error: "DashScope API key is not configured" }, { status: 500 });
    }

    const truncatedText = text.slice(0, 600);

    const response = await fetch(TTS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TTS_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: TTS_MODEL,
        input: {
          text: truncatedText,
          voice: TTS_VOICE,
          language_type: "Chinese",
          instructions: TTS_INSTRUCTIONS,
          optimize_instructions: true,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DashScope TTS API error:", response.status, errorText);
      return NextResponse.json(
        { error: "Speech synthesis failed", detail: errorText },
        { status: response.status }
      );
    }

    const result = await response.json();
    const audioUrl = result?.output?.audio?.url;

    if (!audioUrl) {
      console.error("DashScope TTS response missing audio url:", result);
      return NextResponse.json(
        { error: "DashScope TTS response missing audio url" },
        { status: 502 }
      );
    }

    const audioResponse = await fetch(audioUrl);

    if (!audioResponse.ok) {
      const errorText = await audioResponse.text();
      console.error("DashScope TTS audio download error:", audioResponse.status, errorText);
      return NextResponse.json(
        { error: "Speech audio download failed", detail: errorText },
        { status: audioResponse.status }
      );
    }

    const audioBuffer = await audioResponse.arrayBuffer();

    return new Response(audioBuffer, {
      headers: {
        "Content-Type": audioResponse.headers.get("Content-Type") || "audio/wav",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("TTS route error:", error);
    return NextResponse.json({ error: "Speech synthesis service error" }, { status: 500 });
  }
}
