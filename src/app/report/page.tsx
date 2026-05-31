"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  ThumbsUp,
  Target,
  TrendingUp,
  FileEdit,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ClipboardList,
  MessageSquare,
} from "lucide-react";

interface AnalysisResult {
  jobAdContent: string;
  resumeContent: string;
  extraInfo: string;
  authenticity: string;
  recommendation: string;
  match: string;
  strengthWeakness: string;
  resumeOptimization: string;
  knowledgePoints: string;
}

interface ReportSectionProps {
  icon: React.ElementType;
  title: string;
  content: string;
  defaultOpen?: boolean;
  accentColor?: string;
}

function ReportSection({ icon: Icon, title, content, defaultOpen = false, accentColor = "indigo" }: ReportSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);

  const handleCopy = (event: React.MouseEvent) => {
    event.stopPropagation();
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const colorMap: Record<string, string> = {
    indigo: "text-indigo-400 bg-indigo-500/10",
    green: "text-green-400 bg-green-500/10",
    amber: "text-amber-400 bg-amber-500/10",
    rose: "text-rose-400 bg-rose-500/10",
    purple: "text-purple-400 bg-purple-500/10",
    cyan: "text-cyan-400 bg-cyan-500/10",
    blue: "text-blue-400 bg-blue-500/10",
  };

  const iconColorClass = colorMap[accentColor] || colorMap.indigo;

  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="flex-1 text-lg font-semibold text-white">{title}</span>
        <div
          role="button"
          onClick={handleCopy}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors mr-1 cursor-pointer"
          title="复制内容"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-slate-500" />}
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>
      {isOpen && (
        <div className="px-5 pb-5 border-t border-white/5 pt-4">
          <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{content}</div>
        </div>
      )}
    </div>
  );
}

export default function ReportPage() {
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem("analysisResult");
    if (stored) {
      try {
        setResult(JSON.parse(stored));
      } catch {
        router.push("/upload");
        return;
      }
    } else {
      router.push("/upload");
      return;
    }
    setLoading(false);
  }, [router]);

  if (loading || !result) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-400">加载中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
          综合分析报告
        </h1>
        <p className="text-slate-400">AI 已完成全面分析，以下是你的求职报告</p>
      </div>

      <div className="space-y-4">
        <ReportSection
          icon={Shield}
          title="岗位真实性判断"
          content={result.authenticity}
          defaultOpen={true}
          accentColor="green"
        />

        <ReportSection
          icon={ThumbsUp}
          title="岗位推荐程度"
          content={result.recommendation}
          defaultOpen={true}
          accentColor="amber"
        />

        <ReportSection
          icon={Target}
          title="求职者匹配程度"
          content={result.match}
          defaultOpen={true}
          accentColor="cyan"
        />

        <ReportSection
          icon={TrendingUp}
          title="优势与不足"
          content={result.strengthWeakness}
          accentColor="purple"
        />

        <ReportSection
          icon={FileEdit}
          title="简历优化建议"
          content={result.resumeOptimization}
          accentColor="blue"
        />

        <ReportSection
          icon={BookOpen}
          title="岗位知识点与高频考点"
          content={result.knowledgePoints}
          accentColor="indigo"
        />
      </div>

      {/* 底部操作区 */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/practice"
          className="glass-card p-5 flex items-center gap-4 hover:border-indigo-500/30 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
            <ClipboardList className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <div className="text-white font-semibold">定向练习题</div>
            <div className="text-slate-400 text-sm">根据岗位要求和你的短板生成练习题</div>
          </div>
        </Link>

        <Link
          href="/interview"
          className="glass-card p-5 flex items-center gap-4 hover:border-indigo-500/30 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
            <MessageSquare className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <div className="text-white font-semibold">模拟面试</div>
            <div className="text-slate-400 text-sm">AI 面试官一对一模拟面试训练</div>
          </div>
        </Link>
      </div>

      <div className="mt-6 text-center">
        <Link href="/upload" className="text-sm text-slate-500 hover:text-indigo-400 transition-colors">
          ← 重新分析其他岗位
        </Link>
      </div>
    </div>
  );
}
