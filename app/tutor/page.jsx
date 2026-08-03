"use client";

import { useEffect, useRef, useState } from "react";
import BlueprintDrawing, { HIDDEN_LINES } from "./BlueprintDrawing";
import { useTutorVoice } from "./useTutorVoice";
import "./tutor.css";

const LESSONS = [
  {
    id: "hidden-lines",
    title: "Hidden Lines",
    drawing: "BR-2847-A",
    description: "Mounting Bracket",
  },
];

const SYSTEM_PROMPT = `You are a patient blueprint reading instructor teaching a beginner.
The student is studying a mechanical drawing of a mounting bracket with FRONT VIEW and TOP VIEW.

Hidden lines are thin dashed lines. They show edges you cannot see from that viewing angle.

There are 3 hidden lines to find:
1. FRONT VIEW — dashed line showing the floor of the internal pocket at the top of the part
2. FRONT VIEW — dashed line on the back wall of the through hole (left side of the hole)
3. TOP VIEW — dashed line at the bottom of the milled slot

Keep answers short (1-3 sentences). Be encouraging and practical.
When the student finds a hidden line, praise them and tell them how many are left.
If they ask what a hidden line is, explain simply with an example from this drawing.`;

const FALLBACK_INTRO =
  "Welcome! This is a mounting bracket drawing. Hidden lines are the thin dashed lines — they show edges you can't see from the outside. I've highlighted one in orange on the FRONT VIEW. Click that dashed line to begin.";

export default function TutorPage() {
  const [activeLesson] = useState("hidden-lines");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [found, setFound] = useState([]);
  const [highlightId, setHighlightId] = useState("pocket-floor");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  const initializedRef = useRef(false);
  const lastSpokenRef = useRef(-1);
  const {
    voiceOn,
    setVoiceOn,
    speaking,
    listening,
    speechSupported,
    speak,
    stopSpeaking,
    startListening,
    stopListening,
  } = useTutorVoice();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const lastIndex = messages.length - 1;
    const last = messages[lastIndex];
    if (!last || last.role !== "assistant") return;
    if (last.content === FALLBACK_INTRO) return;
    if (lastIndex <= lastSpokenRef.current) return;

    lastSpokenRef.current = lastIndex;
    speak(last.content);
  }, [messages, speak]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    setMessages([{ role: "assistant", content: FALLBACK_INTRO }]);
    askAI(
      [
        {
          role: "user",
          content:
            "Start the lesson. Greet the student, explain hidden lines briefly, point out the pocket floor hidden line on the FRONT VIEW (highlighted orange), and ask them to click it.",
        },
      ],
      [],
      true
    );
  }, []);

  async function askAI(newMessages, currentFound, replaceIntro = false) {
    setLoading(true);

    const progress = `Student has found ${currentFound.length} of 3 hidden lines. Found IDs: ${
      currentFound.length ? currentFound.join(", ") : "none yet"
    }.`;

    try {
      const res = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: SYSTEM_PROMPT + "\n\n" + progress,
          messages: newMessages,
          max_tokens: 300,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errMsg = data.error || `AI error (${res.status})`;
        if (!replaceIntro) {
          setMessages((prev) => [...prev, { role: "assistant", content: errMsg }]);
        }
        return;
      }

      const reply = data.content?.[0]?.text;
      if (!reply) return;

      if (replaceIntro) {
        setMessages([{ role: "assistant", content: reply }]);
        lastSpokenRef.current = -1;
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      }
    } catch {
      if (!replaceIntro) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Connection error. Please try again." },
        ]);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleLineClick(line) {
    if (found.includes(line.id)) return;

    const newFound = [...found, line.id];
    setFound(newFound);
    setHighlightId(null);

    const userNote = `I clicked on the ${line.label}.`;
    const updatedMessages = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: userNote },
    ];
    setMessages((prev) => [...prev, { role: "user", content: userNote }]);

    if (newFound.length === HIDDEN_LINES.length) {
      askAI(
        [
          ...updatedMessages,
          {
            role: "user",
            content: "I found the last hidden line. Congratulate me and wrap up.",
          },
        ],
        newFound
      );
    } else {
      const next = HIDDEN_LINES.find((l) => !newFound.includes(l.id));
      if (next) setHighlightId(next.id);
      askAI(updatedMessages, newFound);
    }
  }

  async function handleSend(e) {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const text = input.trim();
    setInput("");
    await sendUserMessage(text);
  }

  async function sendUserMessage(text) {
    const updatedMessages = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: text },
    ];
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    await askAI(updatedMessages, found);
  }

  function handleMicClick() {
    if (listening) {
      stopListening();
      return;
    }

    startListening((text) => {
      setInput(text);
      sendUserMessage(text);
    });
  }

  function handleReset() {
    stopSpeaking();
    lastSpokenRef.current = -1;
    setMessages([{ role: "assistant", content: FALLBACK_INTRO }]);
    setFound([]);
    setHighlightId("pocket-floor");
    askAI(
      [
        {
          role: "user",
          content:
            "Restart the lesson. Greet the student, explain hidden lines, point out the pocket floor line on the FRONT VIEW (orange highlight), and ask them to click it.",
        },
      ],
      [],
      true
    );
  }

  const lesson = LESSONS.find((l) => l.id === activeLesson);

  return (
    <div className="tutor-page">
      <nav className="nav-panel">
        <div className="nav-brand">
          <h1>Blueprint Tutor</h1>
          <p>AI Training</p>
        </div>

        <div className="nav-section">
          <h2>Lessons</h2>
          <ul className="nav-lessons">
            {LESSONS.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`nav-lesson-btn ${item.id === activeLesson ? "active" : ""}`}
                >
                  <span className="nav-lesson-title">{item.title}</span>
                  <span className="nav-lesson-meta">{item.drawing}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="nav-section nav-progress-section">
          <h2>Progress</h2>
          <p className="nav-progress">
            Found {found.length} of {HIDDEN_LINES.length}
          </p>
          <button type="button" onClick={handleReset} className="reset-btn">
            Restart Lesson
          </button>
        </div>
      </nav>

      <main className="content-panel">
        <div className="content-header">
          <h2>{lesson?.title}</h2>
          <p>
            {lesson?.description} — DWG {lesson?.drawing}
          </p>
        </div>
        <div className="content-body">
          <BlueprintDrawing found={found} highlightId={highlightId} onLineClick={handleLineClick} />
          <p className="picture-hint">Click the thin dashed hidden lines on the drawing</p>
        </div>
      </main>

      <aside className="chat-panel">
        <div className="chat-header">
          <div>
            <h2>Instructor</h2>
            <p>
              {speaking ? "Speaking..." : listening ? "Listening..." : "Ask questions or follow along"}
            </p>
          </div>
          {speechSupported && (
            <button
              type="button"
              className={`voice-toggle ${voiceOn ? "on" : ""}`}
              onClick={() => {
                if (voiceOn) stopSpeaking();
                setVoiceOn(!voiceOn);
              }}
              title={voiceOn ? "Mute instructor voice" : "Unmute instructor voice"}
            >
              {voiceOn ? "🔊" : "🔇"}
            </button>
          )}
        </div>

        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-bubble chat-bubble--${msg.role}`}>
              {msg.content}
            </div>
          ))}
          {loading && <div className="chat-bubble chat-bubble--assistant chat-typing">Thinking...</div>}
          <div ref={chatEndRef} />
        </div>

        <form className="chat-input-row" onSubmit={handleSend}>
          {speechSupported && (
            <button
              type="button"
              className={`mic-btn ${listening ? "listening" : ""}`}
              onClick={handleMicClick}
              disabled={loading}
              title={listening ? "Stop listening" : "Talk to instructor"}
            >
              🎤
            </button>
          )}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={listening ? "Listening..." : "Type or use the mic..."}
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()}>
            Send
          </button>
        </form>
      </aside>
    </div>
  );
}
