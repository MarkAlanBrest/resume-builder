"use client";
import { useState } from "react";

export default function FinalizePage() {
  const [confirmed, setConfirmed] = useState(false);

  async function generateResume() {
    if (!confirmed) return;

    const data = JSON.parse(localStorage.getItem("resumeData")) || {};

    await fetch("/api/generateResume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ TEMPLATE: "Template", student: data })
    });
  }

  return (
    <>
      <input type="checkbox" onChange={e => setConfirmed(e.target.checked)} />
      <button onClick={generateResume}>Download</button>
    </>
  );
}