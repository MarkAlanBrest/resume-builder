"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function pickBrowserVoice() {
  const voices = window.speechSynthesis?.getVoices() || [];
  return (
    voices.find((v) => v.lang.startsWith("en") && /google|samantha|alex/i.test(v.name)) ||
    voices.find((v) => v.lang.startsWith("en-US")) ||
    voices.find((v) => v.lang.startsWith("en")) ||
    null
  );
}

function speakWithBrowser(text, onStart, onEnd) {
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = pickBrowserVoice();
  if (voice) utterance.voice = voice;
  utterance.rate = 0.92;
  utterance.pitch = 1;
  utterance.onstart = onStart;
  utterance.onend = onEnd;
  utterance.onerror = onEnd;
  window.speechSynthesis.speak(utterance);
}

export function useTutorVoice() {
  const [voiceOn, setVoiceOn] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    const hasTts = typeof window !== "undefined" && "speechSynthesis" in window;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const hasStt = !!SpeechRecognition;
    setSpeechSupported(hasTts || hasStt);

    if (hasTts) {
      const loadVoices = () => pickBrowserVoice();
      window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
      loadVoices();
      return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    async (text) => {
      if (!voiceOn || !text || typeof window === "undefined") return;

      stopSpeaking();
      const onStart = () => setSpeaking(true);
      const onEnd = () => setSpeaking(false);

      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audioRef.current = audio;
          audio.onplay = onStart;
          audio.onended = () => {
            URL.revokeObjectURL(url);
            onEnd();
          };
          audio.onerror = () => {
            URL.revokeObjectURL(url);
            onEnd();
          };
          await audio.play();
          return;
        }
      } catch {
        // fall through to browser voice
      }

      if (window.speechSynthesis) {
        speakWithBrowser(text, onStart, onEnd);
      }
    },
    [voiceOn, stopSpeaking]
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
    speak,
    stopSpeaking,
    startListening,
    stopListening,
  };
}
