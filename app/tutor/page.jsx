"use client";

import { useEffect, useRef, useState } from "react";
import BlueprintDrawing, { HIDDEN_LINES } from "./BlueprintDrawing";
import LineIntro from "./LineIntro";
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

const INTRO_PROMPT = `You are a blueprint reading instructor. The student sees a simple diagram comparing VISIBLE lines (solid) and HIDDEN lines (dashed).

Rules:
- No emojis. Plain spoken English only.
- 2 short sentences max.
- Explain that hidden lines are dashed and show edges you cannot see from the outside.
- Tell them you will open the real print next so they can find hidden lines on a real drawing.`;

const PRINT_PROMPT = `You are a blueprint reading instructor. The student is now looking at a real mounting bracket print with FRONT VIEW and TOP VIEW.

Rules:
- No emojis. Plain spoken English only.
- 1-3 short sentences.
- Refer to FRONT VIEW and TOP VIEW by name.
- When pointing to a feature, end with exactly one tag:
  [HIGHLIGHT:pocket-floor] OR [HIGHLIGHT:hole-back] OR [HIGHLIGHT:slot-bottom]

Hidden lines to find:
1. pocket-floor — FRONT VIEW, floor of the internal pocket
2. hole-back — FRONT VIEW, back wall of the through hole
3. slot-bottom — TOP VIEW, bottom of the milled slot`;

const INTRO_SPEECH =
  "A hidden line is always dashed. It shows an edge you cannot see from the outside, like the floor inside a pocket. Let me open the print so you can find one.";

function applyInstructorReply(raw, setHighlightId, onPrint) {
  const { content, highlightId } = parseInstructorReply(raw);
  if (highlightId && onPrint) setHighlightId(highlightId);
  return content;
}

export default function TutorPage() {
  const [activeLesson] = useState("hidden-lines");
  const [phase, setPhase] = useState("waiting");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [found, setFound] = useState([]);
  const [highlightId, setHighlightId] = useState("pocket-floor");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  const lastSpokenRef = useRef("");

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
  const onPrint = phase === "print";

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, instructorLine]);

  async function speakInstructor(text) {
    if (!text || text === lastSpokenRef.current) return;
    lastSpokenRef.current = text;
    await speakNow(text);
  }

  async function askAI(newMessages, systemPrompt, currentFound, onPrintPhase) {
    setLoading(true);

    const progress =
      onPrintPhase &&
      `Student has found ${currentFound.length} of 3 hidden lines. Found: ${
        currentFound.length ? currentFound.join(", ") : "none yet"
      }.`;

    try {
      const res = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: progress ? systemPrompt + "\n\n" + progress : systemPrompt,
          messages: newMessages,
          max_tokens: 300,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errMsg = data.error || `AI error (${res.status})`;
        setMessages((prev) => [...prev, { role: "assistant", content: errMsg }]);
        return null;
      }

      const raw = data.content?.[0]?.text;
      if (!raw) return null;

      const reply = applyInstructorReply(raw, setHighlightId, onPrintPhase);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      lastSpokenRef.current = "";
      await speakInstructor(reply);
      return reply;
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection error. Please try again." },
      ]);
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function beginLesson() {
    stopSpeaking();
    lastSpokenRef.current = "";
    setPhase("intro");
    setMessages([]);
    setFound([]);
    setHighlightId("pocket-floor");

    setMessages([{ role: "assistant", content: INTRO_SPEECH }]);
    await speakInstructor(INTRO_SPEECH);

    await askAI(
      [{ role: "user", content: "Explain hidden lines using the diagram on screen." }],
      INTRO_PROMPT,
      [],
      false
    );
  }

  async function openPrint() {
    setPhase("print");
    lastSpokenRef.current = "";
    const openMsg =
      "Here is the real print. Look at the FRONT VIEW — find the dashed hidden line at the top pocket. Click it when you see it.";

    const history = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "assistant", content: openMsg },
    ];

    setMessages((prev) => [...prev, { role: "assistant", content: openMsg }]);
    await speakInstructor(openMsg);

    await askAI(
      [
        ...history,
        {
          role: "user",
          content:
            "The print is now open. Point to the pocket floor hidden line on the FRONT VIEW and ask the student to click it. Use [HIGHLIGHT:pocket-floor].",
        },
      ],
      PRINT_PROMPT,
      [],
      true
    );
  }

  function handleLineClick(line) {
    if (!onPrint || found.includes(line.id)) return;

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
          { role: "user", content: "I found the last hidden line. Congratulate me and wrap up." },
        ],
        PRINT_PROMPT,
        newFound,
        true
      );
    } else {
      const next = HIDDEN_LINES.find((l) => !newFound.includes(l.id));
      if (next) setHighlightId(next.id);
      askAI(updatedMessages, PRINT_PROMPT, newFound, true);
    }
  }

  async function handleSend(e) {
    e?.preventDefault();
    if (!input.trim() || loading || phase === "waiting") return;
    const text = input.trim();
    setInput("");
    const updatedMessages = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: text },
    ];
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    await askAI(updatedMessages, onPrint ? PRINT_PROMPT : INTRO_PROMPT, found, onPrint);
  }

  function handleMicClick() {
    if (listening) {
      stopListening();
      return;
    }
    startListening(async (text) => {
      setInput(text);
      const updatedMessages = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: text },
      ];
      setMessages((prev) => [...prev, { role: "user", content: text }]);
      await askAI(updatedMessages, onPrint ? PRINT_PROMPT : INTRO_PROMPT, found, onPrint);
    });
  }

  function handleReset() {
    stopSpeaking();
    setPhase("waiting");
    setMessages([]);
    setFound([]);
    setHighlightId("pocket-floor");
    lastSpokenRef.current = "";
  }

  function handleReplay() {
    if (instructorLine?.content) {
      lastSpokenRef.current = "";
      speakInstructor(instructorLine.content);
    }
  }

  const lesson = LESSONS.find((l) => l.id === activeLesson);
  const lessonActive = phase !== "waiting";

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
            {onPrint ? `Found ${found.length} of ${HIDDEN_LINES.length}` : phase === "intro" ? "Step 1: Learn the line" : "Not started"}
          </p>
          {!lessonActive ? (
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
            {phase === "intro"
              ? "Step 1 — Learn what a hidden line looks like"
              : phase === "print"
                ? `${lesson?.description} — DWG ${lesson?.drawing}`
                : "Click Begin Lesson to start"}
          </p>
        </div>
        <div className="content-body">
          {phase === "intro" && <LineIntro />}
          {phase === "print" && (
            <BlueprintDrawing found={found} highlightId={highlightId} onLineClick={handleLineClick} />
          )}
          {phase === "waiting" && (
            <div className="content-placeholder">
              <p>Your instructor will teach the line type first, then open the print.</p>
            </div>
          )}
          {phase === "intro" && (
            <button type="button" className="open-print-btn" onClick={openPrint}>
              Open the Print
            </button>
          )}
          {phase === "print" && (
            <p className="picture-hint">Click the dashed hidden lines on the drawing</p>
          )}
        </div>
      </main>

      <aside className="chat-panel">
        <div className="chat-header">
          <div>
            <h2>Instructor</h2>
            <p className="chat-status">
              {!lessonActive
                ? "Click Begin Lesson"
                : speaking
                  ? "Speaking"
                  : listening
                    ? "Listening"
                    : loading
                      ? "Thinking"
                      : voiceEngine === "openai"
                        ? "OpenAI voice"
                        : voiceEngine === "browser"
                          ? "Browser voice"
                          : voiceError
                            ? "Voice error"
                            : "Ready"}
            </p>
            {voiceError && <p className="chat-voice-error">{voiceError}</p>}
          </div>
          {lessonActive && (
            <div className="chat-header-actions">
              <button type="button" className="replay-btn" onClick={handleReplay} disabled={speaking || !instructorLine}>
                Replay
              </button>
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
            </div>
          )}
        </div>

        <div className="chat-messages">
          <div className="instructor-transcript">
            {!lessonActive ? (
              <p className="chat-placeholder">Click Begin Lesson to start.</p>
            ) : instructorLine ? (
              <p>{instructorLine.content}</p>
            ) : (
              <p className="chat-placeholder">Listening...</p>
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
          {speechSupported && lessonActive && (
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
            disabled={loading || !lessonActive}
          />
          <button type="submit" disabled={loading || !input.trim() || !lessonActive}>
            Send
          </button>
        </form>
      </aside>
    </div>
  );
}
