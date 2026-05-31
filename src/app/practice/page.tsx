"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ClipboardList, Loader2, RefreshCw, Copy, Check, ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import LatexRenderer from "@/components/LatexRenderer";

interface AnalysisResult {
  jobAdContent: string;
  resumeContent: string;
  knowledgePoints: string;
}

export default function PracticePage() {
  const router = useRouter();
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const [questions, setQuestions] = useState("");
  const [loading, setLoading] = useState(false);
  const [questionMode, setQuestionMode] = useState<"light" | "full">("light");
  const [showAnswer, setShowAnswer] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState(false);

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

  const generateQuestions = async (mode: "light" | "full") => {
    if (!analysisData || loading) return;
    setLoading(true);
    setQuestions("");
    setQuestionMode(mode);
    setShowAnswer({});

    try {
      const response = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobAdContent: analysisData.jobAdContent,
          resumeContent: analysisData.resumeContent,
          knowledgePoints: analysisData.knowledgePoints,
          questionCount: mode,
        }),
      });

      if (!response.ok) throw new Error("生成失败");
      const data = await response.json();
      setQuestions(data.questions);
    } catch (error) {
      console.error("生成练习题失败:", error);
      setQuestions("生成失败，请重试。");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(questions);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 将练习题文本按"题目"关键词拆分成独立题目
  const parsedQuestions = questions
    ? questions.split(/(?=题目\s*\d+[：:])/g).filter((block) => block.trim().length > 0)
    : [];

  if (!analysisData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-400">加载中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <Link href="/report" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-400 transition-colors mb-6">
        ← 返回分析报告
      </Link>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
          定向练习题
        </h1>
        <p className="text-slate-400">根据岗位要求和你的短板，AI 为你生成针对性练习题</p>
      </div>

      {/* 模式选择 */}
      {!questions && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => generateQuestions("light")}
            className="glass-card p-6 text-left hover:border-indigo-500/30 transition-all group"
          >
            <div className="text-lg font-semibold text-white mb-2 group-hover:text-indigo-300 transition-colors">
              ⚡ 轻量练习
            </div>
            <div className="text-slate-400 text-sm">3 道精选题目，快速检验核心知识点</div>
          </button>

          <button
            onClick={() => generateQuestions("full")}
            className="glass-card p-6 text-left hover:border-indigo-500/30 transition-all group"
          >
            <div className="text-lg font-semibold text-white mb-2 group-hover:text-indigo-300 transition-colors">
              📋 完整题卷
            </div>
            <div className="text-slate-400 text-sm">8-10 道全面题目，覆盖各类题型</div>
          </button>
        </div>
      )}

      {/* 加载状态 */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
          <p className="text-slate-300 text-lg font-medium">职镜正在为你准备试题</p>
          <p className="text-slate-500 text-sm mt-2">大约需要两分钟，请您耐心等待！</p>
        </div>
      )}

      {/* 题目展示 */}
      {questions && !loading && (
        <>
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm text-slate-400">
              共 {parsedQuestions.length} 道题目（{questionMode === "light" ? "轻量模式" : "完整模式"}）
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopyAll}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-sm transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                {copied ? "已复制" : "复制全部"}
              </button>
              <button
                onClick={() => {
                  setQuestions("");
                  setShowAnswer({});
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-sm transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                重新选择
              </button>
            </div>
          </div>

          {parsedQuestions.length > 1 ? (
            <div className="space-y-4">
              {parsedQuestions.map((questionBlock, index) => {
                // 分离题目和参考答案
                const answerSplit = questionBlock.split(/(?=参考思路[：:]|建议回答方向[：:])/);
                const questionPart = answerSplit[0] || questionBlock;
                const answerPart = answerSplit.slice(1).join("\n") || "";
                const isAnswerVisible = showAnswer[index] ?? false;

                return (
                  <div key={index} className="glass-card p-5">
                    <LatexRenderer content={questionPart.trim()} className="text-slate-200 text-sm" />
                    {answerPart && (
                      <>
                        <button
                          onClick={() =>
                            setShowAnswer((prev) => ({ ...prev, [index]: !prev[index] }))
                          }
                          className="mt-3 flex items-center gap-2 text-indigo-400 text-sm hover:text-indigo-300 transition-colors"
                        >
                          {isAnswerVisible ? (
                            <>
                              <ChevronUp className="w-4 h-4" /> 收起参考答案
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" /> 查看参考答案
                            </>
                          )}
                        </button>
                        {isAnswerVisible && (
                          <div className="mt-3 pt-3 border-t border-white/5">
                            <LatexRenderer content={answerPart.trim()} className="text-slate-300 text-sm" />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            // 如果无法拆分，就整体展示
            <div className="glass-card p-6">
              <LatexRenderer content={questions} className="text-slate-200 text-sm" />
            </div>
          )}

          {/* 底部操作 */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={() => generateQuestions(questionMode)}
              className="btn-glow flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              再来一套题
            </button>
            <Link href="/interview" className="btn-outline flex items-center gap-2">
              进入模拟面试 →
            </Link>
          </div>
        </>
      )}

      <div className="mt-8 text-center">
        <Link href="/report" className="text-sm text-slate-500 hover:text-indigo-400 transition-colors">
          ← 返回分析报告
        </Link>
      </div>
    </div>
  );
}
