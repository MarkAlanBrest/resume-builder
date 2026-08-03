"use client";

import { useEffect, useRef, useState } from "react";
import BlueprintDrawing, { HIDDEN_LINES } from "./BlueprintDrawing";
import { parseInstructorReply } from "./parseInstructorReply";
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

const SYSTEM_PROMPT = `You are a blueprint reading instructor. The student is looking at a real drawing on screen — do NOT describe the layout like a picture in chat. Speak to them as if you are standing next to the print.

Rules:
- No emojis. No markdown. Plain spoken English only.
- Keep answers to 1-3 short sentences.
- Refer to FRONT VIEW and TOP VIEW by name.
- Hidden lines are thin dashed lines showing edges you cannot see.
- When pointing to a feature, end your reply with exactly one tag on its own line:
  [HIGHLIGHT:pocket-floor] OR [HIGHLIGHT:hole-back] OR [HIGHLIGHT:slot-bottom]

The three hidden lines to teach:
1. pocket-floor — FRONT VIEW, floor of the internal pocket at the top
2. hole-back — FRONT VIEW, back wall of the through hole
3. slot-bottom — TOP VIEW, bottom of the milled slot

Be encouraging. When they find a line, praise them and guide them to the next.`;

const FALLBACK_INTRO =
  "Welcome. Look at the FRONT VIEW on the drawing. The thin dashed line at the top pocket is a hidden line — it shows the floor you cannot see. Click that dashed line to begin.";

function applyInstructorReply(raw, setHighlightId) {
  const { content, highlightId } = parseInstructorReply(raw);
  if (highlightId) setHighlightId(highlightId);
  return content;
}

export default function TutorPage() {
  const [activeLesson] = useState("hidden-lines");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [found, setFound] = useState([]);
  const [highlightId, setHighlightId] = useState("pocket-floor");
  const [loading, setLoading] = useState(false);
  const [lessonStarted, setLessonStarted] = useState(false);
  const chatEndRef = useRef(null);
  const initializedRef = useRef(false);
  const lastSpokenRef = useRef(-1);
  const {
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
  } = useTutorVoice();

  const instructorLine = [...messages].reverse().find((m) => m.role === "assistant");
  const studentLines = messages.filter((m) => m.role === "user");

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, instructorLine]);

  useEffect(() => {
    if (!lessonStarted) return;
    const lastIndex = messages.length - 1;
    const last = messages[lastIndex];
    if (!last || last.role !== "assistant") return;
    if (last.content === FALLBACK_INTRO) return;
    if (lastIndex <= lastSpokenRef.current) return;

    lastSpokenRef.current = lastIndex;
    speakNow(last.content);
  }, [messages, lessonStarted, speakNow]);

  function beginLesson() {
    if (initializedRef.current) return;
    initializedRef.current = true;
    setLessonStarted(true);
    setMessages([{ role: "assistant", content: FALLBACK_INTRO }]);
    askAI(
      [
        {
          role: "user",
          content:
            "Start the lesson. Greet the student, explain hidden lines briefly, point to the pocket floor line on the FRONT VIEW, and ask them to click it. Use [HIGHLIGHT:pocket-floor].",
        },
      ],
      [],
      true
    );
  }

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

      const raw = data.content?.[0]?.text;
      if (!raw) return;

      const reply = applyInstructorReply(raw, setHighlightId);

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

    const userNote = `I found the ${line.label}.`;
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
    setLessonStarted(true);
    setMessages([{ role: "assistant", content: FALLBACK_INTRO }]);
    setFound([]);
    setHighlightId("pocket-floor");
    askAI(
      [
        {
          role: "user",
          content:
            "Restart the lesson. Greet the student, explain hidden lines, point to the pocket floor line on the FRONT VIEW, and ask them to click it. Use [HIGHLIGHT:pocket-floor].",
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
          {!lessonStarted ? (
            <button type="button" onClick={beginLesson} className="begin-btn">
              Begin Lesson
            </button>
          ) : (
            <button type="button" onClick={handleReset} className="reset-btn">
              Restart Lesson
            </button>
          )}
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
          <p className="picture-hint">Click the dashed hidden lines on the drawing</p>
        </div>
      </main>

      <aside className="chat-panel">
        <div className="chat-header">
          <div>
            <h2>Instructor</h2>
            <p className="chat-status">
              {!lessonStarted
                ? "Click Begin Lesson"
                : speaking
                  ? "Speaking"
                  : listening
                    ? "Listening"
                    : loading
                      ? "Thinking"
                      : voiceEngine === "openai"
                        ? "OpenAI voice"
                        : voiceError
                          ? "Voice error"
                          : "Ready"}
            </p>
            {voiceError && <p className="chat-voice-error">{voiceError}</p>}
          </div>
          {lessonStarted && (
            <button
              type="button"
              className={`voice-toggle ${voiceOn ? "on" : ""}`}
              onClick={() => {
                if (voiceOn) stopSpeaking();
                setVoiceOn(!voiceOn);
              }}
            >
              {voiceOn ? "Voice on" : "Voice off"}
            </button>
          )}
        </div>

        <div className="chat-messages">
          <div className="instructor-transcript">
            {!lessonStarted ? (
              <p className="chat-placeholder">
                Click Begin Lesson to hear your instructor explain the drawing.
              </p>
            ) : instructorLine ? (
              <p>{instructorLine.content}</p>
            ) : (
              <p className="chat-placeholder">The instructor will speak and explain the drawing here.</p>
            )}
            {loading && <p className="chat-placeholder">Thinking...</p>}
          </div>

          {studentLines.length > 0 && (
            <div className="student-transcript">
              <h3>You said</h3>
              <ul>
                {studentLines.slice(-3).map((msg, i) => (
                  <li key={i}>{msg.content}</li>
                ))}
              </ul>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form className="chat-input-row" onSubmit={handleSend}>
          {speechSupported && lessonStarted && (
            <button
              type="button"
              className={`mic-btn ${listening ? "listening" : ""}`}
              onClick={handleMicClick}
              disabled={loading}
            >
              {listening ? "Stop" : "Talk"}
            </button>
          )}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={listening ? "Listening..." : "Type a question..."}
            disabled={loading || !lessonStarted}
          />
          <button type="submit" disabled={loading || !input.trim() || !lessonStarted}>
            Send
          </button>
        </form>
      </aside>
    </div>
  );
}
