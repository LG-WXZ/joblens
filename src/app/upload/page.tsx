"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, Image, X, Loader2 } from "lucide-react";

export default function UploadPage() {
  const router = useRouter();
  const [jobAdImage, setJobAdImage] = useState<File | null>(null);
  const [jobAdImagePreview, setJobAdImagePreview] = useState<string>("");
  const [jobAdText, setJobAdText] = useState("");
  const [jobAdSource, setJobAdSource] = useState("");
  const [jobAdLink, setJobAdLink] = useState("");
  const [jobAdCity, setJobAdCity] = useState("");

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [supplementNote, setSupplementNote] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleJobAdImageDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setJobAdImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setJobAdImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const handleJobAdImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setJobAdImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setJobAdImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleResumeSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setResumeFile(file);
    }
  };

  const hasJobAd = jobAdImage || jobAdText.trim();
  const hasResume = resumeFile || resumeText.trim();
  const canSubmit = hasJobAd && hasResume && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);

    const formData = new FormData();

    if (jobAdImage) {
      formData.append("jobAdImage", jobAdImage);
    }
    if (jobAdText.trim()) {
      formData.append("jobAdText", jobAdText.trim());
    }
    if (jobAdSource) formData.append("jobAdSource", jobAdSource);
    if (jobAdLink) formData.append("jobAdLink", jobAdLink);
    if (jobAdCity) formData.append("jobAdCity", jobAdCity);

    if (resumeFile) {
      formData.append("resumeFile", resumeFile);
    }
    if (resumeText.trim()) {
      formData.append("resumeText", resumeText.trim());
    }
    if (supplementNote) formData.append("supplementNote", supplementNote);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data?.error || "分析请求失败";
        throw new Error(errorMsg);
      }

      sessionStorage.setItem("analysisResult", JSON.stringify(data));
      router.push("/report");
    } catch (error) {
      console.error("提交失败:", error);
      const message = error instanceof Error ? error.message : "未知错误";
      alert(`分析失败：${message}`);
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return <AnalyzingView />;
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
        上传分析材料
      </h1>
      <p className="text-slate-400 mb-10">提交招聘广告和你的简历，AI 将为你生成全面的求职分析报告</p>

      {/* 招聘广告输入 */}
      <section className="glass-card p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Image className="w-5 h-5 text-indigo-400" />
          招聘广告
        </h2>

        {/* 图片上传 */}
        <div className="mb-4">
          <label className="block text-sm text-slate-400 mb-2">上传招聘广告截图</label>
          {jobAdImagePreview ? (
            <div className="relative rounded-xl overflow-hidden border border-indigo-500/20">
              <img src={jobAdImagePreview} alt="招聘广告" className="w-full max-h-64 object-contain bg-black/30" />
              <button
                onClick={() => { setJobAdImage(null); setJobAdImagePreview(""); }}
                className="absolute top-2 right-2 p-1.5 bg-red-500/80 rounded-full hover:bg-red-500 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ) : (
            <div
              className="upload-zone p-8 text-center cursor-pointer"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleJobAdImageDrop}
              onClick={() => document.getElementById("jobAdImageInput")?.click()}
            >
              <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">点击或拖拽上传招聘广告截图</p>
              <p className="text-slate-500 text-xs mt-1">支持 JPG、PNG 格式</p>
              <input
                id="jobAdImageInput"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleJobAdImageSelect}
              />
            </div>
          )}
        </div>

        {/* 文字粘贴 */}
        <div className="mb-4">
          <label className="block text-sm text-slate-400 mb-2">或粘贴招聘广告文字</label>
          <textarea
            value={jobAdText}
            onChange={(e) => setJobAdText(e.target.value)}
            placeholder="在此粘贴招聘广告的完整文字内容..."
            className="w-full h-32 p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 resize-none focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>

        {/* 可选信息 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">招聘来源平台（可选）</label>
            <input
              value={jobAdSource}
              onChange={(e) => setJobAdSource(e.target.value)}
              placeholder="如：BOSS直聘"
              className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">招聘链接（可选）</label>
            <input
              value={jobAdLink}
              onChange={(e) => setJobAdLink(e.target.value)}
              placeholder="https://..."
              className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">岗位城市（可选）</label>
            <input
              value={jobAdCity}
              onChange={(e) => setJobAdCity(e.target.value)}
              placeholder="如：杭州"
              className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
        </div>
      </section>

      {/* 简历输入 */}
      <section className="glass-card p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-400" />
          个人简历
        </h2>

        {/* 文件上传 */}
        <div className="mb-4">
          <label className="block text-sm text-slate-400 mb-2">上传简历文件</label>
          {resumeFile ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <FileText className="w-5 h-5 text-indigo-400" />
              <span className="text-sm text-white flex-1">{resumeFile.name}</span>
              <button
                onClick={() => setResumeFile(null)}
                className="p-1 hover:bg-red-500/20 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-red-400" />
              </button>
            </div>
          ) : (
            <div
              className="upload-zone p-8 text-center cursor-pointer"
              onClick={() => document.getElementById("resumeFileInput")?.click()}
            >
              <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">点击上传 PDF 或 Word 简历</p>
              <p className="text-slate-500 text-xs mt-1">支持 PDF、DOC、DOCX 格式</p>
              <input
                id="resumeFileInput"
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={handleResumeSelect}
              />
            </div>
          )}
        </div>

        {/* 文字粘贴 */}
        <div className="mb-4">
          <label className="block text-sm text-slate-400 mb-2">或粘贴简历文字</label>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="在此粘贴你的简历内容..."
            className="w-full h-32 p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 resize-none focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>

        {/* 补充说明 */}
        <div>
          <label className="block text-xs text-slate-500 mb-1">补充说明（可选）</label>
          <textarea
            value={supplementNote}
            onChange={(e) => setSupplementNote(e.target.value)}
            placeholder="如：我是2025届应届生，目前在找第一份正式工作..."
            className="w-full h-20 p-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 resize-none focus:outline-none focus:border-indigo-500/50"
          />
        </div>
      </section>

      {/* 提交按钮 */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`w-full py-4 rounded-xl text-lg font-semibold transition-all ${
          canSubmit
            ? "btn-glow"
            : "bg-slate-700/50 text-slate-500 cursor-not-allowed"
        }`}
      >
        开始智能分析
      </button>

      {!hasJobAd && !hasResume && (
        <p className="text-center text-slate-500 text-sm mt-3">请上传招聘广告和简历后开始分析</p>
      )}
    </div>
  );
}

function AnalyzingView() {
  const steps = [
    "正在识别招聘广告内容...",
    "正在判断岗位真实性...",
    "正在分析岗位是否值得投递...",
    "正在解析你的简历...",
    "正在判断你和岗位的匹配程度...",
    "正在生成优势、不足和准备建议...",
  ];

  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const totalSteps = steps.length;
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= totalSteps - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-xl mx-auto px-6 py-24 text-center">
      <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto mb-6" />
      <h2 className="text-2xl font-bold text-white mb-2">职镜正在为您详细分析</h2>
      <p className="text-slate-400 text-sm mb-8">过程需要大约两分钟，请您耐心等待！</p>
      <div className="space-y-4 text-left">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`flex items-center gap-3 transition-all duration-500 ${
              index <= currentStep ? "opacity-100" : "opacity-20"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                index < currentStep
                  ? "bg-green-400"
                  : index === currentStep
                  ? "bg-indigo-400 animate-pulse"
                  : "bg-slate-600"
              }`}
            />
            <span
              className={`text-sm ${
                index <= currentStep ? "text-slate-300" : "text-slate-600"
              }`}
            >
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
