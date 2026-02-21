"use client";
import { useState } from "react";

const templates = [
  { id: "Template", label: "Template 1 (Classic)" },
  { id: "TemplateA", label: "Template 2 (Modern)" },
  { id: "TemplateB", label: "Template 3 (Compact)" },
  { id: "TemplateC", label: "Template 4 (Creative)" }
];

export default function FinalizePage() {
  const [selectedTemplate, setSelectedTemplate] = useState("Template");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  async function generateResume() {
    if (!confirmed) return;
    setLoading(true);

    const d = JSON.parse(localStorage.getItem("resumeData")) || {};

    const payload = {
      TEMPLATE: selectedTemplate,
      student: {
        name: d.name || "",
        email: d.email || "",
        phone: d.phone || "",
        address: d.address || "",
        city: d.city || "",
        state: d.state || "",
        zip: d.zip || "",
        programCampus: d.programCampus || "",
        graduationDate: d.grad || ""
      }
    };

    const res = await fetch("/api/generateResume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    note;
    a.download = "resume.docx";
    a.click();
    URL.revokeObjectURL(url);

    setLoading(false);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f4f6f8"
      }}
    >
      <div
        style={{
          width: "700px",
          background: "#fff",
          padding: "40px",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          textAlign: "center"
        }}
      >
        <h1 style={{ marginBottom: "10px" }}>Finalize Resume</h1>
        <p>Select a resume layout below.</p>

        {/* TEMPLATE SELECTOR */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "15px",
            margin: "30px 0"
          }}
        >
          {templates.map((t) => (
            <div
              key={t.id}
              onClick={() => setSelectedTemplate(t.id)}
              style={{
                height: "120px",
                border:
                  selectedTemplate === t.id
                    ? "3px solid #0b3c6d"
                    : "2px dashed #aaa",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                background:
                  selectedTemplate === t.id ? "#e6f0ff" : "#fafafa"
              }}
            >
              {t.label}
            </div>
          ))}
        </div>

        {/* CONFIRMATION */}
        <label style={{ display: "block", marginBottom: "20px" }}>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            style={{ marginRight: "8px" }}
          />
          Students must agree to review their resume. They are responsible for
          the accuracy and final content of the document.
        </label>

        {/* ACTION BUTTON */}
        <button
          onClick={generateResume}
          disabled={!confirmed || loading}
          style={{
            padding: "14px 28px",
            fontSize: "16px",
            cursor:
              confirmed && !loading ? "pointer" : "not-allowed",
            background: "#0b3c6d",
            color: "white",
            border: "none",
            borderRadius: "4px"
          }}
        >
          {loading ? "Resume being generated…" : "Download Resume"}
        </button>

        {loading && (
          <p style={{ color: "red", marginTop: "15px" }}>
            Please wait while your resume is being generated.
          </p>
        )}
      </div>
    </div>
  );
}