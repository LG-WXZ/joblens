"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface UseASROptions {
  onResult?: (transcript: string) => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

/**
 * 语音识别 Hook —— 使用 MediaRecorder 录音 + 阿里云 Qwen3-ASR-Flash
 * 国内网络完全可用，无需翻墙
 */
export function useASR(options: UseASROptions = {}) {
  const { onResult, onEnd, onError } = options;
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia &&
      !!window.MediaRecorder;
    setIsSupported(supported);
  }, []);

  const sendToASR = useCallback(
    async (audioBlob: Blob) => {
      setIsProcessing(true);
      try {
        // 将音频 Blob 转为 base64
        const arrayBuffer = await audioBlob.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ""
          )
        );

        const response = await fetch("/api/asr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audioBase64: base64,
            mimeType: audioBlob.type || "audio/webm",
          }),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "识别失败");
        }

        const data = await response.json();
        const text = data.text || "";
        if (text) {
          setTranscript((prev) => {
            const combined = prev ? prev + text : text;
            onResult?.(combined);
            return combined;
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "语音识别失败";
        console.error("ASR错误:", message);
        onError?.(message);
      } finally {
        setIsProcessing(false);
        onEnd?.();
      }
    },
    [onResult, onEnd, onError]
  );

  const startListening = useCallback(async () => {
    if (!isSupported || isListening) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, {
          type: mediaRecorder.mimeType,
        });
        // 释放麦克风
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        if (audioBlob.size > 0) {
          sendToASR(audioBlob);
        }
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (error) {
      console.error("无法访问麦克风:", error);
      onError?.("无法访问麦克风，请检查浏览器权限");
      setIsListening(false);
    }
  }, [isSupported, isListening, sendToASR, onError]);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
  }, []);

  return {
    isListening,
    isProcessing,
    isSupported,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
  };
}
