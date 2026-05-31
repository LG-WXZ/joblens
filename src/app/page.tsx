"use client";

import Link from "next/link";
import { Sparkles, Shield, Target, BookOpen, MessageSquare, FileText } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "岗位真实性判断",
    description: "AI 识别招聘广告风险，帮你避开虚假岗位和培训贷陷阱",
  },
  {
    icon: Target,
    title: "岗位匹配分析",
    description: "对比简历和岗位要求，给出匹配程度和应聘机会判断",
  },
  {
    icon: FileText,
    title: "智能简历优化",
    description: "针对目标岗位优化简历表达，强化关键词，突出你的贡献",
  },
  {
    icon: BookOpen,
    title: "知识点与练习题",
    description: "梳理岗位高频考点，生成定向练习题，精准备考",
  },
  {
    icon: MessageSquare,
    title: "模拟面试",
    description: "AI 面试官一对一模拟面试，实时反馈，帮你练到位",
  },
  {
    icon: Sparkles,
    title: "一站式求职报告",
    description: "从岗位分析到面试准备，所有结果汇总在一份综合报告中",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-24 pb-16 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm mb-8">
          <Sparkles className="w-4 h-4" />
          AI 驱动的智能求职分析
        </div>

        <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
          <span className="bg-gradient-to-r from-white via-indigo-200 to-purple-300 bg-clip-text text-transparent">
            看清岗位
          </span>
          <br />
          <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
            看清自己
          </span>
        </h1>

        <p className="text-lg text-slate-400 max-w-2xl mb-10 leading-relaxed">
          上传招聘广告和你的简历，AI 将帮你判断岗位是否真实、是否值得投递、
          你和岗位是否匹配，并进一步生成简历优化建议、岗位知识点、练习题和模拟面试。
        </p>

        <div className="flex items-center gap-4">
          <Link href="/upload" className="btn-glow text-lg">
            开始分析岗位
          </Link>
          <Link href="#features" className="btn-outline text-lg">
            了解更多
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-4 bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
          一个工具，搞定求职全流程
        </h2>
        <p className="text-slate-400 text-center mb-12 max-w-xl mx-auto">
          这个岗位值不值得投？我现在够不够？如果不够，我该怎么补、怎么改、怎么练？
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="glass-card p-6 hover:border-indigo-500/30 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 transition-colors">
                <feature.icon className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="glass-card p-12">
          <h2 className="text-2xl font-bold mb-4">准备好了吗？</h2>
          <p className="text-slate-400 mb-8">
            只需上传招聘广告和简历，AI 就能帮你完成从岗位分析到面试准备的全流程
          </p>
          <Link href="/upload" className="btn-glow text-lg inline-block">
            立即开始
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-8 text-center text-slate-500 text-sm">
        职镜 JobLens · AI 岗位识别与求职陪练助手
      </footer>
    </div>
  );
}
