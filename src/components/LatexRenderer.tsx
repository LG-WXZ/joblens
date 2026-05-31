"use client";

import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";
import React from "react";

interface LatexRendererProps {
  content: string;
  className?: string;
}

/**
 * 将包含 LaTeX 公式的文本渲染为 React 元素
 * 支持 $...$ 行内公式和 $$...$$ 块级公式
 */
export default function LatexRenderer({ content, className = "" }: LatexRendererProps) {
  const elements: React.ReactNode[] = [];
  // 先处理块级公式 $$...$$，再处理行内公式 $...$
  const blockPattern = /\$\$([\s\S]+?)\$\$/g;
  const parts = content.split(blockPattern);

  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) {
      // 块级公式
      elements.push(
        <BlockMath key={`block-${i}`} math={parts[i].trim()} errorColor="#ff6b6b" />
      );
    } else {
      // 处理行内公式
      const inlinePattern = /\$([^\n$]+?)\$/g;
      const inlineParts = parts[i].split(inlinePattern);
      for (let j = 0; j < inlineParts.length; j++) {
        if (j % 2 === 1) {
          elements.push(
            <InlineMath key={`inline-${i}-${j}`} math={inlineParts[j].trim()} errorColor="#ff6b6b" />
          );
        } else if (inlineParts[j]) {
          elements.push(<span key={`text-${i}-${j}`}>{inlineParts[j]}</span>);
        }
      }
    }
  }

  return <div className={`whitespace-pre-wrap leading-relaxed ${className}`}>{elements}</div>;
}
