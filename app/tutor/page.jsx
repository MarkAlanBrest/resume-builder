"use client";

import { useEffect, useRef, useState } from "react";
import "./tutor.css";

const HIDDEN_LINES = [
  {
    id: "top-slot",
    label: "hidden line across the top slot",
    x1: 120,
    y1: 95,
    x2: 280,
    y2: 95,
  },
  {
    id: "side-pocket",
    label: "hidden line on the side pocket",
    x1: 300,
    y1: 130,
    x2: 300,
    y2: 220,
  },
  {
    id: "bottom-hole",
    label: "hidden line around the bottom hole",
    x1: 175,
    y1: 255,
    x2: 225,
    y2: 255,
  },
];

const SYSTEM_PROMPT = `You are a patient blueprint reading instructor teaching a beginner.
The student is looking at a simple mechanical part drawing.
Hidden lines are shown as dashed lines — they represent edges you cannot see from the outside, like the inside of a slot or hole.

There are 3 hidden lines to find on this drawing:
1. A hidden line across the top slot
2. A hidden line on the side pocket
3. A hidden line around the bottom hole

Keep your answers short (1-3 sentences). Be encouraging.
When the student finds a hidden line, praise them briefly and invite them to find another.
If they click wrong, gently guide them — look for dashed lines.
If they ask what a hidden line is, explain simply.`;

function Blueprint({ found, highlightId, onLineClick }) {
  return (
    <svg
      viewBox="0 0 400 320"
      className="blueprint-svg"
      role="img"
      aria-label="Simple mechanical blueprint"
    >
      <rect width="400" height="320" fill="#0a1e33" />

      {/* Grid */}
      {[...Array(9)].map((_, i) => (
        <line
          key={`vg-${i}`}
          x1={40 * i}
          y1={0}
          x2={40 * i}
          y2={320}
          stroke="#1a3a5c"
          strokeWidth="0.5"
        />
      ))}
      {[...Array(9)].map((_, i) => (
        <line
          key={`hg-${i}`}
          x1={0}
          y1={40 * i}
          x2={400}
          y2={40 * i}
          stroke="#1a3a5c"
          strokeWidth="0.5"
        />
      ))}

      {/* Visible outline */}
      <rect
        x="80"
        y="60"
        width="240"
        height="200"
        fill="none"
        stroke="#7ec8e3"
        strokeWidth="2"
      />

      {/* Center lines */}
      <line
        x1="200"
        y1="60"
        x2="200"
        y2="260"
        stroke="#4a9eff"
        strokeWidth="1"
        strokeDasharray="20 6 4 6"
      />
      <line
        x1="80"
        y1="160"
        x2="320"
        y2="160"
        stroke="#4a9eff"
        strokeWidth="1"
        strokeDasharray="20 6 4 6"
      />

      {/* Hidden lines (dashed) */}
      {HIDDEN_LINES.map((line) => {
        const isFound = found.includes(line.id);
        const isHighlight = highlightId === line.id;

        return (
          <g key={line.id}>
            <line
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke={isFound ? "#4ade80" : isHighlight ? "#fbbf24" : "#94a3b8"}
              strokeWidth={isHighlight ? 3 : 2}
              strokeDasharray="8 5"
              className={isHighlight ? "line-pulse" : ""}
            />
            {/* Wide invisible click target */}
            <line
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="transparent"
              strokeWidth="20"
              style={{ cursor: "pointer" }}
              onClick={() => onLineClick(line)}
            />
          </g>
        );
      })}

      {/* Title block */}
      <rect x="260" y="270" width="120" height="40" fill="#0d2847" stroke="#7ec8e3" strokeWidth="1" />
      <text x="270" y="288" fill="#7ec8e3" fontSize="9" fontFamily="monospace">
        PART: BR-101
      </text>
      <text x="270" y="302" fill="#7ec8e3" fontSize="9" fontFamily="monospace">
        SCALE: 1:1
      </text>

      {/* Legend */}
      <line x1="30" y1="30" x2="60" y2="30" stroke="#94a3b8" strokeWidth="2" strokeDasharray="8 5" />
      <text x="68" y="34" fill="#94a3b8" fontSize="11" fontFamily="sans-serif">
        = Hidden line
      </text>
    </svg>
  );
}

export default function TutorPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [found, setFound] = useState([]);
  const [highlightId, setHighlightId] = useState("top-slot");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    askAI(
      [
        {
          role: "user",
          content:
            "Start the lesson. Greet the student, briefly explain what a hidden line is, point out the one at the top slot (it is highlighted in yellow), and ask them to click on it to begin.",
        },
      ],
      []
    );
  }, []);

  async function askAI(newMessages, currentFound) {
    setLoading(true);
    const progress = `Student has found ${currentFound.length} of 3 hidden lines. Found: ${
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
      const reply =
        data.content?.[0]?.text ||
        data.error ||
        "Sorry, I could not respond right now.";

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      return reply;
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection error. Please try again." },
      ]);
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
            content: "I found the last hidden line! Congratulate me and wrap up the lesson.",
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
    setMessages([]);
    setFound([]);
    setHighlightId("top-slot");
    askAI(
      [
        {
          role: "user",
          content:
            "Start the lesson over. Greet the student, briefly explain hidden lines, point out the top slot line (highlighted in yellow), and ask them to click it.",
        },
      ],
      []
    );
  }

  return (
    <div className="tutor-page">
      <header className="tutor-header">
        <div>
          <h1>Blueprint Tutor</h1>
          <p>Test version — click hidden lines, chat with the AI instructor</p>
        </div>
        <div className="tutor-progress">
          Found: {found.length} / {HIDDEN_LINES.length}
          <button type="button" onClick={handleReset} className="reset-btn">
            Restart
          </button>
        </div>
      </header>

      <section className="picture-panel">
        <Blueprint found={found} highlightId={highlightId} onLineClick={handleLineClick} />
        <p className="picture-hint">Click the dashed hidden lines on the drawing</p>
      </section>

      <section className="chat-panel">
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-bubble chat-bubble--${msg.role}`}>
              {msg.content}
            </div>
          ))}
          {loading && <div className="chat-bubble chat-bubble--assistant chat-typing">...</div>}
          <div ref={chatEndRef} />
        </div>

        <form className="chat-input-row" onSubmit={handleSend}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a question or reply..."
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
