"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useTutorVoice() {
  const [voiceOn, setVoiceOn] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceEngine, setVoiceEngine] = useState("openai");
  const [voiceError, setVoiceError] = useState("");
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const pendingTextRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      if (audioRef.current.src) URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
    setSpeaking(false);
  }, []);

  const playOpenAIVoice = useCallback(
    async (text, onStart, onEnd) => {
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
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      return new Promise((resolve, reject) => {
        audio.onplay = () => {
          setVoiceEngine("openai");
          setVoiceError("");
          onStart();
        };
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
    },
    []
  );

  const speak = useCallback(
    async (text, { userInitiated = false } = {}) => {
      if (!voiceOn || !text || typeof window === "undefined") return;

      stopSpeaking();
      const onStart = () => setSpeaking(true);
      const onEnd = () => setSpeaking(false);

      if (!userInitiated) {
        pendingTextRef.current = text;
        return;
      }

      pendingTextRef.current = null;

      try {
        await playOpenAIVoice(text, onStart, onEnd);
      } catch (err) {
        setVoiceEngine("error");
        setVoiceError(err?.message || "OpenAI voice unavailable.");
        onEnd();
      }
    },
    [voiceOn, stopSpeaking, playOpenAIVoice]
  );

  const speakNow = useCallback(
    (text) => speak(text, { userInitiated: true }),
    [speak]
  );

  const flushPendingSpeech = useCallback(() => {
    if (pendingTextRef.current) {
      const text = pendingTextRef.current;
      speak(text, { userInitiated: true });
    }
  }, [speak]);

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
    speak,
    speakNow,
    flushPendingSpeech,
    stopSpeaking,
    startListening,
    stopListening,
  };
}
