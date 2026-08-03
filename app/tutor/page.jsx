"use client";

import { useEffect, useRef, useState } from "react";
import BlueprintDrawing, { HIDDEN_LINES } from "./BlueprintDrawing";
import "./tutor.css";

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
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [found, setFound] = useState([]);
  const [highlightId, setHighlightId] = useState("pocket-floor");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

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
    e.preventDefault();
    if (!input.trim() || loading) return;

    const text = input.trim();
    setInput("");
    const updatedMessages = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: text },
    ];
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    await askAI(updatedMessages, found);
  }

  function handleReset() {
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

  return (
    <div className="tutor-page">
      <header className="tutor-header">
        <div>
          <h1>Blueprint Tutor</h1>
          <p>Mounting Bracket — DWG BR-2847-A</p>
        </div>
        <div className="tutor-progress">
          Found: {found.length} / {HIDDEN_LINES.length}
          <button type="button" onClick={handleReset} className="reset-btn">
            Restart
          </button>
        </div>
      </header>

      <section className="picture-panel">
        <BlueprintDrawing found={found} highlightId={highlightId} onLineClick={handleLineClick} />
        <p className="picture-hint">Click the thin dashed hidden lines on the drawing</p>
      </section>

      <section className="chat-panel">
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
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()}>
            Send
          </button>
        </form>
      </section>
    </div>
  );
}
