"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function speakWithBrowser(text, onStart, onEnd) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.92;
  utterance.onstart = onStart;
  utterance.onend = onEnd;
  utterance.onerror = onEnd;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export function useTutorVoice() {
  const [voiceOn, setVoiceOn] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceEngine, setVoiceEngine] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition || "speechSynthesis" in window);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      if (audioRef.current.src?.startsWith("blob:")) {
        URL.revokeObjectURL(audioRef.current.src);
      }
      audioRef.current = null;
    }
    setSpeaking(false);
  }, []);

  const playOpenAIVoice = useCallback(async (text, onStart, onEnd) => {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice: "onyx" }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Voice error (${res.status})`);
    }

    const blob = await res.blob();
    if (!blob.size) throw new Error("Empty audio response.");

    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audioRef.current = audio;

    await new Promise((resolve, reject) => {
      audio.onplay = onStart;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        onEnd();
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        onEnd();
        reject(new Error("Audio playback failed."));
      };
      audio.play().catch(reject);
    });
  }, []);

  const speakNow = useCallback(
    async (text) => {
      if (!voiceOn || !text || typeof window === "undefined") return false;

      stopSpeaking();
      const onStart = () => setSpeaking(true);
      const onEnd = () => setSpeaking(false);

      try {
        await playOpenAIVoice(text, onStart, onEnd);
        setVoiceEngine("openai");
        setVoiceError("");
        return true;
      } catch (err) {
        if (window.speechSynthesis) {
          try {
            speakWithBrowser(
              text,
              () => {
                setVoiceEngine("browser");
                setVoiceError("Using browser voice — OpenAI unavailable.");
                onStart();
              },
              onEnd
            );
            return true;
          } catch {
            // fall through
          }
        }
        setVoiceEngine("error");
        setVoiceError(err?.message || "Voice unavailable.");
        onEnd();
        return false;
      }
    },
    [voiceOn, stopSpeaking, playOpenAIVoice]
  );

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const startListening = useCallback(
    (onResult) => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) return;

      stopSpeaking();
      stopListening();

      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setListening(true);
      recognition.onend = () => setListening(false);
      recognition.onerror = () => setListening(false);
      recognition.onresult = (event) => {
        const text = event.results[0]?.[0]?.transcript?.trim();
        if (text) onResult(text);
      };

      recognitionRef.current = recognition;
      recognition.start();
    },
    [stopSpeaking, stopListening]
  );

  useEffect(() => {
    return () => {
      stopSpeaking();
      stopListening();
    };
  }, [stopSpeaking, stopListening]);

  return {
    voiceOn,
    setVoiceOn,
    speaking,
    listening,
    speechSupported,
    voiceEngine,
    voiceError,
    speakNow,
    stopSpeaking,
    startListening,
    stopListening,
  };
}
