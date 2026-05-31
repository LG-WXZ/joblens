import type { Metadata } from "next";
import StarfieldBackground from "@/components/StarfieldBackground";
import "./globals.css";

export const metadata: Metadata = {
  title: "职镜 JobLens - AI 岗位识别与求职陪练助手",
  description: "上传招聘广告和简历，AI 帮你判断岗位真伪、匹配程度，并提供简历优化、知识点梳理、练习题和模拟面试",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <StarfieldBackground />
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-[#0a0b1a]/60 backdrop-blur-xl border-b border-white/5">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
              J
            </div>
            <span className="text-lg font-semibold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
              职镜 JobLens
            </span>
          </a>
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <a href="/" className="hover:text-white transition-colors">首页</a>
            <a href="/upload" className="hover:text-white transition-colors">开始分析</a>
          </div>
        </nav>
        <main className="relative z-10 pt-16 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
