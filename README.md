# 职镜 JobLens — AI 岗位识别与求职陪练 Agent

> 看清岗位，看清自己。

职镜是一个基于大模型的一站式智能求职助手。上传招聘广告和简历，AI 帮你完成从岗位分析到模拟面试的全流程。

---

## ✨ 核心功能

### 1. 岗位真实性判断
AI 自动识别招聘广告中的风险信号（虚假岗位、培训贷陷阱、信息模糊等），帮助求职者避坑。

### 2. 岗位匹配分析
将你的简历与岗位要求逐项对比，给出匹配程度评分和应聘机会判断。

### 3. 智能简历优化
针对目标岗位自动优化简历表达，强化关键词，突出量化成果和个人贡献。

### 4. 知识点梳理 & 定向练习题
根据岗位要求和你的短板，梳理高频考点，生成针对性练习题（支持 LaTeX 公式渲染）。

### 5. AI 模拟面试（语音交互）
- **快速面试**（3 题）/ **标准面试**（5 题）/ **压力面试**（8 题，每题限时 2 分钟）
- 面试官语音读题（TTS 语音合成）
- 用户语音作答（ASR 语音识别）
- 面试结束后生成详细评价报告

### 6. 一站式求职报告
所有分析结果汇总在一份综合报告中，支持复制导出。

---

## 🏗️ 技术架构

| 层级 | 技术 |
|------|------|
| **前端框架** | Next.js 15 + React 19 + TypeScript |
| **样式** | Tailwind CSS + 自定义 Glassmorphism 主题 |
| **文本模型** | 阿里云 DashScope — `qwen3.6-plus` |
| **视觉模型** | 阿里云 DashScope — `qwen3.6-plus`（多模态） |
| **语音识别 (ASR)** | 阿里云 DashScope — `qwen3-asr-flash` |
| **语音合成 (TTS)** | 硅基流动 SiliconFlow — `fnlp/MOSS-TTSD-v0.5` |
| **文件解析** | pdf-parse（PDF）、mammoth（Word） |
| **数学公式** | KaTeX + react-katex |
| **动效** | Framer Motion、CSS 动画 |

### 架构图

```
┌─────────────────────────────────────────┐
│              浏览器前端                   │
│  首页 → 上传页 → 报告页 → 练习页 → 面试页  │
│  [useASR] [useTTS] [LatexRenderer]      │
└────────────────┬────────────────────────┘
                 │ HTTP / SSE
┌────────────────▼────────────────────────┐
│           Next.js API Routes             │
│  /api/analyze   — 岗位分析（含图片OCR）    │
│  /api/optimize  — 简历优化               │
│  /api/practice  — 生成练习题             │
│  /api/interview — 模拟面试（流式SSE）     │
│  /api/asr       — 语音识别代理           │
│  /api/tts       — 语音合成代理           │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│            AI 模型服务                    │
│  阿里云 DashScope（文本/视觉/ASR）        │
│  硅基流动 SiliconFlow（TTS）             │
└─────────────────────────────────────────┘
```

---

## 🚀 快速开始

### 环境要求
- **Node.js** >= 18
- **npm** >= 9

### 安装 & 运行

```bash
# 1. 进入项目目录
cd 职镜智能体

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
```

启动后访问：`http://localhost:3000`

### 环境变量

项目根目录下的 `.env.local` 已包含所需 API Key，无需额外配置：

| 变量 | 说明 |
|------|------|
| `DASHSCOPE_API_KEY` | 阿里云 DashScope API Key |
| `DASHSCOPE_API_BASE` | DashScope 接口地址 |
| `SILICONFLOW_API_KEY` | 硅基流动 API Key |
| `TEXT_MODEL` | 文本模型名称 |
| `VISION_MODEL` | 视觉模型名称 |

---

## 📁 项目结构

```
职镜智能体/
├── src/
│   ├── app/
│   │   ├── page.tsx              # 首页
│   │   ├── upload/page.tsx       # 上传分析页
│   │   ├── report/page.tsx       # 综合报告页
│   │   ├── practice/page.tsx     # 定向练习题页
│   │   ├── interview/page.tsx    # 模拟面试页
│   │   ├── layout.tsx            # 全局布局
│   │   ├── globals.css           # 全局样式
│   │   └── api/
│   │       ├── analyze/route.ts  # 岗位分析 API
│   │       ├── optimize/route.ts # 简历优化 API
│   │       ├── practice/route.ts # 练习题生成 API
│   │       ├── interview/route.ts# 模拟面试 API（SSE）
│   │       ├── asr/route.ts      # 语音识别 API
│   │       └── tts/route.ts      # 语音合成 API
│   ├── components/
│   │   ├── StarfieldBackground.tsx # 星空背景动效
│   │   └── LatexRenderer.tsx     # LaTeX 公式渲染
│   ├── hooks/
│   │   ├── useASR.ts             # 语音识别 Hook
│   │   └── useTTS.ts             # 语音合成 Hook
│   ├── lib/
│   │   ├── ai.ts                 # AI 模型调用封装
│   │   └── prompts.ts            # 提示词管理
│   └── types/
│       └── pdf-parse.d.ts        # 类型声明
├── .env.local                    # 环境变量（API Key）
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.ts
```

---

## 🔄 使用流程

1. **上传材料** — 上传招聘广告截图（或粘贴文字）+ 简历（PDF/Word/文字）
2. **查看报告** — AI 生成岗位真实性判断、匹配分析、简历优化建议、知识点梳理
3. **刷练习题** — 根据岗位要求生成定向练习题，支持轻量（3题）和完整（8-10题）模式
4. **模拟面试** — AI 面试官语音提问，用户语音/文字作答，结束后生成面试评价

---

## 📝 License

本项目仅用于学习和毕业设计展示。
