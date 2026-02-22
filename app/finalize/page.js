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
    if (!confirmed || loading) return;
    setLoading(true);

    try {
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
        },

        workExperience: d.workExperience || [],
        militaryService: d.militaryService || [],
        education: d.education || [],

        // ✅ NEW — send the correct arrays
        allCerts: d.allCerts || [],
        allSkills: d.allSkills || [],

        // ✅ NEW — correct flags for conditional template blocks
        hasProgramCerts: (d.allCerts?.length ?? 0) > 0,
        hasExtraSkills: (d.allSkills?.length ?? 0) > 0,

        careerContext: {
          objectives: d.objectives || "",
          jobTarget: d.jobTarget || "",
          notes: d.notes || ""
        }
      };

      const res = await fetch("/api/generateResume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        alert("Resume generation failed");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "resume.docx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert("Resume generation failed");
      console.error(e);
    } finally {
      setLoading(false);
    }
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
          width: "720px",
          background: "#fff",
          padding: "40px",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          textAlign: "center"
        }}
      >
        <h1 style={{ marginBottom: "10px" }}>Finalize Resume</h1>
        <p>Select a resume layout below.</p>

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
              onClick={() => !loading && setSelectedTemplate(t.id)}
              style={{
                height: "120px",
                border:
                  selectedTemplate === t.id
                    ? "3px solid #0b3c6d"
                    : "2px dashed #aaa",
                borderRadius: "6px",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                background:
                  selectedTemplate === t.id ? "#e6f0ff" : "#fafafa",
                userSelect: "none"
              }}
            >
              {t.label}
            </div>
          ))}
        </div>

        <label style={{ display: "block", marginBottom: "20px" }}>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            style={{ marginRight: "8px" }}
            disabled={loading}
          />
          Students must agree to review their resume. They are responsible for
          the accuracy and final content of the document.
        </label>

        <button
          onClick={generateResume}
          disabled={!confirmed || loading}
          style={{
            padding: "14px 28px",
            fontSize: "16px",
            cursor: confirmed && !loading ? "pointer" : "not-allowed",
            background: loading ? "#999" : "#0b3c6d",
            color: "white",
            border: "none",
            borderRadius: "4px"
          }}
        >
          {loading ? "Resume being generated…" : "Download Resume"}
        </button>

        {loading && (
          <p style={{ color: "red", marginTop: "15px" }}>
            Resume being generated…
          </p>
        )}
      </div>
    </div>
  );
}
