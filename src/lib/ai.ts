import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: process.env.DASHSCOPE_API_BASE,
});

const TEXT_MODEL = process.env.TEXT_MODEL || "qwen-plus";
// qwen3.6-plus 支持多模态图片输入，直接复用
const VISION_MODEL = process.env.VISION_MODEL || "qwen3.6-plus";

export async function chatCompletion(
  systemPrompt: string,
  userMessage: string,
  temperature = 0.7,
  enableSearch = false
): Promise<string> {
  const requestBody: Record<string, unknown> = {
    model: TEXT_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    temperature,
    max_tokens: 4096,
  };

  if (enableSearch) {
    requestBody.enable_search = true;
  }

  requestBody.stream = false;
  const response = await client.chat.completions.create(
    requestBody as unknown as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming
  );
  return response.choices[0]?.message?.content || "";
}

export async function visionCompletion(
  systemPrompt: string,
  imageBase64: string,
  additionalText = ""
): Promise<string> {
  const userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
    {
      type: "image_url",
      image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
    },
  ];
  if (additionalText) {
    userContent.push({ type: "text", text: additionalText });
  }

  const response = await client.chat.completions.create({
    model: VISION_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    temperature: 0.3,
    max_tokens: 4096,
  });
  return response.choices[0]?.message?.content || "";
}

export async function streamChatCompletion(
  systemPrompt: string,
  messages: { role: "user" | "assistant"; content: string }[],
  temperature = 0.7
) {
  const stream = await client.chat.completions.create({
    model: TEXT_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
    temperature,
    max_tokens: 4096,
    stream: true,
  });
  return stream;
}
