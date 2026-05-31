"use client";

import { useState, useRef, useCallback } from "react";

interface UseTTSOptions {
  voice?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

/** 浏览器内置语音合成（降级方案） */
function speakWithBrowserTTS(
  text: string,
  callbacks: { onStart?: () => void; onEnd?: () => void }
): SpeechSynthesisUtterance | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  // 尝试选一个中文语音
  const voices = window.speechSynthesis.getVoices();
  const chineseVoice = voices.find(
    (v) => v.lang.startsWith("zh") && v.localService
  );
  if (chineseVoice) utterance.voice = chineseVoice;

  utterance.onstart = () => callbacks.onStart?.();
  utterance.onend = () => callbacks.onEnd?.();

  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function useTTS(options: UseTTSOptions = {}) {
  const { voice = "longxiaochun", onStart, onEnd, onError } = options;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    // 停止阿里云 TTS 音频
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
    // 停止浏览器内置 TTS
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsSpeaking(false);
    setIsLoading(false);
  }, []);

  const speak = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      // 停止上一段
      stop();

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setIsLoading(true);

      try {
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voice }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`TTS 请求失败: ${response.status}`);
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onplay = () => {
          setIsLoading(false);
          setIsSpeaking(true);
          onStart?.();
        };

        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
          onEnd?.();
        };

        audio.onerror = () => {
          setIsSpeaking(false);
          setIsLoading(false);
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
          onError?.("音频播放失败");
        };

        await audio.play();
      } catch (error) {
        if ((error as Error).name === "AbortError") return;

        // 降级到浏览器内置语音合成
        console.warn("阿里云 TTS 不可用，降级使用浏览器内置语音合成");
        setIsLoading(false);

        const utterance = speakWithBrowserTTS(text, {
          onStart: () => {
            setIsSpeaking(true);
            onStart?.();
          },
          onEnd: () => {
            setIsSpeaking(false);
            utteranceRef.current = null;
            onEnd?.();
          },
        });

        if (utterance) {
          utteranceRef.current = utterance;
        } else {
          setIsSpeaking(false);
          // 浏览器也不支持，静默失败，不弹错误
        }
      }
    },
    [voice, stop, onStart, onEnd, onError]
  );

  return { speak, stop, isSpeaking, isLoading };
}
