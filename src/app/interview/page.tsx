"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Send, Loader2, User, Bot, FileText, Copy, Check, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { useTTS } from "@/hooks/useTTS";
import { useASR } from "@/hooks/useASR";

interface AnalysisResult {
  jobAdContent: string;
  resumeContent: string;
  knowledgePoints: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

type InterviewMode = "quick" | "standard" | "pressure";

export default function InterviewPage() {
  const router = useRouter();
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const [mode, setMode] = useState<InterviewMode | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [summaryContent, setSummaryContent] = useState("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [copied, setCopied] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownSendRef = useRef<() => void>(null);
  const modeRef = useRef<InterviewMode | null>(null);
  const interviewEndedRef = useRef(false);

  // 语音合成 Hook — TTS 读完后才启动倒计时
  const tts = useTTS({
    voice: "longxiaochun",
    onEnd: () => {
      if (modeRef.current === "pressure" && !interviewEndedRef.current) {
        startCountdown(120);
      }
    },
    onError: (err) => console.error("TTS错误:", err),
  });

  // 语音识别 Hook（阿里云 Qwen3-ASR-Flash）
  const asr = useASR({
    onResult: (text) => {
      setInputValue(text);
    },
    onError: (err) => console.error("ASR错误:", err),
  });

  // 压力面试倒计时：每秒递减
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    countdownTimerRef.current = timer;
    return () => clearTimeout(timer);
  }, [countdown]);

  // 倒计时归零 → 自动提交或提示超时
  useEffect(() => {
    if (countdown !== 0) return;
    // 停止录音
    if (asr.isListening) asr.stopListening();
    // 自动提交
    countdownSendRef.current?.();
    setCountdown(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  const startCountdown = (seconds: number) => {
    if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
    setCountdown(seconds);
  };

  const stopCountdown = () => {
    if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
    countdownTimerRef.current = null;
    setCountdown(null);
  };

  // 页面卸载时停止所有语音和倒计时
  useEffect(() => {
    return () => {
      tts.stop();
      stopCountdown();
      if (asr.isListening) asr.stopListening();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem("analysisResult");
    if (stored) {
      try {
        setAnalysisData(JSON.parse(stored));
      } catch {
        router.push("/upload");
      }
    } else {
      router.push("/upload");
    }
  }, [router]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, summaryContent, isThinking]);

  const modeConfig: Record<InterviewMode, { label: string; emoji: string; description: string; questionCount: number }> = {
    quick: { label: "快速面试", emoji: "⚡", description: "3 道题，快速热身", questionCount: 3 },
    standard: { label: "标准面试", emoji: "📋", description: "5 道题，模拟真实面试", questionCount: 5 },
    pressure: { label: "压力面试", emoji: "🔥", description: "8 道题，每题限时2分钟", questionCount: 8 },
  };

  const revealAssistantReply = async (assistantContent: string) => {
    const content = assistantContent.trim();
    if (!content) return;

    if (autoSpeak && voiceEnabled) {
      await tts.speak(content);
    }

    setMessages((prev) => [...prev, { role: "assistant", content }]);
  };

  const startInterview = async (selectedMode: InterviewMode) => {
    if (!analysisData) return;
    setMode(selectedMode);
    modeRef.current = selectedMode;
    setIsPreparing(false);
    setIsThinking(true);
    setIsStreaming(true);

    const initialMessages: ChatMessage[] = [
      { role: "user", content: "你好，我准备好了，请开始模拟面试。" },
    ];

    setMessages(initialMessages);

    try {
      const response = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobAdContent: analysisData.jobAdContent,
          resumeContent: analysisData.resumeContent,
          messages: initialMessages,
          mode: selectedMode,
          action: "chat",
        }),
      });

      if (!response.ok) throw new Error("面试启动失败");
      if (!response.body) throw new Error("无响应流");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      // 添加空的 assistant 消息用于流式填充
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.startsWith("data: "));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              // 收到第一段内容时，结束准备状态，添加 assistant 消息
              assistantContent += parsed.content;
            }
          } catch {
            // SSE 流中的不完整 JSON 片段，安全跳过
          }
        }
      }
      // AI 回复完成后自动朗读
      if (assistantContent && autoSpeak && voiceEnabled) {
        await revealAssistantReply(assistantContent);
      }
    } catch (error) {
      console.error("面试启动失败:", error);
      setIsPreparing(false);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "面试启动失败，请重试。" },
      ]);
    } finally {
      setIsStreaming(false);
      setIsThinking(false);
      setIsPreparing(false);
      // 流结束后触发朗读；倒计时由 TTS onEnd 回调启动
      if (selectedMode === "pressure" && (!autoSpeak || !voiceEnabled)) {
        startCountdown(120);
        // 语音关闭时直接启动倒计时
        startCountdown(120);
      }
    }
  };

  // 倒计时归零自动提交的引用函数
  const handleAutoSubmit = useRef(() => {
    const currentInput = inputRef.current?.value?.trim();
    if (currentInput) {
      setInputValue(currentInput);
      // 延迟让 state 更新后触发 sendMessage
      setTimeout(() => {
        const form = document.getElementById("interview-send-btn");
        form?.click();
      }, 100);
    } else {
      // 没有输入内容，自动发一条超时提示
      setInputValue("（回答超时）");
      setTimeout(() => {
        const form = document.getElementById("interview-send-btn");
        form?.click();
      }, 100);
    }
  });
  countdownSendRef.current = handleAutoSubmit.current;

  const sendMessage = async () => {
    if (!inputValue.trim() || isStreaming || !analysisData || !mode) return;

    // 用户主动回答，停止倒计时
    stopCountdown();

    const userMessage = inputValue.trim();
    setInputValue("");

    // 检查是否为结束面试指令
    const isEndCommand = /结束|结束面试|不了|够了|就这样/i.test(userMessage);

    const updatedMessages: ChatMessage[] = [...messages, { role: "user", content: userMessage }];
    setMessages(updatedMessages);

    if (isEndCommand) {
      setInterviewEnded(true);
      interviewEndedRef.current = true;
      generateSummary(updatedMessages);
      return;
    }

    setIsStreaming(true);

    try {
      const response = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobAdContent: analysisData.jobAdContent,
          resumeContent: analysisData.resumeContent,
          messages: updatedMessages,
          mode,
          action: "chat",
        }),
      });

      if (!response.ok) throw new Error("发送失败");
      if (!response.body) throw new Error("无响应流");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.startsWith("data: "));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              assistantContent += parsed.content;
            }
          } catch {
            // SSE 流中的不完整 JSON 片段，安全跳过
          }
        }
      }

      // 检查 AI 回复是否包含面试结束标志
      if (/面试.*结束|全部.*完成|最后.*总结/.test(assistantContent)) {
        setInterviewEnded(true);
        interviewEndedRef.current = true;
      }

      // AI 回复完成后自动朗读
      if (assistantContent && autoSpeak && voiceEnabled) {
        await revealAssistantReply(assistantContent);
      }
    } catch (error) {
      console.error("发送失败:", error);
      setMessages((prev) => {
        const updated = [...prev];
        if (updated[updated.length - 1]?.role === "assistant" && !updated[updated.length - 1].content) {
          updated[updated.length - 1] = { role: "assistant", content: "发送失败，请重试。" };
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
      // 流结束后触发朗读；倒计时由 TTS onEnd 回调启动
      if (mode === "pressure" && !interviewEnded && (!autoSpeak || !voiceEnabled)) {
        startCountdown(120);
        // 语音关闭时直接启动倒计时
        startCountdown(120);
      }
      setIsThinking(false);
      inputRef.current?.focus();
    }
  };

  const generateSummary = async (chatMessages: ChatMessage[]) => {
    if (!analysisData) return;
    setIsGeneratingSummary(true);

    try {
      const response = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobAdContent: analysisData.jobAdContent,
          resumeContent: analysisData.resumeContent,
          messages: chatMessages,
          mode,
          action: "summary",
        }),
      });

      if (!response.ok) throw new Error("生成总结失败");
      if (!response.body) throw new Error("无响应流");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let content = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.startsWith("data: "));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              content += parsed.content;
              setSummaryContent(content);
            }
          } catch {
            // SSE 流中的不完整 JSON 片段，安全跳过
          }
        }
      }
    } catch (error) {
      console.error("生成总结失败:", error);
      setSummaryContent("生成面试总结失败，请重试。");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(summaryContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  if (!analysisData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-400">加载中...</div>
      </div>
    );
  }

  // 模式选择界面
  if (!mode) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/report" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-400 transition-colors mb-6">
          ← 返回分析报告
        </Link>
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
            模拟面试
          </h1>
          <p className="text-slate-400">选择面试模式，AI 面试官将与你进行一对一模拟面试</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {(Object.entries(modeConfig) as [InterviewMode, typeof modeConfig.quick][]).map(
            ([modeKey, config]) => (
              <button
                key={modeKey}
                onClick={() => startInterview(modeKey)}
                className="glass-card p-6 text-left hover:border-indigo-500/30 transition-all group"
              >
                <div className="text-3xl mb-3">{config.emoji}</div>
                <div className="text-lg font-semibold text-white mb-1 group-hover:text-indigo-300 transition-colors">
                  {config.label}
                </div>
                <div className="text-slate-400 text-sm">{config.description}</div>
              </button>
            )
          )}
        </div>

        <div className="glass-card p-5 text-sm text-slate-400 leading-relaxed">
          <p className="mb-2 text-slate-300 font-medium">面试说明：</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>AI 面试官会一次问一道题，并根据你的回答进行追问</li>
            <li>每道题结束后会给出简短反馈</li>
            <li>面试结束后会生成完整面试报告</li>
            <li>你可以随时输入"结束面试"来提前结束</li>
            <li>🎙️ 支持语音交互：面试官会语音读题，你也可以语音回答</li>
          </ul>
        </div>

        {/* 语音设置 */}
        <div className="glass-card p-5 mt-4">
          <p className="text-slate-300 font-medium text-sm mb-3">🔊 语音设置</p>
          <div className="flex flex-col gap-3">
            <label className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">面试官语音朗读题目</span>
              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`relative w-11 h-6 rounded-full transition-colors ${voiceEnabled ? "bg-indigo-500" : "bg-slate-600"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${voiceEnabled ? "translate-x-5" : ""}`} />
              </button>
            </label>
            <label className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">每次回复自动朗读</span>
              <button
                onClick={() => setAutoSpeak(!autoSpeak)}
                className={`relative w-11 h-6 rounded-full transition-colors ${autoSpeak ? "bg-indigo-500" : "bg-slate-600"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${autoSpeak ? "translate-x-5" : ""}`} />
              </button>
            </label>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/report" className="text-sm text-slate-500 hover:text-indigo-400 transition-colors">
            ← 返回分析报告
          </Link>
        </div>
      </div>
    );
  }

  // 面试官准备中过渡页
  if (isPreparing) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 animate-pulse">
          <Bot className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-xl font-bold text-white mb-3">面试官正在准备中...</h2>
        <p className="text-slate-400 text-sm mb-6">正在根据您的简历和岗位要求准备面试题目</p>
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
          <span className="text-slate-500 text-sm">{modeConfig[mode!].label} · {modeConfig[mode!].questionCount} 道题</span>
        </div>
      </div>
    );
  }

  // 面试对话界面
  return (
    <div className="max-w-3xl mx-auto px-6 py-6 flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      {/* 头部 */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/report" className="p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white" title="返回分析报告">
            ←
          </Link>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-white font-medium text-sm">AI 面试官</div>
            <div className="text-slate-500 text-xs">
              {modeConfig[mode].label} · {modeConfig[mode].questionCount} 道题
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* 语音开关 */}
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`p-2 rounded-lg transition-colors ${voiceEnabled ? "text-indigo-400 hover:bg-indigo-500/10" : "text-slate-500 hover:bg-white/10"}`}
            title={voiceEnabled ? "关闭语音" : "开启语音"}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          {!interviewEnded && (
            <button
              onClick={() => {
                tts.stop();
                stopCountdown();
                setInterviewEnded(true);
                interviewEndedRef.current = true;
                generateSummary(messages);
              }}
              className="text-sm text-slate-400 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10"
            >
              结束面试
            </button>
          )}
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 min-h-0">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === "user"
                  ? "bg-indigo-500/20"
                  : "bg-gradient-to-br from-indigo-500 to-purple-600"
              }`}
            >
              {message.role === "user" ? (
                <User className="w-4 h-4 text-indigo-300" />
              ) : (
                <Bot className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="flex flex-col gap-1 max-w-[80%]">
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "bg-indigo-500/20 text-indigo-100"
                    : "glass-card text-slate-200"
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                {message.role === "assistant" &&
                  isStreaming &&
                  index === messages.length - 1 &&
                  !message.content && (
                    <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                  )}
              </div>
              {/* AI 消息的手动朗读按钮 */}
              {message.role === "assistant" && message.content && voiceEnabled && !isStreaming && (
                <button
                  onClick={() => tts.speak(message.content)}
                  className="self-start flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-400 transition-colors ml-1"
                  title="朗读此消息"
                >
                  <Volume2 className="w-3 h-3" />
                  {tts.isSpeaking ? "播放中..." : "朗读"}
                </button>
              )}
            </div>
          </div>
        ))}

        {/* 面试总结 */}
        {isThinking && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="glass-card text-slate-300 rounded-2xl px-4 py-3 text-sm leading-relaxed">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                <span>面试官正在思考...</span>
              </div>
            </div>
          </div>
        )}

        {(isGeneratingSummary || summaryContent) && (
          <div className="glass-card p-5 mt-4 border-indigo-500/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-indigo-300 font-medium">
                <FileText className="w-4 h-4" />
                面试总结报告
              </div>
              {summaryContent && !isGeneratingSummary && (
                <button
                  onClick={handleCopySummary}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "已复制" : "复制"}
                </button>
              )}
            </div>
            {isGeneratingSummary && !summaryContent && (
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                正在生成面试总结...
              </div>
            )}
            {summaryContent && (
              <div className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                {summaryContent}
              </div>
            )}
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* 输入区域 */}
      {!interviewEnded ? (
        <div className="flex-shrink-0 pt-4 border-t border-white/5">
          {/* 压力面试倒计时 */}
          {countdown !== null && (
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono font-bold ${countdown <= 15 ? "text-red-400 animate-pulse" : countdown <= 30 ? "text-yellow-400" : "text-slate-400"}`}>
                  ⏱ {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, "0")}
                </span>
                {countdown <= 15 && (
                  <span className="text-xs text-red-400">请尽快作答！</span>
                )}
              </div>
              <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${countdown <= 15 ? "bg-red-500" : countdown <= 30 ? "bg-yellow-500" : "bg-indigo-500"}`}
                  style={{ width: `${(countdown / 180) * 100}%` }}
                />
              </div>
            </div>
          )}
          {/* 语音识别状态提示 */}
          {(asr.isListening || asr.isProcessing) && (
            <div className="flex items-center gap-2 mb-2 px-1">
              {asr.isListening ? (
                <>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                  </span>
                  <span className="text-xs text-red-400">正在录音... 点击麦克风按钮停止</span>
                </>
              ) : (
                <>
                  <Loader2 className="w-3 h-3 text-indigo-400 animate-spin" />
                  <span className="text-xs text-indigo-400">正在识别语音...</span>
                </>
              )}
            </div>
          )}
          <div className="flex gap-2">
            {/* 麦克风按钮 */}
            {asr.isSupported && (
              <button
                onClick={() => {
                  if (asr.isListening) {
                    asr.stopListening();
                  } else {
                    // 停止 AI 朗读，避免语音识别收到 AI 的声音
                    tts.stop();
                    asr.resetTranscript();
                    setInputValue("");
                    asr.startListening();
                  }
                }}
                disabled={isStreaming || asr.isProcessing}
                className={`self-end p-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  asr.isListening
                    ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                    : "bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-indigo-500/50"
                }`}
                title={asr.isListening ? "停止录音" : asr.isProcessing ? "识别中..." : "语音输入"}
              >
                {asr.isListening ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>
            )}
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={asr.isListening ? "正在听你说话..." : "输入你的回答... (Shift+Enter 换行)"}
              disabled={isStreaming}
              rows={2}
              className="flex-1 p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 resize-none focus:outline-none focus:border-indigo-500/50 transition-colors disabled:opacity-50"
            />
            <button
              id="interview-send-btn"
              onClick={() => {
                if (asr.isListening) {
                  asr.stopListening();
                }
                sendMessage();
              }}
              disabled={!inputValue.trim() || isStreaming}
              className="self-end p-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white transition-colors"
            >
              {isStreaming ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-shrink-0 pt-4 border-t border-white/5 flex items-center justify-center gap-4">
          <Link href="/report" className="btn-outline text-sm">
            返回分析报告
          </Link>
          <button
            onClick={() => {
              setMode(null);
              modeRef.current = null;
              setMessages([]);
              setInterviewEnded(false);
              interviewEndedRef.current = false;
              setSummaryContent("");
            }}
            className="btn-glow text-sm"
          >
            重新面试
          </button>
        </div>
      )}
    </div>
  );
}
