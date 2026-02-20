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
      alert("Failed");
      setLoading(false);
      return;
    }

    setLoading(false);
    alert("API HIT OK");
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Finalize Resume</h1>

      <label>
        <input
          type="checkbox"
          checked={confirmed}
          onChange={e => setConfirmed(e.target.checked)}
        />
        Confirm
      </label>

      <br /><br />

      <button onClick={generateResume} disabled={!confirmed || loading}>
        {loading ? "Generating..." : "Generate"}
      </button>
    </div>
  );
}