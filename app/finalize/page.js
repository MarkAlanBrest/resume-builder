"use client";
import { useState } from "react";

export default function FinalizePage() {
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  async function generateResume() {
    if (!confirmed) return;

    setLoading(true);

    const data = JSON.parse(localStorage.getItem("resumeData")) || {};

    const res = await fetch("/api/generateResume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        TEMPLATE: "Template",
        student: data
      })
    });

    if (!res.ok) {
      setLoading(false);
      alert("Resume generation failed");
      return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resume.docx";
    a.click();
    window.URL.revokeObjectURL(url);

    setLoading(false);
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Finalize Resume</h1>

      <label>
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
        />
        I confirm my resume information is correct
      </label>

      <br /><br />

      <button onClick={generateResume} disabled={!confirmed || loading}>
        {loading ? "Generating..." : "Download Resume"}
      </button>
    </div>
  );
}