"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

export default function FinalizePage() {
  const [selectedTemplate, setSelectedTemplate] = useState("Template");
  const [confirmed, setConfirmed] = useState(false);
  const [statusVisible, setStatusVisible] = useState(false);
  const [generalNotes, setGeneralNotes] = useState("");

  useEffect(() => {
    const cards = document.querySelectorAll(".template-card");

    cards.forEach(card => {
      const handler = () => {
        cards.forEach(c => c.classList.remove("selected"));
        card.classList.add("selected");
        setSelectedTemplate(card.dataset.template);
      };
      card.addEventListener("click", handler);
      card._handler = handler;
    });

    return () => {
      cards.forEach(card => {
        if (card._handler) {
          card.removeEventListener("click", card._handler);
        }
      });
    };
  }, []);

  function goBack() {
    window.location.href = "/education-military";
  }

  async function createResume() {
    setStatusVisible(true);

    const payload = window.buildResumePayload(generalNotes.trim());
    payload.TEMPLATE = selectedTemplate;

    try {
      const response = await fetch("/api/generateResume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Resume generation failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "resume.docx";
      a.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("There was an issue generating your resume.");
    }

    setStatusVisible(false);
  }

  return (
    <div className="chat">
      <link rel="stylesheet" href="/style.css" />

      <Script src="/js/buildResumePayload.js" strategy="beforeInteractive" />

      <style>{`
        .template-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 15px;
          margin-top: 10px;
        }
        .template-card {
          border: 2px solid #ccc;
          padding: 12px;
          cursor: pointer;
          text-align: center;
          background: #fff;
          min-height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          font-size: 1.1rem;
        }
        .template-card.selected {
          border-color: #0066cc;
          background: #eef5ff;
        }
        #statusMessage {
          margin-top: 15px;
          font-weight: bold;
          color: #0066cc;
        }
      `}</style>

      <div className="system">
        Your resume will be generated using the information you provided.
        <br /><br />
        <strong>Important:</strong> You must review your resume for accuracy
        before submitting it in Canvas.
      </div>

      <div className="system">Choose a resume style</div>

      <div className="template-grid">
        <div className="template-card selected" data-template="Template"><strong>Classic</strong></div>
        <div className="template-card" data-template="TemplateA"><strong>Modern</strong></div>
        <div className="template-card" data-template="TemplateB"><strong>Sidebar</strong></div>
        <div className="template-card" data-template="TemplateC"><strong>Minimal</strong></div>
      </div>

      <div className="system" style={{ marginTop: "15px" }}>
        Optional: General comments or requests
      </div>

      <textarea
        style={{ minHeight: "80px" }}
        value={generalNotes}
        onChange={(e) => setGeneralNotes(e.target.value)}
      />

      <label style={{ display: "block", marginTop: "15px" }}>
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
        />
        I understand that I must review my resume before submitting.
      </label>

      {statusVisible && (
        <div id="statusMessage">Your resume is being generated…</div>
      )}

      <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
        <button type="button" onClick={goBack}>Back</button>
        <button
          type="button"
          disabled={!confirmed}
          onClick={createResume}
        >
          Create Final Resume
        </button>
      </div>
    </div>
  );
}
